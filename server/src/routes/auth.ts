import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { findCredentials, getAccount } from '../accounts.js'
import { config } from '../config.js'
import { pool } from '../db.js'
import { hashPassword, verifyPassword } from '../password.js'
import { clearHits, tooMany } from '../rateLimit.js'
import { currentSession, endSession, startSession } from '../session.js'

const email = z.string().trim().toLowerCase().email().max(200)
const password = z.string().min(8, 'Password must be at least 8 characters.').max(200)
const text = (max: number) => z.string().trim().max(max).default('')
const list = z.array(z.string().trim().max(120)).max(30).default([])

const userSignup = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(120),
  email,
  password,
  role: z.enum(['Artist', 'Curator', 'Cultural practitioner', 'Organisation representative']).default('Artist'),
  discipline: text(120),
  location: text(120),
  bio: text(2000),
  goals: list,
  portfolio: z.array(z.object({ id: z.string().max(40), title: z.string().trim().max(200), url: z.string().trim().max(500) })).max(30).default([]),
})

const sponsorSignup = z.object({
  name: z.string().trim().min(1, 'Please enter a name.').max(160),
  email,
  password,
  type: z.enum(['Foundation', 'Company', 'Individual']).default('Individual'),
  focus: list,
  regions: list,
  ticket: text(120),
  bio: text(2000),
})

const login = z.object({ email, password: z.string().min(1).max(200), kind: z.enum(['user', 'sponsor']) })

// Compared against when the email is unknown, so timing does not reveal which emails exist.
const DUMMY_HASH = await hashPassword('not-a-real-password')

function isUniqueViolation(err: unknown) {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505'
}

export async function authRoutes(app: FastifyInstance) {
  app.get('/api/config', async () => ({ demo: config.seedDemo }))

  app.post('/api/auth/register', async (request, reply) => {
    const d = userSignup.parse(request.body)
    const id = randomUUID()
    try {
      await pool.query(
        `insert into users (id, email, name, role, discipline, location, bio, goals, portfolio, password_hash)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, d.email, d.name, d.role, d.discipline, d.location, d.bio, JSON.stringify(d.goals), JSON.stringify(d.portfolio), await hashPassword(d.password)],
      )
    } catch (err) {
      if (isUniqueViolation(err)) return reply.code(409).send({ error: 'An account with this email already exists.' })
      throw err
    }
    await startSession(reply, 'user', id)
    return { kind: 'user', account: await getAccount('user', id) }
  })

  app.post('/api/auth/sponsor/register', async (request, reply) => {
    const d = sponsorSignup.parse(request.body)
    const id = randomUUID()
    try {
      await pool.query(
        `insert into sponsors (id, email, name, type, focus, regions, ticket, bio, password_hash)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, d.email, d.name, d.type, JSON.stringify(d.focus), JSON.stringify(d.regions), d.ticket, d.bio, await hashPassword(d.password)],
      )
    } catch (err) {
      if (isUniqueViolation(err)) return reply.code(409).send({ error: 'A sponsor account with this email already exists.' })
      throw err
    }
    await startSession(reply, 'sponsor', id)
    return { kind: 'sponsor', account: await getAccount('sponsor', id) }
  })

  app.post('/api/auth/login', async (request, reply) => {
    const d = login.parse(request.body)
    const key = `login|${request.ip}|${d.email}`
    if (tooMany(key, 8, 15 * 60_000) || tooMany(`login-ip|${request.ip}`, 60, 15 * 60_000)) {
      return reply.code(429).send({ error: 'Too many attempts. Please wait a few minutes and try again.' })
    }
    const cred = await findCredentials(d.kind, d.email)
    const ok = await verifyPassword(d.password, cred?.password_hash ?? DUMMY_HASH)
    if (!cred || !ok) return reply.code(401).send({ error: 'Incorrect email or password.' })
    if (cred.disabled) return reply.code(403).send({ error: 'This account has been disabled.' })
    clearHits(key)
    await startSession(reply, d.kind, cred.id)
    return { kind: d.kind, account: await getAccount(d.kind, cred.id) }
  })

  app.post('/api/auth/logout', async (request, reply) => {
    await endSession(request, reply)
    return { ok: true }
  })

  app.get('/api/auth/me', async (request) => {
    const s = await currentSession(request)
    if (!s) return { kind: null, account: null }
    return { kind: s.kind, account: await getAccount(s.kind, s.id) }
  })

  // Profile edits for whoever is signed in.
  const userPatch = z.object({
    name: z.string().trim().min(1).max(120),
    role: z.enum(['Artist', 'Curator', 'Cultural practitioner', 'Organisation representative']),
    discipline: text(120),
    location: text(120),
    bio: text(2000),
    goals: list,
    portfolio: z.array(z.object({ id: z.string().max(40), title: z.string().trim().max(200), url: z.string().trim().max(500) })).max(30),
  }).partial()

  const sponsorPatch = z.object({
    name: z.string().trim().min(1).max(160),
    type: z.enum(['Foundation', 'Company', 'Individual']),
    focus: list,
    regions: list,
    ticket: text(120),
    bio: text(2000),
  }).partial()

  app.patch('/api/account', async (request, reply) => {
    const s = await currentSession(request)
    if (!s) return reply.code(401).send({ error: 'Please log in.' })
    const table = s.kind === 'user' ? 'users' : 'sponsors'
    const data = (s.kind === 'user' ? userPatch : sponsorPatch).parse(request.body) as Record<string, unknown>
    const jsonCols = new Set(['goals', 'portfolio', 'focus', 'regions'])
    const entries = Object.entries(data).filter(([, v]) => v !== undefined)
    if (entries.length) {
      // Column names come from the zod schema keys above, never from the request.
      const sets = entries.map(([k], i) => `${k} = $${i + 2}`).join(', ')
      const values = entries.map(([k, v]) => (jsonCols.has(k) ? JSON.stringify(v) : v))
      await pool.query(`update ${table} set ${sets} where id = $1`, [s.id, ...values])
    }
    return { kind: s.kind, account: await getAccount(s.kind, s.id) }
  })
}
