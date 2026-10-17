package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

// RFC 9106 memory-constrained profile. PHC encoding permits future rehashing.
func HashPassword(password string) (string, error) {
	if len(password) < 12 || len(password) > 1024 {
		return "", fmt.Errorf("password must be 12–1024 bytes")
	}
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key := argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
	b64 := base64.RawStdEncoding.EncodeToString
	return "$argon2id$v=19$m=65536,t=3,p=4$" + b64(salt) + "$" + b64(key), nil
}
func CheckPassword(encoded, password string) (valid, rehash bool) {
	if len(password) > 1024 {
		return false, false
	}
	if strings.HasPrefix(encoded, "$2") {
		return bcrypt.CompareHashAndPassword([]byte(encoded), []byte(password)) == nil, true
	}
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return false, false
	}
	var memory, iterations uint32
	var parallel uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallel); err != nil || memory < 8192 || memory > 131072 || iterations < 1 || iterations > 6 || parallel < 1 || parallel > 8 {
		return false, false
	}
	salt, e1 := base64.RawStdEncoding.DecodeString(parts[4])
	want, e2 := base64.RawStdEncoding.DecodeString(parts[5])
	if e1 != nil || e2 != nil || len(salt) != 16 || len(want) != 32 {
		return false, false
	}
	got := argon2.IDKey([]byte(password), salt, iterations, memory, parallel, 32)
	return subtle.ConstantTimeCompare(got, want) == 1, parts[3] != "m=65536,t=3,p=4"
}
