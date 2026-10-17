package appmanager

import (
	"context"
	"errors"
	"time"
)

func (m *Manager) SetPermission(ctx context.Context, id, permission string, grant bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, err := m.Repository.Get(ctx, id)
	if err != nil {
		return err
	}
	if permission == "storage.shared.write" && grant && !a.Has("storage.shared.read") {
		return errors.New("shared write requires shared read permission")
	}
	requested := false
	for _, p := range a.Manifest.Permissions {
		if p == permission {
			requested = true
		}
	}
	if !requested {
		return errors.New("permission not requested by application")
	}
	next := []string{}
	for _, p := range a.Grants {
		if p != permission && !(permission == "storage.shared.read" && !grant && p == "storage.shared.write") {
			next = append(next, p)
		}
	}
	if grant {
		next = append(next, permission)
	}
	a.Grants = next
	a.UpdatedAt = time.Now().UTC()
	// Persist denial BEFORE reconfiguring runtime. Even a failed restart cannot
	// restore a revoked gateway capability.
	if err = m.Repository.Save(ctx, a); err != nil {
		return err
	}
	if err = m.Runtime.Stop(ctx, a); err == nil {
		if a.Manifest.Runtime.Type == "container" {
			err = m.Runtime.Remove(ctx, a)
		}
	}
	if err == nil {
		if m.KeyAllowed != nil && !m.KeyAllowed(ctx, a.PublisherKey) {
			err = errors.New("publisher revoked")
		} else if !m.AllowUnsignedEmbedded && a.Manifest.Runtime.Type == "native" && (a.Trust != "verified" || a.PublisherKey == "") {
			err = errors.New("untrusted native application")
		} else {
			err = m.Runtime.Start(ctx, a)
		}
	}
	a.Status = m.Runtime.Status(ctx, a)
	if err != nil {
		a.Status = "failed"
	}
	_ = m.Repository.Save(ctx, a)
	return err
}
