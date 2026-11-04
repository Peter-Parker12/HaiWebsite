-- Accounts. Email is stored lower-cased and is the login name.
CREATE TABLE users (
  id            text PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  role          text NOT NULL DEFAULT 'Artist',
  discipline    text NOT NULL DEFAULT '',
  location      text NOT NULL DEFAULT '',
  bio           text NOT NULL DEFAULT '',
  goals         jsonb NOT NULL DEFAULT '[]',
  portfolio     jsonb NOT NULL DEFAULT '[]',
  password_hash text,
  is_admin      boolean NOT NULL DEFAULT false,
  disabled      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sponsors (
  id            text PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  type          text NOT NULL DEFAULT 'Individual',
  focus         jsonb NOT NULL DEFAULT '[]',
  regions       jsonb NOT NULL DEFAULT '[]',
  ticket        text NOT NULL DEFAULT '',
  bio           text NOT NULL DEFAULT '',
  password_hash text,
  disabled      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Server-side sessions. Only a hash of the cookie token is stored.
CREATE TABLE sessions (
  token_hash   text PRIMARY KEY,
  account_kind text NOT NULL CHECK (account_kind IN ('user', 'sponsor')),
  account_id   text NOT NULL,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_account_idx ON sessions (account_kind, account_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);
