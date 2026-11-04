# ConceptBridge

A directory where artists, curators and cultural practitioners list projects that need support, and sponsors browse and back them.

## Run (Docker)

```bash
cp .env.example .env     # then edit DB_PASSWORD (and ADMIN_* if you want an admin account)
docker compose up -d --build
```

The app and API are served on port 8392. Postgres runs in the `db` container with a named volume (`pgdata`).
Point your Cloudflare tunnel at `http://localhost:8392`.

## Accounts

Sign-in is email + password. With `SEED_DEMO=true` these demo accounts exist (password `demo1234`):

| Role | Email |
|---|---|
| Creator | `mai@example.org` (also aiko, daniel, priya, ines, studio, amara `@example.org`) |
| Sponsor | `grants@alder.example.org`, `csr@northline.example.org`, `office@whitcombe.example.org` |

Staff demo accounts (same password): `admin@example.org` (admin) and `ops@example.org` (ops / moderation).
Set `SEED_DEMO=false` for a real launch, and create the real admin with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Moderation

Staff (admin and ops) see a **Moderation** item in the navbar. They can search every project, remove an inappropriate one
(a reason is required and the owner is notified), restore it, review user reports and see an activity log.
Removed projects disappear from Home and cannot be listed again until restored. Admins can also delete a project
permanently and add or remove ops team members. Any signed-in user can report a published project.

## Development

```bash
# API (needs a Postgres; set DATABASE_URL)
cd server && npm install && npm run dev
# Frontend, proxies /api to :8392
npm install && npm run dev
```

## What is stored on the server

- Accounts and sessions (creators and sponsors, email + password).
- Projects: listing fields, project type(s), type-specific details, and the leader-only workspace (versioned, autosaved).
- Support requests, sponsor watchlists and notifications.

A project can only be listed on Home once its mandatory fields are complete (see `src/store/projectTypes.ts`).
Cover/artwork uploads, the admin screen, email and Google/Apple/Facebook sign-in are the next steps.
Idea Lab discussion, outreach and the plan are part of the workspace and are visible only to the project leader.
The matching directory (Matching tab) is still sample data that lives in the browser.
