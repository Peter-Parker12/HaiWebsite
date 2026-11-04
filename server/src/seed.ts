import { randomUUID } from 'node:crypto'
import { rootSeed } from '../../src/store/rootSeed.js'
import { config, DEMO_PASSWORD } from './config.js'
import { pool } from './db.js'
import { hashPassword } from './password.js'

/** Demo creators and sponsors share the password "demo1234". Safe to run on every start. */
export async function seedDemoAccounts() {
  const hash = await hashPassword(DEMO_PASSWORD)
  for (const u of rootSeed.users) {
    await pool.query(
      `insert into users (id, email, name, role, discipline, location, bio, goals, portfolio, password_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict do nothing`,
      [u.id, u.email.toLowerCase(), u.name, u.role, u.discipline, u.location, u.bio, JSON.stringify(u.goals), JSON.stringify(u.portfolio), hash],
    )
  }
  for (const s of rootSeed.sponsors) {
    await pool.query(
      `insert into sponsors (id, email, name, type, focus, regions, ticket, bio, password_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict do nothing`,
      [s.id, s.email.toLowerCase(), s.name, s.type, JSON.stringify(s.focus), JSON.stringify(s.regions), s.ticket, s.bio, hash],
    )
  }
  // Demo staff: an admin and an ops (moderation) account.
  for (const [id, email, name, role] of [['admin-demo', 'admin@example.org', 'Demo Admin', 'admin'], ['ops-demo', 'ops@example.org', 'Demo Ops', 'ops']] as const) {
    await pool.query(
      `insert into users (id, email, name, role, password_hash, is_admin, staff_role)
       values ($1,$2,$3,'Cultural practitioner',$4,$5,$6) on conflict do nothing`,
      [id, email, name, hash, role === 'admin', role],
    )
  }
  console.log('demo accounts ready (password: demo1234)')
}

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD. Never changes an existing password. */
export async function bootstrapAdmin() {
  if (!config.adminEmail || !config.adminPassword) return
  await pool.query(
    `insert into users (id, email, name, role, password_hash, is_admin, staff_role)
     values ($1,$2,'Administrator','Cultural practitioner',$3,true,'admin')
     on conflict (email) do update set is_admin = true, staff_role = 'admin'`,
    [randomUUID(), config.adminEmail, await hashPassword(config.adminPassword)],
  )
  console.log(`admin account ready: ${config.adminEmail}`)
}

/** Demo projects, support requests, watchlist and one report. Existing rows are never overwritten, so new samples appear on upgrade. */
export async function seedDemoProjects() {
  for (const p of rootSeed.projects) {
    await pool.query(
      `insert into projects (id, owner_id, status, listed, one_liner, discipline, location, stage, tags, types, details, updates, ws)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (id) do nothing`,
      [p.id, p.ownerId, p.status, p.listed, p.oneLiner, p.discipline, p.location, p.stage, JSON.stringify(p.tags), JSON.stringify(p.types), JSON.stringify(p.details), JSON.stringify(p.updates), JSON.stringify(p.ws)],
    )
  }
  for (const s of rootSeed.supports) {
    await pool.query(
      `insert into supports (id, project_id, by_kind, by_id, kind, resource_id, message, status, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing`,
      [s.id, s.projectId, s.byKind, s.byId, s.kind, s.resourceId ?? null, s.message, s.status, s.date],
    )
  }
  for (const w of rootSeed.watchlist) {
    await pool.query('insert into watchlist (sponsor_id, project_id) values ($1,$2) on conflict do nothing', [w.sponsorId, w.projectId])
  }
  await pool.query(
    `insert into reports (id, project_id, by_kind, by_id, reason, details)
     values ('rp1', 'p19', 'user', 'u3', 'Spam or scam', 'This looks like an advert for fake watches, not an art project.')
     on conflict do nothing`,
  )
  console.log(`demo projects ready (${rootSeed.projects.length})`)
}
