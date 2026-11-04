import { pool } from './db.js'
import type { Kind } from './session.js'

/** Shapes returned to the browser. Never includes the password hash. */
export interface UserOut {
  id: string
  name: string
  email: string
  role: string
  discipline: string
  location: string
  bio: string
  goals: string[]
  portfolio: { id: string; title: string; url: string }[]
  isAdmin: boolean
  staffRole: 'admin' | 'ops' | null
}

export interface SponsorOut {
  id: string
  name: string
  email: string
  type: string
  focus: string[]
  regions: string[]
  ticket: string
  bio: string
}

const userCols = `id, name, email, role, discipline, location, bio, goals, portfolio, (staff_role = 'admin') as "isAdmin", staff_role as "staffRole"`
const sponsorCols = 'id, name, email, type, focus, regions, ticket, bio'

export async function getUser(id: string): Promise<UserOut | null> {
  const { rows } = await pool.query(`select ${userCols} from users where id = $1`, [id])
  return rows[0] ?? null
}

export async function getSponsor(id: string): Promise<SponsorOut | null> {
  const { rows } = await pool.query(`select ${sponsorCols} from sponsors where id = $1`, [id])
  return rows[0] ?? null
}

export async function getAccount(kind: Kind, id: string) {
  return kind === 'user' ? getUser(id) : getSponsor(id)
}

/** Look up credentials by email for login. */
export async function findCredentials(kind: Kind, email: string) {
  const table = kind === 'user' ? 'users' : 'sponsors'
  const { rows } = await pool.query(`select id, password_hash, disabled from ${table} where email = $1`, [email])
  return rows[0] as { id: string; password_hash: string | null; disabled: boolean } | undefined
}
