// Package manifest defines the versioned application contract, not app business logic.
package manifest

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"path"
	"regexp"
	"strings"

	"github.com/Masterminds/semver/v3"
	"go.yaml.in/yaml/v3"
)

const APIVersion = "usecloud.io/v1"
const PlatformVersion = "0.1.0"
const PermissionVersion = "2"

var Permissions = map[string]string{
	"system.read": "Read system information", "storage.app-data": "Store application data",
	"storage.media.read": "Read media", "storage.media.write": "Write media",
	"network.lan": "Access local network", "network.internet": "Access Internet",
	"docker.read": "Read Docker containers", "docker.manage": "Manage Docker containers",
	"notifications.send": "Send notifications", "background.run": "Run in background",
	"storage.shared.read": "Read files in shared storage", "storage.shared.write": "Create, modify and permanently delete shared files",
}

func PermissionMetadata() map[string]map[string]string {
	result := map[string]map[string]string{}
	for id, title := range Permissions {
		risk := "low"
		if strings.HasPrefix(id, "storage.") || strings.HasPrefix(id, "docker.") {
			risk = "medium"
		}
		if strings.HasSuffix(id, ".write") || id == "docker.manage" {
			risk = "high"
		}
		result[id] = map[string]string{"id": id, "title": title, "description": title, "risk": risk, "category": strings.Split(id, ".")[0]}
	}
	return result
}

type Metadata struct {
	ID          string `json:"id" yaml:"id"`
	Name        string `json:"name" yaml:"name"`
	Version     string `json:"version" yaml:"version"`
	Description string `json:"description" yaml:"description"`
	Author      string `json:"author" yaml:"author"`
}
type Platform struct {
	MinVersion  string `json:"minVersion" yaml:"minVersion"`
	MaxVersion  string `json:"maxVersion,omitempty" yaml:"maxVersion,omitempty"`
	HostVersion int    `json:"hostVersion" yaml:"hostVersion"`
}
type Runtime struct {
	Type         string   `json:"type" yaml:"type"`
	Image        string   `json:"image,omitempty" yaml:"image,omitempty"`
	InternalPort int      `json:"internalPort,omitempty" yaml:"internalPort,omitempty"`
	Command      []string `json:"command,omitempty" yaml:"command,omitempty"`
}
type Frontend struct {
	Type    string   `json:"type" yaml:"type"`
	Entry   string   `json:"entry,omitempty" yaml:"entry,omitempty"`
	Element string   `json:"element,omitempty" yaml:"element,omitempty"`
	URL     string   `json:"url,omitempty" yaml:"url,omitempty"`
	Styles  []string `json:"styles,omitempty" yaml:"styles,omitempty"`
}
type Route struct {
	Method     string `json:"method" yaml:"method"`
	Path       string `json:"path" yaml:"path"`
	Permission string `json:"permission" yaml:"permission"`
}
type Backend struct {
	Type       string  `json:"type" yaml:"type"`
	Executable string  `json:"executable" yaml:"executable"`
	Socket     string  `json:"socket" yaml:"socket"`
	Routes     []Route `json:"routes" yaml:"routes"`
}
type Navigation struct {
	Desktop   bool   `json:"desktop" yaml:"desktop"`
	Dock      bool   `json:"dock" yaml:"dock"`
	Icon      string `json:"icon" yaml:"icon"`
	ColorRole string `json:"colorRole" yaml:"colorRole"`
}
type Manifest struct {
	APIVersion  string     `json:"apiVersion" yaml:"apiVersion"`
	Kind        string     `json:"kind" yaml:"kind"`
	Metadata    Metadata   `json:"metadata" yaml:"metadata"`
	Platform    Platform   `json:"platform" yaml:"platform"`
	Runtime     Runtime    `json:"runtime" yaml:"runtime"`
	Frontend    *Frontend  `json:"frontend,omitempty" yaml:"frontend,omitempty"`
	Backend     *Backend   `json:"backend,omitempty" yaml:"backend,omitempty"`
	Navigation  Navigation `json:"navigation" yaml:"navigation"`
	Permissions []string   `json:"permissions" yaml:"permissions"`
}

var idPattern = regexp.MustCompile(`^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`)
var elementPattern = regexp.MustCompile(`^[a-z][a-z0-9]*-[a-z0-9-]+$`)
var packagePathPattern = regexp.MustCompile(`^[A-Za-z0-9_./-]+$`)

