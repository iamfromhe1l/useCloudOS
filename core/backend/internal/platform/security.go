package platform

import (
	"encoding/json"
	"net/http"
	"usecloudos/backend/internal/database"
	"usecloudos/backend/internal/gateway"
)

func (h HTTP) publishers(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	rows, err := h.Database.Pool.Query(r.Context(), "SELECT key_id,publisher_id,publisher_name,public_key,trusted,revoked_at IS NOT NULL FROM publisher_keys ORDER BY publisher_name")
	if err != nil {
		gateway.Error(w, 503, "TRUST_UNAVAILABLE", "Trust store unavailable")
		return
	}
	defer rows.Close()
	result := []database.Publisher{}
	for rows.Next() {
		var p database.Publisher
		if rows.Scan(&p.KeyID, &p.PublisherID, &p.Name, &p.PublicKey, &p.Trusted, &p.Revoked) != nil {
			gateway.Error(w, 503, "TRUST_UNAVAILABLE", "Trust store unavailable")
			return
		}
		result = append(result, p)
	}
	JSON(w, 200, map[string]any{"publishers": result})
}
func (h HTTP) trustPublisher(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	var p database.Publisher
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	if json.NewDecoder(r.Body).Decode(&p) != nil || h.Database.TrustPublisher(r.Context(), p) != nil {
		gateway.Error(w, 400, "INVALID_PUBLISHER", "Invalid or revoked publisher key")
		return
	}
	h.Auth.Audit(r, "publisher.trusted", p.KeyID, "success")
	w.WriteHeader(204)
}
func (h HTTP) revokePublisher(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	_, err := h.Database.Pool.Exec(r.Context(), "UPDATE publisher_keys SET trusted=false,revoked_at=now() WHERE key_id=$1", r.PathValue("id"))
	if err != nil {
		gateway.Error(w, 503, "TRUST_UNAVAILABLE", "Trust store unavailable")
		return
	}
	apps, err := h.Manager.Repository.List(r.Context())
	if err != nil {
		gateway.Error(w, 503, "REGISTRY_UNAVAILABLE", "Registry unavailable")
		return
	}
	for _, app := range apps {
		if app.PublisherKey == r.PathValue("id") {
			_ = h.Manager.Action(r.Context(), app.Manifest.Metadata.ID, "stop")
		}
	}
	h.Auth.Audit(r, "publisher.revoked", r.PathValue("id"), "success")
	w.WriteHeader(204)
}
func (h HTTP) permission(w http.ResponseWriter, r *http.Request) {
	if !admin(w, r) {
		return
	}
	var input struct {
		Granted bool `json:"granted"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1024)
	if json.NewDecoder(r.Body).Decode(&input) != nil {
		gateway.Error(w, 400, "INVALID_REQUEST", "Invalid permission request")
		return
	}
	if err := h.Manager.SetPermission(r.Context(), r.PathValue("id"), r.PathValue("permission"), input.Granted); err != nil {
		gateway.Error(w, 409, "PERMISSION_CHANGE_FAILED", "Permission changed but runtime may need recovery; refresh state")
		return
	}
	action := "app.permission.revoked"
	if input.Granted {
		action = "app.permission.granted"
	}
	h.Auth.Audit(r, action, r.PathValue("id")+":"+r.PathValue("permission"), "success")
	w.WriteHeader(204)
}
