package database

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.yaml.in/yaml/v3"
	"usecloudos/backend/internal/apppackage"
	"usecloudos/backend/internal/auth"
	"usecloudos/backend/internal/registry"
	"usecloudos/backend/internal/registrytest"
)

// Each run owns a temporary schema, never the live platform tables.
func TestPostgresRegistryAndSessions(t *testing.T) {
	connection := os.Getenv("USECLOUD_TEST_DATABASE_URL")
	if connection == "" {
		t.Skip("set USECLOUD_TEST_DATABASE_URL to run isolated PostgreSQL integration")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, connection)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	schema := fmt.Sprintf("usecloud_test_%d", time.Now().UnixNano())
	identifier := pgx.Identifier{schema}.Sanitize()
	if _, err = pool.Exec(ctx, "CREATE SCHEMA "+identifier); err != nil {
		t.Fatal(err)
	}
	defer func() {
		cleanup, stop := context.WithTimeout(context.Background(), 5*time.Second)
		defer stop()
		if _, err := pool.Exec(cleanup, "DROP SCHEMA "+identifier+" CASCADE"); err != nil {
			t.Error(err)
		}
	}()
	parsed, err := url.Parse(connection)
	if err != nil {
		t.Fatal(err)
	}
	query := parsed.Query()
	query.Set("search_path", schema)
	parsed.RawQuery = query.Encode()
	database, err := Open(ctx, parsed.String())
	if err != nil {
		t.Fatal(err)
	}
	defer database.Pool.Close()
	record := registry.Application{Manifest: registrytest.Manifest(), Status: "running", Trust: "unsigned", InstallPath: "/private/package", DataPath: "/private/data", Grants: []string{"system.read"}, InstalledAt: time.Now(), UpdatedAt: time.Now()}
	if err = database.Save(ctx, record); err != nil {
		t.Fatal(err)
	}
	loaded, err := database.Get(ctx, "example")
	if err != nil || !loaded.Has("system.read") || loaded.Has("docker.manage") || loaded.InstallPath != record.InstallPath {
		t.Fatalf("registry roundtrip: %v", err)
	}
	raw, _ := json.Marshal(loaded)
	if strings.Contains(string(raw), "/private/") {
		t.Fatal("private paths exposed")
	}
	list, err := database.List(ctx)
	if err != nil || len(list) != 1 {
		t.Fatal("registry list")
	}
	if err = database.Delete(ctx, "example"); err != nil {
		t.Fatal(err)
	}
	var grants int
	if err = database.Pool.QueryRow(ctx, "SELECT count(*) FROM app_permissions").Scan(&grants); err != nil || grants != 0 {
		t.Fatal("grants did not cascade")
	}
	authentication := auth.Auth{Pool: database.Pool}
	if err = authentication.Bootstrap(ctx, "test-only-long-password"); err != nil {
		t.Fatal(err)
	}
	login := httptest.NewRecorder()
	authentication.Login(login, httptest.NewRequest("POST", "http://localhost/api/v1/login", strings.NewReader(`{"username":"owner","password":"test-only-long-password"}`)))
	if login.Code != 200 {
		t.Fatalf("login: %d %s", login.Code, login.Body.String())
	}
	cookies := login.Result().Cookies()
	if len(cookies) != 1 || !cookies[0].HttpOnly {
		t.Fatal("session cookie")
	}
	handler := authentication.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if auth.User(r.Context()).Role != "admin" {
			t.Error("principal")
		}
		w.WriteHeader(204)
	}))
	request := httptest.NewRequest("GET", "http://localhost/api/v1/session", nil)
	request.AddCookie(cookies[0])
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != 204 {
		t.Fatal("session authentication")
	}
	authentication.Logout(httptest.NewRecorder(), request)
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != 401 {
		t.Fatal("revoked session accepted")
	}
	// Existing database migration is idempotent and preserves platform state.
	if err := database.migrate(ctx); err != nil {
		t.Fatal(err)
	}
	wrong := httptest.NewRecorder()
	authentication.Login(wrong, httptest.NewRequest("POST", "http://localhost/api/v1/login", strings.NewReader(`{"username":"owner","password":"wrong"}`)))
	if wrong.Code != 401 {
		t.Fatal("wrong password accepted")
	}
	loginAgain := httptest.NewRecorder()
	authentication.Login(loginAgain, httptest.NewRequest("POST", "http://localhost/api/v1/login", strings.NewReader(`{"username":"owner","password":"test-only-long-password"}`)))
	if loginAgain.Code != 200 {
		t.Fatal("second login")
	}
	second := httptest.NewRequest("DELETE", "http://localhost/api/v1/sessions", nil)
	second.AddCookie(loginAgain.Result().Cookies()[0])
	authentication.Protect(http.HandlerFunc(authentication.RevokeSessions)).ServeHTTP(httptest.NewRecorder(), second)
	denied := httptest.NewRecorder()
	handler.ServeHTTP(denied, second)
	if denied.Code != 401 {
		t.Fatal("revoke all failed")
	}
	loginAgain = httptest.NewRecorder()
	authentication.Login(loginAgain, httptest.NewRequest("POST", "http://localhost/api/v1/login", strings.NewReader(`{"username":"owner","password":"test-only-long-password"}`)))
	_, _ = database.Pool.Exec(ctx, "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id='owner'")
	expired := httptest.NewRequest("GET", "http://localhost/api/v1/session", nil)
	expired.AddCookie(loginAgain.Result().Cookies()[0])
	denied = httptest.NewRecorder()
	handler.ServeHTTP(denied, expired)
	if denied.Code != 401 {
		t.Fatal("expired session accepted")
	}
	var auditCount int
	if err := database.Pool.QueryRow(ctx, "SELECT count(*) FROM audit_events").Scan(&auditCount); err != nil || auditCount < 5 {
		t.Fatal("audit missing")
	}

	// Cryptographic validity and publisher trust are independent.
	stage := t.TempDir()
	manifest := registrytest.Manifest()
	manifest.Backend = nil
	rawManifest, _ := yaml.Marshal(manifest)
	_ = os.WriteFile(filepath.Join(stage, "manifest.yaml"), rawManifest, 0600)
	archive, err := apppackage.Pack(stage)
	if err != nil {
		t.Fatal(err)
	}
	public, key, _ := ed25519.GenerateKey(rand.Reader)
	archive, err = apppackage.Sign(archive, key, "test-publisher", "Test publisher")
	if err != nil {
		t.Fatal(err)
	}
	pack, err := apppackage.Inspect(archive)
	if err != nil {
		t.Fatal(err)
	}
	if err := database.ResolveTrust(ctx, pack); err != nil || pack.Trust != "signed" {
		t.Fatal("unknown publisher trusted")
	}
	if err := database.TrustPublisher(ctx, Publisher{KeyID: apppackage.Fingerprint(public), PublisherID: "test-publisher", Name: "Test publisher", PublicKey: base64.StdEncoding.EncodeToString(public)}); err != nil {
		t.Fatal(err)
	}
	if err := database.ResolveTrust(ctx, pack); err != nil || pack.Trust != "verified" {
		t.Fatal("trusted publisher not verified")
	}
	_, _ = database.Pool.Exec(ctx, "UPDATE publisher_keys SET revoked_at=now() WHERE key_id=$1", pack.Signature.KeyID)
	if database.ResolveTrust(ctx, pack) == nil || database.KeyAllowed(ctx, pack.Signature.KeyID) {
		t.Fatal("revoked publisher accepted")
	}
}
