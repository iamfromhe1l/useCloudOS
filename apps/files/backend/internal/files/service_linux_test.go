//go:build linux

package files

import (
	"bytes"
	"golang.org/x/sys/unix"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func service(t *testing.T) (*Service, string) {
	t.Helper()
	root := t.TempDir()
	s, err := New(root, true, 8<<20)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { s.Close() })
	return s, root
}
func TestPathsAndOperations(t *testing.T) {
	s, root := service(t)
	for _, value := range []string{"../../etc/passwd", "/etc/passwd", "%2e%2e/etc/passwd", "%252e%252e/etc/passwd", "a/../b", "a\x00", ".", "", "a\\b"} {
		if err := s.Mkdir(value); err == nil {
			t.Fatalf("accepted %q", value)
		}
	}
	outside := t.TempDir()
	if err := os.Symlink(outside, filepath.Join(root, "escape")); err != nil {
		t.Fatal(err)
	}
	if err := s.Upload("escape/pwn", strings.NewReader("bad")); err == nil {
		t.Fatal("symlink escaped")
	}
	if err := s.Mkdir("folder"); err != nil {
		t.Fatal(err)
	}
	if err := s.Upload("folder/unicode-🌿.txt", strings.NewReader("hello")); err != nil {
		t.Fatal(err)
	}
	if err := s.Upload("folder/unicode-🌿.txt", strings.NewReader("overwrite")); err != unix.EEXIST {
		t.Fatalf("conflict: %v", err)
	}
	if err := s.Move("folder/unicode-🌿.txt", "renamed.txt"); err != nil {
		t.Fatal(err)
	}
	if err := s.Move("renamed.txt", "../outside"); err == nil {
		t.Fatal("rename escaped")
	}
	f, err := s.Download("renamed.txt")
	if err != nil {
		t.Fatal(err)
	}
	data, _ := io.ReadAll(f)
	f.Close()
	if string(data) != "hello" {
		t.Fatal("wrong content")
	}
	if err := s.Delete("", true); err == nil {
		t.Fatal("deleted root")
	}
	if err := s.Upload("folder/file", strings.NewReader("test")); err != nil {
		t.Fatal(err)
	}
	if err := s.Delete("folder", false); err != unix.ENOTEMPTY {
		t.Fatal(err)
	}
	if err := s.Delete("folder", true); err != nil {
		t.Fatal(err)
	}
	s.MaxUpload = 2
	if err := s.Upload("large", strings.NewReader("1234")); err != unix.EFBIG {
		t.Fatal("oversize allowed")
	}
	if _, err := os.Stat(filepath.Join(root, "large")); !os.IsNotExist(err) {
		t.Fatal("partial upload published")
	}
	s.Writable = false
	if err := s.Mkdir("no"); err == nil {
		t.Fatal("read-only write")
	}
}
func TestHTTPAndAttachment(t *testing.T) {
	s, _ := service(t)
	name := "unicode 🌿 with spaces.html"
	if err := s.Upload(name, strings.NewReader("<script>alert(1)</script>")); err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest("GET", "/entries", nil)
	w := httptest.NewRecorder()
	s.Handler().ServeHTTP(w, request)
	if w.Code != 401 {
		t.Fatal("anonymous allowed")
	}
	request = httptest.NewRequest("GET", "/entries", nil)
	request.Header.Set("X-Usecloud-User", "user")
	w = httptest.NewRecorder()
	s.Handler().ServeHTTP(w, request)
	if w.Code != 403 {
		t.Fatal("revoked capability allowed")
	}
	server := httptest.NewServer(s.Handler())
	defer server.Close()
	request, _ = http.NewRequest("GET", server.URL+"/content?path=unicode%20%F0%9F%8C%BF%20with%20spaces.html", nil)
	request.Header.Set("X-Usecloud-User", "user")
	request.Header.Set("X-Usecloud-Permissions", "storage.shared.read")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 200 || !strings.HasPrefix(response.Header.Get("Content-Disposition"), "attachment;") || strings.ContainsAny(response.Header.Get("Content-Disposition"), "\r\n") || response.Header.Get("Content-Type") != "application/octet-stream" {
		t.Fatal("unsafe attachment headers")
	}
}
func TestThousandsOfEntriesAndStream(t *testing.T) {
	s, root := service(t)
	for i := 0; i < 3000; i++ {
		if err := os.WriteFile(filepath.Join(root, strings.Repeat("x", i%20)+string(rune(0x400+i))), nil, 0600); err != nil {
			t.Fatal(err)
		}
	}
	entries, total, err := s.List("", "name", false, 100, 100)
	if err != nil || len(entries) != 100 || total != 3000 {
		t.Fatalf("paging: %d %d %v", len(entries), total, err)
	}
	data := bytes.Repeat([]byte("stream"), 1<<20)
	if err := s.Upload("stream.bin", bytes.NewReader(data)); err != nil {
		t.Fatal(err)
	}
	f, err := s.Download("stream.bin")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	n, err := io.Copy(io.Discard, f)
	if err != nil || n != int64(len(data)) {
		t.Fatal("stream failed")
	}
}

func TestNestedMountIsNotTraversed(t *testing.T) {
	if os.Geteuid() != 0 {
		t.Skip("mount test requires explicit root in disposable Linux VM")
	}
	s, root := service(t)
	mount := filepath.Join(root, "mounted")
	if err := os.Mkdir(mount, 0700); err != nil {
		t.Fatal(err)
	}
	if err := unix.Mount("tmpfs", mount, "tmpfs", 0, "size=1m"); err != nil {
		t.Skipf("mount permission unavailable: %v", err)
	}
	defer unix.Unmount(mount, 0)
	if _, _, err := s.List("mounted", "name", false, 0, 10); err != unix.EXDEV {
		t.Fatalf("nested mount traversed: %v", err)
	}
}
