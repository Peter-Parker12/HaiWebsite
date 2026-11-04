import { createHash, randomBytes } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { config } from './config.js'
import { pool } from './db.js'

export const COOKIE = 'cb_session'
export type Kind = 'user' | 'sponsor'

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function startSession(reply: FastifyReply, kind: Kind, id: string) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + config.sessionDays * 86_400_000)
  await pool.query('insert into sessions (token_hash, account_kind, account_id, expires_at) values ($1,$2,$3,$4)', [hash(token), kind, id, expires])
  reply.setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: config.sessionDays * 86_400,
  })
}

export async function endSession(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[COOKIE]
  if (token) await pool.query('delete from sessions where token_hash = $1', [hash(token)])
  reply.clearCookie(COOKIE, { path: '/' })
}

/** Returns the signed-in account kind and id, or null. */
export async function currentSession(request: FastifyRequest): Promise<{ kind: Kind; id: string } | null> {
  const token = request.cookies[COOKIE]
  if (!token) return null
  const { rows } = await pool.query(
    `select s.account_kind as kind, s.account_id as id
       from sessions s
       left join users u on s.account_kind = 'user' and u.id = s.account_id
       left join sponsors p on s.account_kind = 'sponsor' and p.id = s.account_id
      where s.token_hash = $1 and s.expires_at > now()
        and coalesce(u.disabled, p.disabled, false) = false
        and (u.id is not null or p.id is not null)`,
    [hash(token)],
  )
  return rows[0] ?? null
}

export async function purgeExpiredSessions() {
  await pool.query('delete from sessions where expires_at < now()')
}

/** Staff-only routes. Pass 'admin' to also require the admin role (ops accounts are refused). */
export async function requireStaff(request: FastifyRequest, reply: FastifyReply, need: 'staff' | 'admin' = 'staff') {
  const s = await requireAccount(request, reply, 'user')
  if (!s) return null
  const { rows } = await pool.query('select name, staff_role from users where id = $1', [s.id])
  const role = rows[0]?.staff_role as 'admin' | 'ops' | null | undefined
  if (!role || (need === 'admin' && role !== 'admin')) {
    await reply.code(403).send({ error: 'This area is for staff only.' })
    return null
  }
  return { id: s.id, name: rows[0].name as string, role }
}

/** Resolves the signed-in account or answers 401. Pass a kind to also require that account type. */
export async function requireAccount(request: FastifyRequest, reply: FastifyReply, kind?: Kind) {
  const s = await currentSession(request)
  if (!s) {
    await reply.code(401).send({ error: 'Please log in.' })
    return null
  }
  if (kind && s.kind !== kind) {
    await reply.code(403).send({ error: kind === 'sponsor' ? 'This is for sponsor accounts.' : 'This is for creator accounts.' })
    return null
  }
  return s
}
