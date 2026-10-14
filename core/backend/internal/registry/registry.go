package registry

import (
	"context"
	"errors"
	"time"
	"usecloudos/backend/internal/manifest"
)

var ErrNotFound = errors.New("application not installed")

type Application struct {
	Manifest    manifest.Manifest `json:"manifest"`
	Status      string            `json:"status"`
	Trust       string            `json:"trust"`
	Digest      string            `json:"digest"`
	InstallPath string            `json:"-"`
	DataPath    string            `json:"-"`
	InstalledAt time.Time         `json:"installedAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
	LastError   string            `json:"lastError,omitempty"`
	Grants      []string          `json:"grants"`
}

func (a Application) Has(permission string) bool {
	for _, p := range a.Grants {
		if p == permission {
			return true
		}
	}
	return false
}

type Repository interface {
	List(context.Context) ([]Application, error)
	Get(context.Context, string) (Application, error)
	Save(context.Context, Application) error
	Delete(context.Context, string) error
	Event(context.Context, string, string, string) error
}
