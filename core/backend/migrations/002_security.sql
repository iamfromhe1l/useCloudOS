ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(), actor text NOT NULL,
 action text NOT NULL, target text NOT NULL, result text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS publisher_keys (
 key_id text PRIMARY KEY, publisher_id text NOT NULL, publisher_name text NOT NULL,
 public_key text NOT NULL, trusted boolean NOT NULL DEFAULT false,
 source text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz
);
