-- Staff roles: 'admin' can do everything, 'ops' can moderate projects.
ALTER TABLE users ADD COLUMN staff_role text CHECK (staff_role IN ('admin', 'ops'));
UPDATE users SET staff_role = 'admin' WHERE is_admin;

-- Soft removal of inappropriate projects. A removed project is hidden and cannot be listed until restored.
ALTER TABLE projects ADD COLUMN removed boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN removed_reason text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN removed_by text;
ALTER TABLE projects ADD COLUMN removed_at timestamptz;

-- Reports from signed-in users, reviewed by staff.
CREATE TABLE reports (
  id          text PRIMARY KEY,
  project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  by_kind     text NOT NULL CHECK (by_kind IN ('user', 'sponsor')),
  by_id       text NOT NULL,
  reason      text NOT NULL,
  details     text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  handled_by  text,
  handled_at  timestamptz
);
CREATE INDEX reports_status_idx ON reports (status, created_at DESC);
CREATE UNIQUE INDEX reports_one_open_idx ON reports (project_id, by_kind, by_id) WHERE status = 'open';

-- Who did what. Kept even if the project is deleted.
CREATE TABLE moderation_log (
  id            text PRIMARY KEY,
  actor_id      text NOT NULL,
  actor_name    text NOT NULL,
  action        text NOT NULL,
  project_id    text NOT NULL,
  project_title text NOT NULL DEFAULT '',
  reason        text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_log_created_idx ON moderation_log (created_at DESC);