func ValidID(id string) bool { return len(id) <= 63 && idPattern.MatchString(id) }
func SafePath(value string) bool {
	return packagePathPattern.MatchString(value) && !strings.HasPrefix(value, "/") && path.Clean(value) == value && value != "." && value != ".." && !strings.HasPrefix(value, "../")
}
func Parse(data []byte) (Manifest, error) {
	var m Manifest
	if len(data) > 65536 {
		return m, errors.New("manifest exceeds 64 KiB")
	}
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	decoder.KnownFields(true)
	if err := decoder.Decode(&m); err != nil {
		return m, fmt.Errorf("manifest: %w", err)
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return m, errors.New("manifest must contain one document")
	}
	return m, m.Validate()
}
func (m Manifest) Validate() error {
	if m.APIVersion != APIVersion || m.Kind != "App" {
		return errors.New("unsupported manifest apiVersion or kind")
	}
	if !ValidID(m.Metadata.ID) {
		return errors.New("invalid app id")
	}
	switch m.Metadata.ID {
	case "home", "settings", "store", "core":
		return errors.New("reserved app id")
	}
	if m.Metadata.Name == "" || len(m.Metadata.Name) > 100 || m.Metadata.Author == "" {
		return errors.New("name and author are required")
	}
	if _, err := semver.StrictNewVersion(m.Metadata.Version); err != nil {
		return errors.New("version must be SemVer")
	}
	min, err := semver.StrictNewVersion(m.Platform.MinVersion)
	if err != nil {
		return errors.New("platform.minVersion must be SemVer")
	}
	current := semver.MustParse(PlatformVersion)
	if current.LessThan(min) || m.Platform.HostVersion != 1 {
		return errors.New("incompatible platform/host version")
	}
	if m.Platform.MaxVersion != "" {
		max, err := semver.StrictNewVersion(m.Platform.MaxVersion)
		if err != nil || current.GreaterThan(max) {
			return errors.New("incompatible platform.maxVersion")
		}
	}
	seen := map[string]bool{}
	for _, p := range m.Permissions {
		if _, ok := Permissions[p]; !ok || seen[p] {
			return fmt.Errorf("invalid or duplicate permission %q", p)
		}
		seen[p] = true
	}
	switch m.Runtime.Type {
	case "native", "container", "external":
	default:
		return errors.New("unknown runtime")
	}
	if m.Runtime.Type == "container" && (m.Runtime.Image == "" || m.Runtime.InternalPort < 1 || m.Runtime.InternalPort > 65535) {
		return errors.New("container image and internalPort required")
	}
	if m.Runtime.Type != "container" && (m.Runtime.Image != "" || m.Runtime.InternalPort != 0) {
		return errors.New("container options require container runtime")
	}
	if len(m.Runtime.Command) > 32 || m.Runtime.Type != "container" && len(m.Runtime.Command) > 0 {
		return errors.New("command requires container runtime and at most 32 arguments")
	}
	for _, arg := range m.Runtime.Command {
		if len(arg) > 4096 || strings.ContainsRune(arg, '\x00') {
			return errors.New("invalid OCI command argument")
		}
	}
	if m.Frontend != nil {
		for _, style := range m.Frontend.Styles {
			if !SafePath(style) || !strings.HasPrefix(style, "frontend/") || !strings.HasSuffix(style, ".css") {
				return errors.New("invalid frontend stylesheet")
			}
		}
		switch m.Frontend.Type {
		case "web-component":
			if !SafePath(m.Frontend.Entry) || !strings.HasPrefix(m.Frontend.Entry, "frontend/") || !strings.HasSuffix(m.Frontend.Entry, ".js") || !elementPattern.MatchString(m.Frontend.Element) {
				return errors.New("invalid component entry/element")
			}
		case "external":
			if !strings.HasPrefix(m.Frontend.URL, "https://") && !strings.HasPrefix(m.Frontend.URL, "http://") {
				return errors.New("invalid external URL")
			}
		default:
			return errors.New("unknown frontend type")
		}
	}
	if m.Backend != nil {
		b := m.Backend
		if m.Runtime.Type != "native" || b.Type != "native" || !SafePath(b.Executable) || !strings.HasPrefix(b.Executable, "backend/") || b.Socket != m.Metadata.ID+".sock" {
			return errors.New("invalid native backend contract")
		}
		for _, r := range b.Routes {
			if (r.Method != "GET" && r.Method != "POST" && r.Method != "PUT" && r.Method != "DELETE") || !strings.HasPrefix(r.Path, "/") || strings.Contains(r.Path, "..") || !seen[r.Permission] {
				return errors.New("invalid backend permission route")
			}
		}
		if len(b.Routes) == 0 {
			return errors.New("backend permission routes required")
		}
	}
	if m.Navigation.ColorRole != "primary" && m.Navigation.ColorRole != "secondary" && m.Navigation.ColorRole != "tertiary" {
		return errors.New("invalid navigation colorRole")
	}
	if strings.HasPrefix(m.Navigation.Icon, "assets/") && (!SafePath(m.Navigation.Icon) || !strings.HasSuffix(m.Navigation.Icon, ".png")) {
		return errors.New("app icon must be a safe PNG asset")
	}
	return nil
}

// RequiredPermission is deny-by-default and independent of application domains.
func (m Manifest) RequiredPermission(method, requestPath string) (string, bool) {
	if m.Backend == nil {
		return "", false
	}
	for _, r := range m.Backend.Routes {
		if r.Method == method && (r.Path == requestPath || strings.HasSuffix(r.Path, "/*") && strings.HasPrefix(requestPath, strings.TrimSuffix(r.Path, "*"))) {
			return r.Permission, true
		}
	}
	return "", false
}
