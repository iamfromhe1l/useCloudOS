package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Principal struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}
type principalKey struct{}

func User(ctx context.Context) Principal { p, _ := ctx.Value(principalKey{}).(Principal); return p }

type Auth struct {
	Pool         *pgxpool.Pool
	Development  bool
	SecureCookie bool
	Origin       string
}

func (a Auth) Bootstrap(ctx context.Context, password string) error {
	if password == "" {
		return nil
	}
	var exists bool
	if err := a.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users)").Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	hash, err := HashPassword(password)
	if err != nil {
		return err
	}
	_, err = a.Pool.Exec(ctx, "INSERT INTO users(id,username,password_hash,role)VALUES('owner','owner',$1,'admin')ON CONFLICT(username)DO NOTHING", string(hash))
	return err
}
func fail(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"error": map[string]string{"code": "AUTH_REQUIRED", "message": message}})
}
func (a Auth) Login(w http.ResponseWriter, r *http.Request) {
	if !a.sameOrigin(r) {
		fail(w, 403, "Cross-origin request rejected")
		return
	}
	peer, _, _ := net.SplitHostPort(r.RemoteAddr)
	release, ok := loginAllowed(peer)
	if !ok {
		w.Header().Set("Retry-After", "900")
		fail(w, 429, "Too many sign-in attempts; try again later")
		return
	}
	defer release()
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	if json.NewDecoder(r.Body).Decode(&input) != nil {
		fail(w, 400, "Invalid credentials request")
		return
	}
	var p Principal
	var hash string
	err := a.Pool.QueryRow(r.Context(), "SELECT id,username,role,password_hash FROM users WHERE username=$1 AND disabled_at IS NULL", input.Username).Scan(&p.ID, &p.Username, &p.Role, &hash)
	if err != nil {
		hash = "$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	}
	valid, rehash := CheckPassword(hash, input.Password)
	if err != nil || !valid {
		a.Audit(r, "user.login.failed", "session", "denied")
		fail(w, 401, "Invalid credentials")
		return
	}
	if rehash {
		if next, e := HashPassword(input.Password); e == nil {
			_, _ = a.Pool.Exec(r.Context(), "UPDATE users SET password_hash=$1 WHERE id=$2", next, p.ID)
		}
	}
	token := make([]byte, 32)
	if _, err = rand.Read(token); err != nil {
		fail(w, 500, "Session unavailable")
		return
	}
	raw := hex.EncodeToString(token)
	digest := sha256.Sum256([]byte(raw))
	expiry := time.Now().Add(24 * time.Hour)
	tx, err := a.Pool.Begin(r.Context())
	if err != nil {
		fail(w, 503, "Session unavailable")
		return
	}
	defer tx.Rollback(r.Context())
	if _, err = tx.Exec(r.Context(), "INSERT INTO sessions(token_hash,user_id,expires_at)VALUES($1,$2,$3)", hex.EncodeToString(digest[:]), p.ID, expiry); err != nil {
		fail(w, 500, "Session unavailable")
		return
	}
	// A fresh login never adopts an existing identifier; revoke the presented session.
	if old := tokenHash(r); old != "" {
		if _, err = tx.Exec(r.Context(), "UPDATE sessions SET revoked_at=now() WHERE token_hash=$1", old); err != nil {
			fail(w, 503, "Session rotation unavailable")
			return
		}
	}
	if err = tx.Commit(r.Context()); err != nil {
		fail(w, 503, "Session unavailable")
		return
	}
	a.Audit(r, "user.login.success", p.ID, "success")
	http.SetCookie(w, &http.Cookie{Name: "usecloud_session", Value: raw, Path: "/", HttpOnly: true, Secure: a.SecureCookie, SameSite: http.SameSiteStrictMode, Expires: expiry, MaxAge: 86400})
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(p)
}
func (a Auth) Logout(w http.ResponseWriter, r *http.Request) {
	if !a.sameOrigin(r) {
		fail(w, 403, "Cross-origin request rejected")
		return
	}
	if cookie, err := r.Cookie("usecloud_session"); err == nil {
		digest := sha256.Sum256([]byte(cookie.Value))
		if _, err := a.Pool.Exec(r.Context(), "UPDATE sessions SET revoked_at=now() WHERE token_hash=$1", hex.EncodeToString(digest[:])); err != nil {
			fail(w, 503, "Session revocation unavailable")
			return
		}
	}
	a.Audit(r, "user.logout", "session", "success")
	http.SetCookie(w, &http.Cookie{Name: "usecloud_session", Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: a.SecureCookie, SameSite: http.SameSiteStrictMode})
	w.WriteHeader(204)
}
func SameOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return r.Header.Get("Sec-Fetch-Site") != "cross-site"
	}
	parsed, err := url.Parse(origin)
	return err == nil && parsed.Host == r.Host && (parsed.Scheme == "http" || parsed.Scheme == "https") && (r.TLS == nil || parsed.Scheme == "https")
}
func (a Auth) sameOrigin(r *http.Request) bool {
	if !SameOrigin(r) {
		return false
	}
	if a.Origin == "" {
		return true
	}
	origin, err := url.Parse(a.Origin)
	if err != nil || origin.Host != r.Host {
		return false
	}
	return r.Header.Get("Origin") == "" || r.Header.Get("Origin") == a.Origin
}
func (a Auth) Protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.sameOrigin(r) {
			fail(w, 403, "Cross-origin request rejected")
			return
		}
		var p Principal
		host, _, _ := net.SplitHostPort(r.RemoteAddr)
		ip := net.ParseIP(host)
		requestHost := r.Host
		if h, _, err := net.SplitHostPort(r.Host); err == nil {
			requestHost = h
		}
		if a.Development && ip != nil && ip.IsLoopback() && (requestHost == "localhost" || requestHost == "127.0.0.1" || requestHost == "::1") {
			p = Principal{ID: "development", Username: "development", Role: "admin"}
		} else {
			cookie, err := r.Cookie("usecloud_session")
			if err != nil || len(cookie.Value) != 64 {
				fail(w, 401, "Sign in required")
				return
			}
			digest := sha256.Sum256([]byte(cookie.Value))
			err = a.Pool.QueryRow(r.Context(), "SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND s.last_seen_at>now()-interval '12 hours' AND u.disabled_at IS NULL", hex.EncodeToString(digest[:])).Scan(&p.ID, &p.Username, &p.Role)
			if err != nil {
				fail(w, 401, "Sign in required")
				return
			}
			_, _ = a.Pool.Exec(r.Context(), "UPDATE sessions SET last_seen_at=now() WHERE token_hash=$1 AND last_seen_at<now()-interval '5 minutes'", hex.EncodeToString(digest[:]))
		}
		r.Header.Del("X-Usecloud-User")
		r.Header.Del("X-Usecloud-Role")
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), principalKey{}, p)))
	})
}

// Administrative users own capabilities today; ordinary users get read-only
// platform access. Per-user application ACL expansion remains additive.
func Allowed(p Principal, permission string) bool {
	return p.Role == "admin" || p.Role == "user" && (permission == "system.read" || strings.HasSuffix(permission, ".read"))
}
