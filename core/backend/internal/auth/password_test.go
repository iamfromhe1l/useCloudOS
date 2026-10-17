package auth

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestArgon2id(t *testing.T) {
	a, err := HashPassword("test-only-long-password")
	if err != nil {
		t.Fatal(err)
	}
	b, _ := HashPassword("test-only-long-password")
	if a == b || !strings.HasPrefix(a, "$argon2id$") {
		t.Fatal("salt/format")
	}
	if valid, rehash := CheckPassword(a, "test-only-long-password"); !valid || rehash {
		t.Fatal("valid password")
	}
	if valid, _ := CheckPassword(a, "wrong"); valid {
		t.Fatal("wrong password accepted")
	}
	for _, bad := range []string{"", "$argon2id$v=19$m=999999999,t=3,p=4$bad$bad"} {
		if valid, _ := CheckPassword(bad, "password"); valid {
			t.Fatal("invalid hash")
		}
	}
}
func TestSameOriginCSRF(t *testing.T) {
	r := httptest.NewRequest("POST", "http://localhost/api/v1/apps/install", nil)
	r.Header.Set("Origin", "https://evil.invalid")
	if SameOrigin(r) {
		t.Fatal("foreign origin allowed")
	}
	r.Header.Del("Origin")
	r.Header.Set("Sec-Fetch-Site", "cross-site")
	if SameOrigin(r) {
		t.Fatal("cross-site metadata allowed")
	}
	r.Header.Set("Sec-Fetch-Site", "same-origin")
	if !SameOrigin(r) {
		t.Fatal("same-origin rejected")
	}
}
