package apppackage

import (
	"archive/zip"
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
)

const signaturePath = "signature/signature.json"

type Signature struct {
	FormatVersion int    `json:"formatVersion"`
	Algorithm     string `json:"algorithm"`
	KeyID         string `json:"keyId"`
	PublicKey     string `json:"publicKey"`
	PublisherID   string `json:"publisherId"`
	PublisherName string `json:"publisherName"`
	Digest        string `json:"digest"`
	Value         string `json:"signature"`
}

func Fingerprint(key []byte) string { s := sha256.Sum256(key); return hex.EncodeToString(s[:]) }
func canonicalDigest(archive *zip.Reader) (string, error) {
	files := append([]*zip.File{}, archive.File...)
	sort.Slice(files, func(i, j int) bool { return files[i].Name < files[j].Name })
	h := sha256.New()
	_, _ = io.WriteString(h, "usecloud-content-v1\n")
	for _, f := range files {
		if f.FileInfo().IsDir() || f.Name == signaturePath {
			continue
		}
		r, err := f.Open()
		if err != nil {
			return "", err
		}
		fh := sha256.New()
		n, err := io.Copy(fh, io.LimitReader(r, MaxExpandedBytes+1))
		r.Close()
		if err != nil {
			return "", err
		}
		if n > MaxExpandedBytes {
			return "", errors.New("entry too large")
		}
		_, _ = fmt.Fprintf(h, "%x %d %s\n", fh.Sum(nil), n, f.Name)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
func signingMessage(s Signature) []byte {
	encode := base64.StdEncoding.EncodeToString
	return []byte("usecloud-signature-v1\n" + s.Digest + "\n" + s.KeyID + "\n" + encode([]byte(s.PublisherID)) + "\n" + encode([]byte(s.PublisherName)) + "\n")
}
func verifySignature(archive *zip.Reader) (*Signature, error) {
	for _, f := range archive.File {
		if f.Name != signaturePath {
			continue
		}
		if f.UncompressedSize64 > 16384 {
			return nil, errors.New("signature metadata too large")
		}
		r, err := f.Open()
		if err != nil {
			return nil, err
		}
		defer r.Close()
		var s Signature
		decoder := json.NewDecoder(io.LimitReader(r, 16385))
		decoder.DisallowUnknownFields()
		if decoder.Decode(&s) != nil {
			return nil, errors.New("malformed signature metadata")
		}
		var extra any
		if decoder.Decode(&extra) != io.EOF {
			return nil, errors.New("invalid signature document")
		}
		if s.FormatVersion != 1 || s.Algorithm != "Ed25519" || len(s.PublisherID) > 100 || s.PublisherID == "" || len(s.PublisherName) > 100 || s.PublisherName == "" {
			return nil, errors.New("unsupported signature metadata")
		}
		key, e1 := base64.StdEncoding.DecodeString(s.PublicKey)
		sig, e2 := base64.StdEncoding.DecodeString(s.Value)
		digest, err := canonicalDigest(archive)
		if err != nil || e1 != nil || e2 != nil || len(key) != ed25519.PublicKeySize || s.KeyID != Fingerprint(key) || s.Digest != digest || !ed25519.Verify(key, signingMessage(s), sig) {
			return nil, errors.New("invalid package signature or modified package content")
		}
		return &s, nil
	}
	return nil, nil
}
func GenerateKey(filename string) error {
	_, key, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return err
	}
	data, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		return err
	}
	f, err := os.OpenFile(filename, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer f.Close()
	return pem.Encode(f, &pem.Block{Type: "PRIVATE KEY", Bytes: data})
}
func ReadKey(filename string) (ed25519.PrivateKey, error) {
	info, err := os.Stat(filename)
	if err != nil {
		return nil, err
	}
	if info.Mode().Perm()&0077 != 0 {
		return nil, errors.New("private key must have mode 0600")
	}
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("invalid private key")
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	key, ok := parsed.(ed25519.PrivateKey)
	if !ok {
		return nil, errors.New("Ed25519 private key required")
	}
	return key, nil
}
func Sign(data []byte, key ed25519.PrivateKey, publisherID, publisherName string) ([]byte, error) {
	p, err := Inspect(data)
	if err != nil {
		return nil, err
	}
	digest, err := canonicalDigest(p.archive)
	if err != nil {
		return nil, err
	}
	public := key.Public().(ed25519.PublicKey)
	s := Signature{FormatVersion: 1, Algorithm: "Ed25519", KeyID: Fingerprint(public), PublicKey: base64.StdEncoding.EncodeToString(public), PublisherID: publisherID, PublisherName: publisherName, Digest: digest}
	s.Value = base64.StdEncoding.EncodeToString(ed25519.Sign(key, signingMessage(s)))
	encoded, _ := json.Marshal(s)
	var out bytes.Buffer
	w := zip.NewWriter(&out)
	for _, f := range p.archive.File {
		if strings.HasPrefix(f.Name, "signature/") {
			continue
		}
		if err = w.Copy(f); err != nil {
			return nil, err
		}
	}
	header := &zip.FileHeader{Name: signaturePath, Method: zip.Deflate}
	header.SetMode(0644)
	entry, err := w.CreateHeader(header)
	if err != nil {
		return nil, err
	}
	if _, err = entry.Write(encoded); err != nil {
		return nil, err
	}
	if err = w.Close(); err != nil {
		return nil, err
	}
	result := out.Bytes()
	_, err = Inspect(result)
	return result, err
}
