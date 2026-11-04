import { randomUUID } from 'node:crypto'
import { fieldsFor, MAX_TYPES, typeById, type FieldDef } from '../../src/store/projectTypes.js'
import { pool } from './db.js'

/** A project row as the browser sees it. `ws` is redacted unless the viewer is the owner. */
export interface ProjectRow {
  id: string
  owner_id: string
  owner_name: string
  status: string
  listed: boolean
  one_liner: string
  discipline: string
  location: string
  stage: string
  tags: string[]
  types: string[]
  details: Record<string, unknown>
  updates: { date: string; text: string }[]
  ws: any
  version: number
  removed: boolean
  removed_reason: string
}

export const PROJECT_SELECT = `select p.id, p.owner_id, u.name as owner_name, p.status, p.listed, p.one_liner, p.discipline, p.location,
  p.stage, p.tags, p.types, p.details, p.updates, p.ws, p.version, p.removed, p.removed_reason
  from projects p join users u on u.id = p.owner_id`

/** Everything a visitor may see. Private workspace content (discussion, outreach, tasks, versions) stays out. */
function publicWs(ws: any) {
  return {
    project: {
      title: ws.project?.title ?? '',
      tagline: ws.project?.tagline ?? '',
      concept: ws.project?.concept ?? '',
      directionAgreed: false,
      collaborators: ws.project?.collaborators ?? [],
      mood: ws.project?.mood ?? [],
      frames: [],
      comments: [],
      versions: [],
    },
    resources: ws.resources ?? [],
    outreach: [],
    plan: {
      generated: false, objectives: '', audience: '', outcomes: '', phases: [], tasks: [],
      extraLines: ws.plan?.extraLines ?? [],
    },
    campaign: null,
    proposals: [],
    trunk: [],
  }
}

export function toClient(row: ProjectRow, includePrivate: boolean, showRemoval = includePrivate) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    status: row.status,
    listed: row.listed,
    oneLiner: row.one_liner,
    discipline: row.discipline,
    location: row.location,
    stage: row.stage,
    tags: row.tags,
    types: row.types,
    details: row.details,
    updates: row.updates,
    version: row.version,
    removed: row.removed,
    removedReason: showRemoval ? row.removed_reason : '',
    ws: includePrivate ? row.ws : publicWs(row.ws),
  }
}

/** Keep only fields that belong to the chosen types and that have the right shape. */
export function sanitizeDetails(types: string[], input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const fld of fieldsFor(types)) {
    const v = input[fld.key]
    const clean = cleanValue(fld, v)
    if (clean !== undefined) out[fld.key] = clean
  }
  return out
}

function cleanValue(fld: FieldDef, v: unknown): unknown {
  if (v === undefined || v === null || v === '') return undefined
  switch (fld.kind) {
    case 'number': {
      const n = typeof v === 'number' ? v : Number(v)
      return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : undefined
    }
    case 'list':
      return Array.isArray(v) ? v.map((x) => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 30) : undefined
    case 'choice':
      return typeof v === 'string' && fld.options?.includes(v) ? v : undefined
    default:
      return typeof v === 'string' ? v.trim().slice(0, 5000) : undefined
  }
}

export function validTypes(types: string[]): string[] {
  const seen = new Set<string>()
  for (const t of types) if (typeById(t)) seen.add(t)
  return [...seen].slice(0, MAX_TYPES)
}

export async function addNotification(kind: 'user' | 'sponsor', id: string, text: string, link = '') {
  await pool.query('insert into notifications (id, account_kind, account_id, text, link) values ($1,$2,$3,$4,$5)', [randomUUID(), kind, id, text, link])
}
