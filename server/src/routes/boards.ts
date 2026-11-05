import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db.js'
import { requireAccount } from '../session.js'

const MAX_BOARDS = 20
const MAX_SCENE_BYTES = 6_000_000

const sceneSchema = z.object({
  elements: z.array(z.any()).max(20000),
  appState: z.record(z.any()),
  files: z.record(z.any()),
})

const name = z.string().trim().min(1, 'Please name the board.').max(80)

/** Boards belong to a project; only its leader may touch them. */
async function ownBoard(boardId: string, userId: string) {
  const { rows } = await pool.query(
    `select b.id, b.project_id as "projectId", b.name, b.version, b.scene
       from boards b join projects p on p.id = b.project_id where b.id = $1 and p.owner_id = $2`,
    [boardId, userId],
  )
  return rows[0] as { id: string; projectId: string; name: string; version: number; scene: unknown } | undefined
}

export async function boardRoutes(app: FastifyInstance) {
  app.get('/api/projects/:id/boards', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const { rows } = await pool.query(
      `select b.id, b.name, b.version, to_char(b.updated_at, 'YYYY-MM-DD HH24:MI') as "updatedAt"
         from boards b join projects p on p.id = b.project_id
        where b.project_id = $1 and p.owner_id = $2 order by b.created_at`,
      [(request.params as { id: string }).id, s.id],
    )
    return { boards: rows }
  })

  app.post('/api/projects/:id/boards', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const projectId = (request.params as { id: string }).id
    const d = z.object({ name }).parse(request.body)
    const own = await pool.query('select 1 from projects where id = $1 and owner_id = $2', [projectId, s.id])
    if (!own.rowCount) return reply.code(404).send({ error: 'Project not found.' })
    const count = await pool.query('select count(*)::int as n from boards where project_id = $1', [projectId])
    if (count.rows[0].n >= MAX_BOARDS) return reply.code(409).send({ error: `A project can have up to ${MAX_BOARDS} boards.` })
    const id = randomUUID()
    await pool.query('insert into boards (id, project_id, name) values ($1,$2,$3)', [id, projectId, d.name])
    return { board: { id, name: d.name, version: 1, updatedAt: '' } }
  })

  app.get('/api/boards/:id', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const b = await ownBoard((request.params as { id: string }).id, s.id)
    if (!b) return reply.code(404).send({ error: 'Board not found.' })
    return { board: b }
  })

  // Autosave with an optimistic version check, same idea as the project workspace.
  app.put('/api/boards/:id', { bodyLimit: 8_000_000 }, async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const id = (request.params as { id: string }).id
    const d = z.object({ version: z.number().int(), scene: sceneSchema }).parse(request.body)
    const json = JSON.stringify(d.scene)
    if (json.length > MAX_SCENE_BYTES) return reply.code(413).send({ error: 'This board is too large to save. Remove some images.' })

    const { rowCount } = await pool.query(
      `update boards b set scene = $1, version = b.version + 1, updated_at = now()
         from projects p where b.id = $2 and p.id = b.project_id and p.owner_id = $3 and b.version = $4`,
      [json, id, s.id, d.version],
    )
    if (rowCount) {
      const { rows } = await pool.query('select version from boards where id = $1', [id])
      return { version: rows[0].version as number }
    }
    const b = await ownBoard(id, s.id)
    if (!b) return reply.code(404).send({ error: 'Board not found.' })
    return reply.code(409).send({ error: 'This board was changed somewhere else. Reload to continue.', version: b.version })
  })

  app.patch('/api/boards/:id', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const d = z.object({ name }).parse(request.body)
    const { rowCount } = await pool.query(
      `update boards b set name = $1 from projects p where b.id = $2 and p.id = b.project_id and p.owner_id = $3`,
      [d.name, (request.params as { id: string }).id, s.id],
    )
    if (!rowCount) return reply.code(404).send({ error: 'Board not found.' })
    return { ok: true }
  })

  app.delete('/api/boards/:id', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const { rowCount } = await pool.query(
      `delete from boards b using projects p where b.id = $1 and p.id = b.project_id and p.owner_id = $2`,
      [(request.params as { id: string }).id, s.id],
    )
    if (!rowCount) return reply.code(404).send({ error: 'Board not found.' })
    return { ok: true }
  })
}
