// Package apppackage implements bounded ZIP archives with no links or traversal.
package apppackage

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"image/png"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"usecloudos/backend/internal/manifest"
)

const MaxArchiveBytes = 128 << 20
const MaxExpandedBytes = 256 << 20

type Package struct {
	Manifest manifest.Manifest `json:"manifest"`
	Trust    string            `json:"trust"`
	Digest   string            `json:"digest"`
	archive  *zip.Reader
}

func Inspect(data []byte) (*Package, error) {
	if len(data) > MaxArchiveBytes {
		return nil, errors.New("package exceeds 128 MiB")
	}
	archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, errors.New("invalid ZIP package")
	}
	if len(archive.File) > 2048 {
		return nil, errors.New("too many package files")
	}
	seen := map[string]bool{}
	var total uint64
	var raw []byte
	for _, f := range archive.File {
		if f.UncompressedSize64 > MaxExpandedBytes { return nil, errors.New("package entry exceeds expanded limit") }
		name := strings.TrimSuffix(f.Name, "/")
		if !manifest.SafePath(name) || seen[name] || f.Mode()&os.ModeSymlink != 0 || (!f.Mode().IsRegular() && !f.FileInfo().IsDir()) {
			return nil, fmt.Errorf("unsafe/duplicate package entry %q", f.Name)
		}
		seen[name] = true
		total += f.UncompressedSize64
		if total > MaxExpandedBytes {
			return nil, errors.New("expanded package exceeds 256 MiB")
		}
		if name == "manifest.yaml" {
			if f.UncompressedSize64 > 65536 {
				return nil, errors.New("manifest too large")
			}
			r, err := f.Open()
			if err != nil {
				return nil, err
			}
			raw, err = io.ReadAll(io.LimitReader(r, 65537))
			r.Close()
			if err != nil {
				return nil, err
			}
		}
		if strings.HasPrefix(name, "signature/") {
			return nil, errors.New("signature verification is not yet implemented; signed packages must not be accepted as unsigned")
		}
	}
	m, err := manifest.Parse(raw)
	if err != nil {
		return nil, err
	}
	if m.Frontend != nil && m.Frontend.Type == "web-component" && !seen[m.Frontend.Entry] {
		return nil, errors.New("frontend entry missing")
	}
	if m.Backend != nil && !seen[m.Backend.Executable] {
		return nil, errors.New("backend executable missing")
	}
	if m.Frontend != nil { for _, style := range m.Frontend.Styles { if !seen[style] { return nil, errors.New("frontend stylesheet missing") } } }
	if strings.HasPrefix(m.Navigation.Icon,"assets/"){
		found:=false
		for _,file:=range archive.File{if file.Name!=m.Navigation.Icon{continue};found=true;if file.UncompressedSize64>256<<10{return nil,errors.New("icon exceeds 256 KiB")};reader,err:=file.Open();if err!=nil{return nil,err};config,err:=png.DecodeConfig(io.LimitReader(reader,256<<10));reader.Close();if err!=nil||config.Width>512||config.Height>512||config.Width<1||config.Height<1{return nil,errors.New("invalid icon dimensions/format")}}
		if !found{return nil,errors.New("icon asset missing")}
	}
	sum := sha256.Sum256(data)
	return &Package{Manifest: m, Trust: "unsigned", Digest: hex.EncodeToString(sum[:]), archive: archive}, nil
}

// Extract requires a newly-created private staging directory. No pre-existing
// paths, symlinks or executable modes from archive metadata are trusted.
func (p *Package) Extract(destination string) error {
	for _, f := range p.archive.File {
		target := filepath.Join(destination, filepath.FromSlash(f.Name))
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, 0750); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0750); err != nil {
			return err
		}
		mode := os.FileMode(0640)
		if p.Manifest.Backend != nil && f.Name == p.Manifest.Backend.Executable {
			mode = 0750
		}
		output, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, mode)
		if err != nil {
			return err
		}
		input, err := f.Open()
		if err != nil {
			output.Close()
			return err
		}
		_, copyErr := io.Copy(output, io.LimitReader(input, MaxExpandedBytes+1))
		input.Close()
		closeErr := output.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
	}
	return nil
}

// Pack includes only canonical directories; ZIP timestamps and modes are stable.
func Pack(source string) ([]byte, error) {
	var files []string
	err := filepath.WalkDir(source, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if p == source {
			return nil
		}
		rel, _ := filepath.Rel(source, p)
		rel = filepath.ToSlash(rel)
		root := strings.Split(rel, "/")[0]
		if root != "manifest.yaml" && root != "frontend" && root != "backend" && root != "assets" && root != "metadata" && root != "signature" {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.Type()&os.ModeSymlink != 0 {
			return errors.New("package source contains symlink")
		}
		if !d.IsDir() {
			files = append(files, rel)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	var buffer bytes.Buffer
	writer := zip.NewWriter(&buffer)
	for _, name := range files {
		header := &zip.FileHeader{Name: name, Method: zip.Deflate}
		header.SetModTime(time.Date(1980, 1, 1, 0, 0, 0, 0, time.UTC))
		header.SetMode(0644)
		out, err := writer.CreateHeader(header)
		if err != nil {
			return nil, err
		}
		file, err := os.Open(filepath.Join(source, name))
		if err != nil {
			return nil, err
		}
		_, err = io.Copy(out, file)
		file.Close()
		if err != nil {
			return nil, err
		}
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}
	data := buffer.Bytes()
	_, err = Inspect(data)
	return data, err
}
