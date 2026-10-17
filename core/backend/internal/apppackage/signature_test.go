package apppackage

import (
	"archive/zip"
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"go.yaml.in/yaml/v3"
	"io"
	"os"
	"path/filepath"
	"testing"
	"usecloudos/backend/internal/registrytest"
)

func signedFixture(t *testing.T) []byte {
	t.Helper()
	root := t.TempDir()
	m := registrytest.Manifest()
	m.Backend = nil
	raw, _ := yaml.Marshal(m)
	_ = os.WriteFile(filepath.Join(root, "manifest.yaml"), raw, 0600)
	_ = os.Mkdir(filepath.Join(root, "metadata"), 0700)
	_ = os.WriteFile(filepath.Join(root, "metadata/payload.txt"), []byte("fixture payload"), 0600)
	data, err := Pack(root)
	if err != nil {
		t.Fatal(err)
	}
	_, key, _ := ed25519.GenerateKey(rand.Reader)
	data, err = Sign(data, key, "test-only", "Test fixture publisher")
	if err != nil {
		t.Fatal(err)
	}
	return data
}
func TestRealEd25519Verification(t *testing.T) {
	data := signedFixture(t)
	p, err := Inspect(data)
	if err != nil || p.Trust != "signed" || p.Signature == nil {
		t.Fatal(err)
	}
	archive, _ := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	for _, changed := range []string{"manifest.yaml", signaturePath, "metadata/payload.txt"} {
		var buffer bytes.Buffer
		w := zip.NewWriter(&buffer)
		for _, f := range archive.File {
			if f.Name != changed {
				_ = w.Copy(f)
				continue
			}
			out, _ := w.Create(f.Name)
			if changed == signaturePath {
				_, _ = out.Write([]byte(`{"formatVersion":1,"algorithm":"Ed25519","publicKey":"wrong"}`))
			} else if changed == "manifest.yaml" {
				r, _ := f.Open()
				raw, _ := io.ReadAll(r)
				r.Close()
				_, _ = out.Write(bytes.Replace(raw, []byte("Example"), []byte("Examplf"), 1))
			} else {
				_, _ = out.Write([]byte("fixturf payload"))
			}
		}
		w.Close()
		if _, err := Inspect(buffer.Bytes()); err == nil {
			t.Fatal("tampered package accepted")
		}
	}
}

func TestWrongKeyAndSignatureAreRejected(t *testing.T) {
	data := signedFixture(t)
	p, err := Inspect(data)
	if err != nil {
		t.Fatal(err)
	}
	archive, _ := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	for _, variant := range []string{"key", "signature", "digest"} {
		s := *p.Signature
		switch variant {
		case "key":
			public, _, _ := ed25519.GenerateKey(rand.Reader)
			s.PublicKey = base64.StdEncoding.EncodeToString(public)
			s.KeyID = Fingerprint(public)
		case "signature":
			raw, _ := base64.StdEncoding.DecodeString(s.Value)
			raw[0] ^= 1
			s.Value = base64.StdEncoding.EncodeToString(raw)
		case "digest":
			s.Digest = "0000000000000000000000000000000000000000000000000000000000000000"
		}
		encoded, _ := json.Marshal(s)
		var out bytes.Buffer
		w := zip.NewWriter(&out)
		for _, f := range archive.File {
			if f.Name != signaturePath {
				_ = w.Copy(f)
			} else {
				entry, _ := w.Create(signaturePath)
				_, _ = entry.Write(encoded)
			}
		}
		w.Close()
		if _, err := Inspect(out.Bytes()); err == nil {
			t.Fatalf("accepted changed %s", variant)
		}
	}
}
func TestPrivateKeyPermissions(t *testing.T) {
	filename := filepath.Join(t.TempDir(), "test-only.pkcs8")
	if err := GenerateKey(filename); err != nil {
		t.Fatal(err)
	}
	if _, err := ReadKey(filename); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(filename, 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := ReadKey(filename); err == nil {
		t.Fatal("insecure key permissions accepted")
	}
}
