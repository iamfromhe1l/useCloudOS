CREATE TABLE IF NOT EXISTS users (
 id text PRIMARY KEY, username text UNIQUE NOT NULL, password_hash text NOT NULL,
 role text NOT NULL CHECK(role IN ('admin','user')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platform_settings (key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS installed_apps (
 id text PRIMARY KEY, record jsonb NOT NULL, installed_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_versions (
 app_id text NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
 version text NOT NULL, digest text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(app_id,version)
);
CREATE TABLE IF NOT EXISTS app_permissions (
 app_id text NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
 permission text NOT NULL, granted boolean NOT NULL, PRIMARY KEY(app_id,permission)
);
CREATE TABLE IF NOT EXISTS app_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, app_id text NOT NULL,
 type text NOT NULL, detail text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id text REFERENCES users(id),
 app_id text NOT NULL, message text NOT NULL, read_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS jobs (
 id text PRIMARY KEY, type text NOT NULL, state text NOT NULL, payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
