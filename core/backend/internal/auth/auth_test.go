package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDevelopmentAuthIsLocalAndOriginBound(t *testing.T) {
	handler := Auth{Development: true}.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if User(r.Context()).ID != "development" {
			t.Fatal("identity")
		}
		w.WriteHeader(204)
	}))
	r := httptest.NewRequest("POST", "http://localhost/api/test", nil)
	r.RemoteAddr = "127.0.0.1:1"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)
	if w.Code != 204 {
		t.Fatal(w.Code)
	}
	r.Header.Set("Origin", "https://attacker.invalid")
	w = httptest.NewRecorder()
	handler.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("cross origin allowed")
	}
	if Allowed(Principal{Role: "user"}, "docker.manage") {
		t.Fatal("user can manage")
	}
}
