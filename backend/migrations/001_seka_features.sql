-- Run only after a Neon backup and a schema review. Does not delete or merge candidates.
BEGIN;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_filename VARCHAR(255);
CREATE TABLE IF NOT EXISTS application_events (
 id SERIAL PRIMARY KEY, candidate_id INTEGER REFERENCES candidates(id), application_id INTEGER REFERENCES applications(id),
 event_type VARCHAR(50) NOT NULL, payload TEXT NOT NULL DEFAULT '{}', actor_label VARCHAR(200),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_seka_events_candidate ON application_events(candidate_id);
CREATE INDEX IF NOT EXISTS ix_seka_events_application ON application_events(application_id);
CREATE TABLE IF NOT EXISTS email_messages (
 id SERIAL PRIMARY KEY, candidate_id INTEGER NOT NULL REFERENCES candidates(id), application_id INTEGER REFERENCES applications(id),
 direction VARCHAR(20) NOT NULL, sender VARCHAR(255) NOT NULL, recipient VARCHAR(255) NOT NULL,
 subject VARCHAR(500) NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', provider VARCHAR(30) DEFAULT 'demo',
 status VARCHAR(30) DEFAULT 'simulated', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_seka_emails_candidate ON email_messages(candidate_id);
COMMIT;
