-- Projects. Listing fields are columns; the owner-edited workspace is one versioned JSON document.
CREATE TABLE projects (
  id         text PRIMARY KEY,
  owner_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'Seeking support' CHECK (status IN ('Seeking support', 'Running', 'Closed')),
  listed     boolean NOT NULL DEFAULT false,
  one_liner  text NOT NULL DEFAULT '',
  discipline text NOT NULL DEFAULT '',
  location   text NOT NULL DEFAULT '',
  stage      text NOT NULL DEFAULT 'Concept',
  tags       jsonb NOT NULL DEFAULT '[]',
  types      jsonb NOT NULL DEFAULT '[]',
  details    jsonb NOT NULL DEFAULT '{}',
  updates    jsonb NOT NULL DEFAULT '[]',
  ws         jsonb NOT NULL,
  version    integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_idx ON projects (owner_id);
CREATE INDEX projects_listed_idx ON projects (listed, status);

-- Help offered to a project by a sponsor or another creator.
CREATE TABLE supports (
  id          text PRIMARY KEY,
  project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  by_kind     text NOT NULL CHECK (by_kind IN ('user', 'sponsor')),
  by_id       text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('interest', 'in-kind')),
  resource_id text,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'Accepted', 'Declined')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX supports_project_idx ON supports (project_id);
CREATE INDEX supports_by_idx ON supports (by_kind, by_id);

CREATE TABLE watchlist (
  sponsor_id text NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sponsor_id, project_id)
);

CREATE TABLE notifications (
  id           text PRIMARY KEY,
  account_kind text NOT NULL CHECK (account_kind IN ('user', 'sponsor')),
  account_id   text NOT NULL,
  text         text NOT NULL,
  link         text NOT NULL DEFAULT '',
  read         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_account_idx ON notifications (account_kind, account_id, created_at DESC);
