//go:build linux

package files

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"path"
	"sort"
	"strings"
	"sync"
	"time"

	"golang.org/x/sys/unix"
)

type Service struct {
	root      *os.File
	Writable  bool
	MaxUpload int64
	uploads   chan struct{}
	mu        sync.RWMutex
}
type Entry struct {
	Name     string    `json:"name"`
	Path     string    `json:"path"`
	Kind     string    `json:"kind"`
	Size     int64     `json:"size"`
	Modified time.Time `json:"modifiedAt"`
}

func New(root string, writable bool, max int64) (*Service, error) {
	fd, err := unix.Open(root, unix.O_PATH|unix.O_DIRECTORY|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0)
	if err != nil {
		return nil, err
	}
	s := &Service{root: os.NewFile(uintptr(fd), "storage"), Writable: writable, MaxUpload: max, uploads: make(chan struct{}, 2)}
	probe, err := s.open("", unix.O_RDONLY|unix.O_DIRECTORY, 0)
	if err != nil {
		s.Close()
		return nil, err
	}
	probe.Close()
	return s, nil
}
func (s *Service) Close() error { return s.root.Close() }
func (s *Service) open(name string, flags int, mode uint32) (*os.File, error) {
	if err := ValidatePath(name, true); err != nil {
		return nil, err
	}
	if name == "" {
		name = "."
	}
	fd, err := unix.Openat2(int(s.root.Fd()), name, &unix.OpenHow{Flags: uint64(flags | unix.O_CLOEXEC | unix.O_NOFOLLOW | unix.O_NONBLOCK), Mode: uint64(mode), Resolve: unix.RESOLVE_BENEATH | unix.RESOLVE_NO_SYMLINKS | unix.RESOLVE_NO_XDEV})
	if err != nil {
		return nil, err
	}
	return os.NewFile(uintptr(fd), name), nil
}
func (s *Service) parent(name string) (*os.File, string, error) {
	if err := ValidatePath(name, false); err != nil {
		return nil, "", err
	}
	parent := path.Dir(name)
	if parent == "." {
		parent = ""
	}
	f, err := s.open(parent, unix.O_RDONLY|unix.O_DIRECTORY, 0)
	return f, path.Base(name), err
}
func (s *Service) List(name, order string, hidden bool, offset, limit int) ([]Entry, int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	f, err := s.open(name, unix.O_RDONLY|unix.O_DIRECTORY, 0)
	if err != nil {
		return nil, 0, err
	}
	defer f.Close()
	result := []Entry{}
	for {
		items, err := f.Readdir(512)
		for _, item := range items {
			if strings.HasPrefix(item.Name(), ".upload-") {
				continue
			}
			if !hidden && strings.HasPrefix(item.Name(), ".") {
				continue
			}
			kind := "file"
			if item.IsDir() {
				kind = "directory"
			} else if item.Mode()&os.ModeSymlink != 0 {
				kind = "symlink"
			} else if !item.Mode().IsRegular() {
				continue
			}
			result = append(result, Entry{Name: item.Name(), Path: path.Join(name, item.Name()), Kind: kind, Size: item.Size(), Modified: item.ModTime().UTC()})
			if len(result) > 50000 {
				return nil, 0, unix.E2BIG
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, 0, err
		}
	}
	sort.Slice(result, func(i, j int) bool {
		a, b := result[i], result[j]
		if (a.Kind == "directory") != (b.Kind == "directory") {
			return a.Kind == "directory"
		}
		switch order {
		case "size":
			if a.Size != b.Size {
				return a.Size > b.Size
			}
		case "modified":
			if !a.Modified.Equal(b.Modified) {
				return a.Modified.After(b.Modified)
			}
		case "type":
			if a.Kind != b.Kind {
				return a.Kind < b.Kind
			}
		}
		return a.Name < b.Name
	})
	total := len(result)
	if offset > total {
		offset = total
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return result[offset:end], total, nil
}
func (s *Service) Mkdir(name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.Writable {
		return os.ErrPermission
	}
	f, base, err := s.parent(name)
	if err != nil {
		return err
	}
	defer f.Close()
	return unix.Mkdirat(int(f.Fd()), base, 02770)
}
func (s *Service) Move(source, target string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.Writable {
		return os.ErrPermission
	}
	f, base, err := s.parent(source)
	if err != nil {
		return err
	}
	defer f.Close()
	dest, dname, err := s.parent(target)
	if err != nil {
		return err
	}
	defer dest.Close()
	return unix.Renameat2(int(f.Fd()), base, int(dest.Fd()), dname, unix.RENAME_NOREPLACE)
}
func removeAt(parent int, name string, recursive bool) error {
	fd, err := unix.Openat2(parent, name, &unix.OpenHow{Flags: unix.O_RDONLY | unix.O_DIRECTORY | unix.O_NOFOLLOW | unix.O_CLOEXEC, Resolve: unix.RESOLVE_BENEATH | unix.RESOLVE_NO_SYMLINKS | unix.RESOLVE_NO_XDEV})
	if errors.Is(err, unix.ENOTDIR) || errors.Is(err, unix.ELOOP) {
		return unix.Unlinkat(parent, name, 0)
	}
	if err != nil {
		return err
	}
	f := os.NewFile(uintptr(fd), name)
	defer f.Close()
	if recursive {
		for {
			entries, err := f.Readdirnames(128)
			for _, entry := range entries {
				if err := removeAt(fd, entry, true); err != nil {
					return err
				}
			}
			if err == io.EOF {
				break
			}
			if err != nil {
				return err
			}
		}
	}
	return unix.Unlinkat(parent, name, unix.AT_REMOVEDIR)
}
func (s *Service) Delete(name string, recursive bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.Writable {
		return os.ErrPermission
	}
	f, base, err := s.parent(name)
	if err != nil {
		return err
	}
	defer f.Close()
	return removeAt(int(f.Fd()), base, recursive)
}
func (s *Service) Upload(name string, reader io.Reader) error {
	if !s.Writable {
		return os.ErrPermission
	}
	select {
	case s.uploads <- struct{}{}:
		defer func() { <-s.uploads }()
	default:
		return unix.EBUSY
	}
	f, base, err := s.parent(name)
	if err != nil {
		return err
	}
	defer f.Close()
	buf := make([]byte, 16)
	if _, err = rand.Read(buf); err != nil {
		return err
	}
	temporary := ".upload-" + hex.EncodeToString(buf)
	fd, err := unix.Openat(int(f.Fd()), temporary, unix.O_WRONLY|unix.O_CREAT|unix.O_EXCL|unix.O_NOFOLLOW|unix.O_CLOEXEC, 0660)
	if err != nil {
		return err
	}
	output := os.NewFile(uintptr(fd), temporary)
	defer unix.Unlinkat(int(f.Fd()), temporary, 0)
	n, copyErr := io.Copy(output, io.LimitReader(reader, s.MaxUpload+1))
	if copyErr == nil {
		copyErr = output.Sync()
	}
	closeErr := output.Close()
	if n > s.MaxUpload {
		return unix.EFBIG
	}
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}
	return unix.Renameat2(int(f.Fd()), temporary, int(f.Fd()), base, unix.RENAME_NOREPLACE)
}
func (s *Service) Download(name string) (*os.File, error) {
	if err := ValidatePath(name, false); err != nil {
		return nil, err
	}
	f, err := s.open(name, unix.O_RDONLY, 0)
	if err != nil {
		return nil, err
	}
	info, err := f.Stat()
	if err != nil || !info.Mode().IsRegular() {
		f.Close()
		return nil, unix.EINVAL
	}
	return f, nil
}
