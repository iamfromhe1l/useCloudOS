package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

func tokenHash(r *http.Request) string {
	c, err := r.Cookie("usecloud_session")
	if err != nil {
		return ""
	}
	sum := sha256.Sum256([]byte(c.Value))
	return hex.EncodeToString(sum[:])
}
func (a Auth) Audit(r *http.Request, action, target, result string) {
	actor := User(r.Context()).ID
	if action == "user.login.success" {
		actor = target
	}
	if actor == "" {
		actor = "anonymous"
	}
	_, err := a.Pool.Exec(r.Context(), "INSERT INTO audit_events(actor,action,target,result)VALUES($1,$2,$3,$4)", actor, action, target, result)
	if err != nil {
		slog.Error("audit persistence unavailable", "action", action, "actor", actor)
	}
}
func (a Auth) Sessions(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Pool.Query(r.Context(), "SELECT token_hash,created_at,expires_at,last_seen_at FROM sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 100", User(r.Context()).ID)
	if err != nil {
		fail(w, 503, "Sessions unavailable")
		return
	}
	defer rows.Close()
	result := []map[string]any{}
	for rows.Next() {
		var id string
		var created, expires, seen time.Time
		if rows.Scan(&id, &created, &expires, &seen) != nil {
			fail(w, 503, "Sessions unavailable")
			return
		}
		result = append(result, map[string]any{"id": id, "current": id == tokenHash(r), "createdAt": created, "expiresAt": expires, "lastSeenAt": seen})
	}
	if rows.Err() != nil {
		fail(w, 503, "Sessions unavailable")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"sessions": result})
}
func (a Auth) RevokeSessions(w http.ResponseWriter, r *http.Request) {
	keep := ""
	if r.URL.Query().Get("others") == "1" {
		keep = tokenHash(r)
	}
	_, err := a.Pool.Exec(r.Context(), "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND token_hash<>$2", User(r.Context()).ID, keep)
	if err != nil {
		fail(w, 503, "Session revocation unavailable")
		return
	}
	a.Audit(r, "user.sessions.revoked", User(r.Context()).ID, "success")
	w.WriteHeader(204)
}
