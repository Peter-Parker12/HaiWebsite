import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { emptyWorkspace, rootSeed } from '../../../src/store/rootSeed.js'
import { missingForListing, STAGES, type ListingInput } from '../../../src/store/projectTypes.js'
import { pool } from '../db.js'
import { PROJECT_SELECT, sanitizeDetails, toClient, validTypes, type ProjectRow } from '../projects.js'
import { currentSession, requireAccount } from '../session.js'
import { randomUUID as uuid } from 'node:crypto'

const short = (max: number) => z.string().trim().max(max)

function listingInput(row: ProjectRow): ListingInput {
  const ws = row.ws ?? {}
  const resources: { status: string }[] = ws.resources ?? []
  return {
    title: String(ws.project?.title ?? ''),
    oneLiner: row.one_liner,
    story: String(ws.project?.concept ?? ''),
    types: row.types,
    discipline: row.discipline,
    location: row.location,
    stage: row.stage,
    needsCount: resources.filter((r) => r.status !== 'Secured').length,
    // Uploads are not built yet, so media requirements are not enforced.
    coverImages: 0,
    artworkImages: 0,
    documents: 0,
    details: row.details,
  }
}

const createBody = z.object({
  title: short(160).min(1, 'Please give the project a title.'),
  tagline: short(300).default(''),
  discipline: short(120).default(''),
  location: short(120).default(''),
  types: z.array(z.string()).min(1, 'Choose a project type.').max(5),
})

const patchBody = z.object({
  status: z.enum(['Seeking support', 'Running', 'Closed']),
  listed: z.boolean(),
  oneLiner: short(300),
  discipline: short(120),
  location: short(120),
  stage: short(40),
  tags: z.array(short(40)).max(12),
  types: z.array(z.string()).min(1).max(5),
  details: z.record(z.unknown()),
}).partial()

const resourceSchema = z.object({
  id: z.string().max(40),
  name: short(200),
  type: z.enum(['Skill', 'Venue', 'Funding', 'Expertise']),
  status: z.enum(['Missing', 'Contacted', 'Secured', 'Partially funded', 'Unavailable']),
  budget: z.number().min(0).max(1e9),
  funded: z.number().min(0).max(1e9),
})

const workspaceBody = z.object({
  version: z.number().int(),
  ws: z.object({
    project: z.object({ title: short(160).min(1), tagline: short(300), concept: z.string().max(20000) }).passthrough(),
    resources: z.array(resourceSchema).max(100),
    outreach: z.array(z.any()).max(500),
    plan: z.object({ extraLines: z.array(z.any()).max(100) }).passthrough(),
    campaign: z.any().nullable(),
    proposals: z.array(z.any()).max(200),
    trunk: z.array(z.any()).max(200),
  }),
})

async function loadRow(id: string): Promise<ProjectRow | undefined> {
  const { rows } = await pool.query(`${PROJECT_SELECT} where p.id = $1`, [id])
  return rows[0]
}

