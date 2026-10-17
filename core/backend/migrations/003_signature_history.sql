ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS trust text NOT NULL DEFAULT 'unsigned';
ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS publisher_key text;
ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS content_digest text;
UPDATE app_versions v SET
 trust=COALESCE(a.record->>'trust','unsigned'),
 publisher_key=a.record->>'publisherKey', content_digest=a.record->>'contentDigest'
FROM installed_apps a
WHERE a.id=v.app_id AND v.version=a.record->'manifest'->'metadata'->>'version';
