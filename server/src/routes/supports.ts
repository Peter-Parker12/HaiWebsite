import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db.js'
import { addNotification } from '../projects.js'
import { requireAccount } from '../session.js'

const SUPPORT_SELECT = `select s.id, s.project_id as "projectId", s.by_kind as "byKind", s.by_id as "byId", s.kind,
    s.resource_id as "resourceId", s.message, s.status, to_char(s.created_at, 'YYYY-MM-DD') as date,
    case when s.by_kind = 'user' then (select name from users where id = s.by_id)
         else (select name from sponsors where id = s.by_id) end as "byName"
  from supports s`

const createBody = z.object({
  kind: z.enum(['interest', 'in-kind']),
  resourceId: z.string().max(40).optional(),
  message: z.string().trim().min(1, 'Please write a short message.').max(2000),
})

export async function supportRoutes(app: FastifyInstance) {
  // Requests I made, plus requests made to projects I lead.
  app.get('/api/supports', async (request, reply) => {
    const s = await requireAccount(request, reply)
    if (!s) return
    const made = await pool.query(`${SUPPORT_SELECT} where s.by_kind = $1 and s.by_id = $2 order by s.created_at desc`, [s.kind, s.id])
    const inbox =
      s.kind === 'user'
        ? await pool.query(
            `${SUPPORT_SELECT} where s.project_id in (select id from projects where owner_id = $1) order by s.created_at desc`,
            [s.id],
          )
        : { rows: [] }
    return { made: made.rows, inbox: inbox.rows }
  })

  app.post('/api/projects/:id/supports', async (request, reply) => {
    const s = await requireAccount(request, reply)
    if (!s) return
    const id = (request.params as { id: string }).id
    const d = createBody.parse(request.body)

    const { rows } = await pool.query('select owner_id, listed, status, ws from projects where id = $1', [id])
    const p = rows[0]
    if (!p || !p.listed) return reply.code(404).send({ error: 'Project not found.' })
    if (p.status === 'Closed') return reply.code(409).send({ error: 'This project is closed.' })
    if (s.kind === 'user' && s.id === p.owner_id) return reply.code(403).send({ error: 'You lead this project.' })

    if (d.kind === 'in-kind') {
      const res = (p.ws.resources ?? []).find((r: { id: string; status: string }) => r.id === d.resourceId)
      if (!res || res.status === 'Secured') return reply.code(400).send({ error: 'Choose a need that is still open.' })
    }
    const dup = await pool.query(
      `select 1 from supports where project_id = $1 and by_kind = $2 and by_id = $3 and kind = $4
         and coalesce(resource_id, '') = coalesce($5, '') and status = 'Requested'`,
      [id, s.kind, s.id, d.kind, d.kind === 'in-kind' ? d.resourceId : null],
    )
    if (dup.rowCount) return reply.code(409).send({ error: 'You already have a pending request for this.' })

    const supportId = randomUUID()
    await pool.query(
      'insert into supports (id, project_id, by_kind, by_id, kind, resource_id, message) values ($1,$2,$3,$4,$5,$6,$7)',
      [supportId, id, s.kind, s.id, d.kind, d.kind === 'in-kind' ? d.resourceId : null, d.message],
    )
    const who = (await pool.query(`select name from ${s.kind === 'user' ? 'users' : 'sponsors'} where id = $1`, [s.id])).rows[0].name
    await addNotification('user', p.owner_id, `${who} ${d.kind === 'in-kind' ? 'offered in-kind support to' : 'expressed interest in'} "${p.ws.project.title}"`, `/my-projects/${id}/overview`)
    return { support: (await pool.query(`${SUPPORT_SELECT} where s.id = $1`, [supportId])).rows[0] }
  })

  // Leader accepts or declines. Accepting an in-kind offer marks the resource as secured, atomically.
  app.post('/api/supports/:id/decide', async (request, reply) => {
    const s = await requireAccount(request, reply, 'user')
    if (!s) return
    const { accept } = z.object({ accept: z.boolean() }).parse(request.body)
    const supportId = (request.params as { id: string }).id

    const client = await pool.connect()
    try {
      await client.query('begin')
      const sup = (await client.query('select * from supports where id = $1 for update', [supportId])).rows[0]
      if (!sup) {
        await client.query('rollback')
        return reply.code(404).send({ error: 'Request not found.' })
      }
      const proj = (await client.query('select * from projects where id = $1 for update', [sup.project_id])).rows[0]
      if (!proj || proj.owner_id !== s.id) {
        await client.query('rollback')
        return reply.code(404).send({ error: 'Request not found.' })
      }
      if (sup.status !== 'Requested') {
        await client.query('rollback')
        return reply.code(409).send({ error: 'This request was already answered.' })
      }

      const who = (await client.query(`select name from ${sup.by_kind === 'user' ? 'users' : 'sponsors'} where id = $1`, [sup.by_id])).rows[0]?.name ?? 'A supporter'
      await client.query('update supports set status = $2 where id = $1', [supportId, accept ? 'Accepted' : 'Declined'])

      if (accept) {
        const ws = proj.ws
        if (sup.kind === 'in-kind' && sup.resource_id) {
          ws.resources = (ws.resources ?? []).map((r: { id: string }) => (r.id === sup.resource_id ? { ...r, status: 'Secured' } : r))
        }
        const updates = [{ date: new Date().toISOString().slice(0, 10), text: `${who} is now supporting the project.` }, ...(proj.updates ?? [])]
        await client.query('update projects set ws = $2, updates = $3, version = version + 1, updated_at = now() where id = $1', [
          proj.id, JSON.stringify(ws), JSON.stringify(updates),
        ])
      }
      await client.query('commit')

      await addNotification(
        sup.by_kind,
        sup.by_id,
        accept ? `${proj.ws.project.title} accepted your support` : `${proj.ws.project.title} declined your request`,
        `/projects/${proj.id}`,
      )
      return { ok: true }
    } catch (err) {
      await client.query('rollback').catch(() => undefined)
      throw err
    } finally {
      client.release()
    }
  })

  // Sponsor watchlist.
  app.get('/api/watchlist', async (request, reply) => {
    const s = await requireAccount(request, reply, 'sponsor')
    if (!s) return
    const { rows } = await pool.query('select project_id as "projectId" from watchlist where sponsor_id = $1 order by created_at desc', [s.id])
    return { watchlist: rows }
  })

  app.put('/api/watchlist/:projectId', async (request, reply) => {
    const s = await requireAccount(request, reply, 'sponsor')
    if (!s) return
    const projectId = (request.params as { projectId: string }).projectId
    const ok = await pool.query('select 1 from projects where id = $1 and listed = true', [projectId])
    if (!ok.rowCount) return reply.code(404).send({ error: 'Project not found.' })
    await pool.query('insert into watchlist (sponsor_id, project_id) values ($1,$2) on conflict do nothing', [s.id, projectId])
    return { ok: true }
  })

  app.delete('/api/watchlist/:projectId', async (request, reply) => {
    const s = await requireAccount(request, reply, 'sponsor')
    if (!s) return
    await pool.query('delete from watchlist where sponsor_id = $1 and project_id = $2', [s.id, (request.params as { projectId: string }).projectId])
    return { ok: true }
  })

  // Notifications for the signed-in account.
  app.get('/api/notifications', async (request, reply) => {
    const s = await requireAccount(request, reply)
    if (!s) return
    const { rows } = await pool.query(
      `select id, text, link, read, to_char(created_at, 'YYYY-MM-DD') as date
         from notifications where account_kind = $1 and account_id = $2 order by created_at desc limit 30`,
      [s.kind, s.id],
    )
    return { notifications: rows }
  })

  app.post('/api/notifications/read', async (request, reply) => {
    const s = await requireAccount(request, reply)
    if (!s) return
    await pool.query('update notifications set read = true where account_kind = $1 and account_id = $2', [s.kind, s.id])
    return { ok: true }
  })
}