export async function projectRoutes(app: FastifyInstance) {
  // Public directory: listed projects only, private workspace content removed.
  app.get('/api/projects', async () => {
    const { rows } = await pool.query(`${PROJECT_SELECT} where p.listed = true and not p.removed order by p.updated_at desc limit 500`)
    return { projects: rows.map((r: ProjectRow) => toClient(r, false)) }
  })

  app.get('/api/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const row = await loadRow(id)
    const s = await currentSession(request)
    const isOwner = !!row && s?.kind === 'user' && s.id === row.owner_id
    let isStaff = false
    if (s?.kind === 'user') {
      const r = await pool.query('select staff_role from users where id = $1', [s.id])
      isStaff = !!r.rows[0]?.staff_role
    }
    const visible = !!row && ((row.listed && !row.removed) || isOwner || isStaff)
    if (!row || !visible) return reply.code(404).send({ error: 'Project not found.' })
    return { project: toClient(row, isOwner, isOwner || isStaff) }
  })

  app.get('/api/my/projects', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const { rows } = await pool.query(`${PROJECT_SELECT} where p.owner_id = $1 order by p.updated_at desc`, [s.id])
    return { projects: rows.map((r: ProjectRow) => toClient(r, true)) }
  })

  app.post('/api/projects', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const d = createBody.parse(request.body)
    const types = validTypes(d.types)
    if (!types.length) return reply.code(400).send({ error: 'Choose a project type.' })
    const { rows: u } = await pool.query('select name, discipline from users where id = $1', [s.id])
    const ws = emptyWorkspace({
      title: d.title,
      tagline: d.tagline,
      concept: d.tagline,
      owner: { name: u[0].name, discipline: u[0].discipline },
    })
    const id = randomUUID()
    await pool.query(
      `insert into projects (id, owner_id, one_liner, discipline, location, types, ws) values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, s.id, d.tagline, d.discipline, d.location, JSON.stringify(types), JSON.stringify(ws)],
    )
    return { project: toClient((await loadRow(id))!, true) }
  })

  // Copies the filled-in demo project into the signed-in creator's account.
  app.post('/api/projects/sample', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const src = rootSeed.projects[0]
    const { rows: u } = await pool.query('select name from users where id = $1', [s.id])
    const ws = JSON.parse(JSON.stringify(src.ws).split('Mai Tran').join(u[0].name))
    const id = randomUUID()
    await pool.query(
      `insert into projects (id, owner_id, status, listed, one_liner, discipline, location, stage, tags, types, details, updates, ws)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, s.id, src.status, false, src.oneLiner, src.discipline, src.location, src.stage, JSON.stringify(src.tags), JSON.stringify(src.types), JSON.stringify(src.details), JSON.stringify(src.updates), JSON.stringify(ws)],
    )
    return { project: toClient((await loadRow(id))!, true) }
  })

  app.get('/api/projects/:id/listing-check', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const row = await loadRow((request.params as { id: string }).id)
    if (!row || row.owner_id !== s.id) return reply.code(404).send({ error: 'Project not found.' })
    return { missing: missingForListing(listingInput(row), { requireMedia: false }) }
  })

  // Listing fields. Only the project leader can change them.
  app.patch('/api/projects/:id', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const id = (request.params as { id: string }).id
    const d = patchBody.parse(request.body)
    const row = await loadRow(id)
    if (!row || row.owner_id !== s.id) return reply.code(404).send({ error: 'Project not found.' })

    const types = d.types ? validTypes(d.types) : row.types
    if (d.types && !types.length) return reply.code(400).send({ error: 'Choose a valid project type.' })
    if (d.stage !== undefined && d.stage !== '' && !(STAGES as readonly string[]).includes(d.stage)) {
      return reply.code(400).send({ error: 'Unknown stage.' })
    }
    const merged: ProjectRow = {
      ...row,
      one_liner: d.oneLiner ?? row.one_liner,
      discipline: d.discipline ?? row.discipline,
      location: d.location ?? row.location,
      stage: d.stage ?? row.stage,
      types,
      details: sanitizeDetails(types, d.details ?? row.details),
    }
    if (d.listed === true && row.removed) {
      return reply.code(403).send({ error: 'This project was removed by moderators and cannot be listed.' })
    }
    // The listing gate: switching "Listed on Home" on needs every mandatory field.
    if (d.listed === true && !row.listed) {
      const missing = missingForListing(listingInput(merged), { requireMedia: false })
      if (missing.length) return reply.code(422).send({ error: 'This project is not ready to list yet.', missing })
    }

    await pool.query(
      `update projects set status = $2, listed = $3, one_liner = $4, discipline = $5, location = $6, stage = $7,
         tags = $8, types = $9, details = $10, updated_at = now() where id = $1`,
      [
        id, d.status ?? row.status, d.listed ?? row.listed, merged.one_liner, merged.discipline, merged.location, merged.stage,
        JSON.stringify(d.tags ?? row.tags), JSON.stringify(types), JSON.stringify(merged.details),
      ],
    )
    return { project: toClient((await loadRow(id))!, true) }
  })

  // Leader-only workspace save with an optimistic version check.
  app.put('/api/projects/:id/workspace', { bodyLimit: 4_000_000 }, async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const id = (request.params as { id: string }).id
    const d = workspaceBody.parse(request.body)
    const { rowCount } = await pool.query(
      `update projects set ws = $1, version = version + 1, updated_at = now()
        where id = $2 and owner_id = $3 and version = $4`,
      [JSON.stringify(d.ws), id, s.id, d.version],
    )
    if (rowCount) {
      const { rows } = await pool.query('select version from projects where id = $1', [id])
      return { version: rows[0].version as number }
    }
    const row = await loadRow(id)
    if (!row || row.owner_id !== s.id) return reply.code(404).send({ error: 'Project not found.' })
    return reply.code(409).send({ error: 'This project was changed somewhere else. Reload to continue.', version: row.version })
  })

  // Any signed-in account can flag a listed project for staff to review.
  app.post('/api/projects/:id/report', async (request, reply) => {
    const s = await requireAccount(request, reply)
    if (!s) return
    const id = (request.params as { id: string }).id
    const d = z.object({
      reason: z.enum(['Spam or scam', 'Offensive or harmful', 'Copyright or stolen work', 'Misleading information', 'Other']),
      details: short(1000).default(''),
    }).parse(request.body)
    const p = await pool.query('select owner_id from projects where id = $1 and listed = true and not removed', [id])
    if (!p.rowCount) return reply.code(404).send({ error: 'Project not found.' })
    if (s.kind === 'user' && p.rows[0].owner_id === s.id) return reply.code(403).send({ error: 'You lead this project.' })
    try {
      await pool.query('insert into reports (id, project_id, by_kind, by_id, reason, details) values ($1,$2,$3,$4,$5,$6)', [uuid(), id, s.kind, s.id, d.reason, d.details])
    } catch (err) {
      if ((err as { code?: string }).code === '23505') return reply.code(409).send({ error: 'You already reported this project. Staff will review it.' })
      throw err
    }
    return { ok: true }
  })
}
