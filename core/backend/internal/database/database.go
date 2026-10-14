package database

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"usecloudos/backend/internal/registry"
	"usecloudos/backend/migrations"
)

type Database struct{ Pool *pgxpool.Pool }

func Open(ctx context.Context, url string) (*Database, error) {
	if url == "" {
		return nil, errors.New("CLOUD_CORE_DATABASE_URL is required; run make platform-bootstrap")
	}
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	d := &Database{pool}
	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	if err = d.migrate(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return d, nil
}
func (d *Database) migrate(ctx context.Context) error {
	tx, err := d.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(7265401); CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	entries, err := migrations.Files.ReadDir(".")
	if err != nil {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	for _, entry := range entries {
		var exists bool
		if err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name=$1)", entry.Name()).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		sql, err := migrations.Files.ReadFile(entry.Name())
		if err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("migration %s: %w", entry.Name(), err)
		}
		if _, err = tx.Exec(ctx, "INSERT INTO schema_migrations(name)VALUES($1)", entry.Name()); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// Disk paths are persisted explicitly, but never sent to the browser.
type stored struct {
	registry.Application
	Install string `json:"install"`
	Data    string `json:"data"`
}

func encode(a registry.Application) ([]byte, error) {
	return json.Marshal(stored{a, a.InstallPath, a.DataPath})
}
func decode(data []byte) (registry.Application, error) {
	var s stored
	err := json.Unmarshal(data, &s)
	s.InstallPath = s.Install
	s.DataPath = s.Data
	return s.Application, err
}
func (d *Database) List(ctx context.Context) ([]registry.Application, error) {
	rows, err := d.Pool.Query(ctx, "SELECT record FROM installed_apps ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []registry.Application{}
	for rows.Next() {
		var raw []byte
		if err = rows.Scan(&raw); err != nil {
			return nil, err
		}
		a, err := decode(raw)
		if err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}
func (d *Database) Get(ctx context.Context, id string) (registry.Application, error) {
	var raw []byte
	err := d.Pool.QueryRow(ctx, "SELECT record FROM installed_apps WHERE id=$1", id).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return registry.Application{}, registry.ErrNotFound
	}
	if err != nil {
		return registry.Application{}, err
	}
	return decode(raw)
}
func (d *Database) Save(ctx context.Context, a registry.Application) error {
	raw, err := encode(a)
	if err != nil {
		return err
	}
	tx, err := d.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, "INSERT INTO installed_apps(id,record)VALUES($1,$2) ON CONFLICT(id)DO UPDATE SET record=EXCLUDED.record,updated_at=now()", a.Manifest.Metadata.ID, raw); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, "INSERT INTO app_versions(app_id,version,digest)VALUES($1,$2,$3)ON CONFLICT(app_id,version)DO NOTHING", a.Manifest.Metadata.ID, a.Manifest.Metadata.Version, a.Digest); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, "DELETE FROM app_permissions WHERE app_id=$1", a.Manifest.Metadata.ID); err != nil {
		return err
	}
	for _, p := range a.Manifest.Permissions {
		if _, err = tx.Exec(ctx, "INSERT INTO app_permissions(app_id,permission,granted)VALUES($1,$2,$3)", a.Manifest.Metadata.ID, p, a.Has(p)); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
func (d *Database) Delete(ctx context.Context, id string) error {
	_, err := d.Pool.Exec(ctx, "DELETE FROM installed_apps WHERE id=$1", id)
	return err
}
func (d *Database) Event(ctx context.Context, id, event, detail string) error {
	_, err := d.Pool.Exec(ctx, "INSERT INTO app_events(app_id,type,detail)VALUES($1,$2,$3)", id, event, detail)
	return err
}
