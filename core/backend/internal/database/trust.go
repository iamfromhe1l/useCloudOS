package database

import (
	"context"
	"encoding/base64"
	"errors"
	"github.com/jackc/pgx/v5"
	"usecloudos/backend/internal/apppackage"
)

type Publisher struct {
	KeyID       string `json:"keyId"`
	PublisherID string `json:"publisherId"`
	Name        string `json:"name"`
	PublicKey   string `json:"publicKey"`
	Trusted     bool   `json:"trusted"`
	Revoked     bool   `json:"revoked"`
}

func (d *Database) ResolveTrust(ctx context.Context, p *apppackage.Package) error {
	if p.Signature == nil {
		p.Trust = "unsigned"
		return nil
	}
	p.Trust = "signed"
	var trusted bool
	var revoked bool
	var public, id, name string
	err := d.Pool.QueryRow(ctx, "SELECT trusted,revoked_at IS NOT NULL,public_key,publisher_id,publisher_name FROM publisher_keys WHERE key_id=$1", p.Signature.KeyID).Scan(&trusted, &revoked, &public, &id, &name)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if revoked {
		return errors.New("publisher key is revoked")
	}
	if public != p.Signature.PublicKey || id != p.Signature.PublisherID || name != p.Signature.PublisherName {
		return errors.New("publisher identity mismatch")
	}
	if trusted {
		p.Trust = "verified"
	}
	return nil
}
func (d *Database) KeyAllowed(ctx context.Context, key string) bool {
	if key == "" {
		return true
	}
	var revoked bool
	err := d.Pool.QueryRow(ctx, "SELECT revoked_at IS NOT NULL FROM publisher_keys WHERE key_id=$1", key).Scan(&revoked)
	return errors.Is(err, pgx.ErrNoRows) || err == nil && !revoked
}
func (d *Database) TrustPublisher(ctx context.Context, p Publisher) error {
	key, err := base64.StdEncoding.DecodeString(p.PublicKey)
	if err != nil || len(key) != 32 || apppackage.Fingerprint(key) != p.KeyID || p.PublisherID == "" || len(p.PublisherID) > 100 || p.Name == "" || len(p.Name) > 100 {
		return errors.New("invalid publisher key")
	}
	result, err := d.Pool.Exec(ctx, "INSERT INTO publisher_keys(key_id,publisher_id,publisher_name,public_key,trusted,source)VALUES($1,$2,$3,$4,true,'local-admin') ON CONFLICT(key_id)DO UPDATE SET trusted=true WHERE publisher_keys.revoked_at IS NULL AND publisher_keys.publisher_id=EXCLUDED.publisher_id AND publisher_keys.public_key=EXCLUDED.public_key AND publisher_keys.publisher_name=EXCLUDED.publisher_name", p.KeyID, p.PublisherID, p.Name, p.PublicKey)
	if err == nil && result.RowsAffected() == 0 {
		return errors.New("publisher revoked or identity mismatch")
	}
	return err
}
