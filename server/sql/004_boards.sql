-- Whiteboards (Excalidraw scenes), several per project. Only the project leader reads or writes them.
CREATE TABLE boards (
  id         text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       text NOT NULL,
  scene      jsonb NOT NULL DEFAULT '{"elements":[],"appState":{},"files":{}}',
  version    integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX boards_project_idx ON boards (project_id, created_at);
