import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db.js'
import { addNotification } from '../projects.js'
import { requireStaff } from '../session.js'

type Actor = { id: string; name: string }

async function log(actor: Actor, action: string, projectId: string, title: string, reason = '') {
  await pool.query(
    'insert into moderation_log (id, actor_id, actor_name, action, project_id, project_title, reason) values ($1,$2,$3,$4,$5,$6,$7)',
    [randomUUID(), actor.id, actor.name, action, projectId, title, reason],
  )
}

const LIST_SELECT = `select p.id, p.ws->'project'->>'title' as title, p.types, p.status, p.listed, p.removed,
    p.removed_reason as "removedReason", u.name as "ownerName", u.email as "ownerEmail",
    to_char(p.updated_at, 'YYYY-MM-DD') as updated,
    (select count(*)::int from reports r where r.project_id = p.id and r.status = 'open') as "openReports"
  from projects p join users u on u.id = p.owner_id`

export async function staffRoutes(app: FastifyInstance) {
  app.get('/api/staff/projects', async (request, reply) => {
    const st = await requireStaff(request, reply)
    if (!st) return
    const q = z.object({ q: z.string().max(100).default(''), filter: z.enum(['all', 'listed', 'removed', 'reported']).default('all') }).parse(request.query)
    const where: string[] = []
    const params: unknown[] = []
    if (q.q.trim()) {
      params.push(`%${q.q.trim()}%`)
      where.push(`(p.ws->'project'->>'title' ilike $${params.length} or u.name ilike $${params.length} or u.email ilike $${params.length})`)
    }
    if (q.filter === 'listed') where.push('p.listed and not p.removed')
    if (q.filter === 'removed') where.push('p.removed')
    if (q.filter === 'reported') where.push("exists (select 1 from reports r where r.project_id = p.id and r.status = 'open')")
    const sql = `${LIST_SELECT} ${where.length ? `where ${where.join(' and ')}` : ''} order by p.updated_at desc limit 200`
    return { projects: (await pool.query(sql, params)).rows, role: st.role }
  })

  app.post('/api/staff/projects/:id/remove', async (request, reply) => {
    const st = await requireStaff(request, reply)
    if (!st) return
    const id = (request.params as { id: string }).id
    const { reason } = z.object({ reason: z.string().trim().min(5, 'Please give a reason (at least 5 characters).').max(1000) }).parse(request.body)
    const { rows } = await pool.query(
      `update projects set removed = true, listed = false, removed_reason = $2, removed_by = $3, removed_at = now(), updated_at = now()
        where id = $1 and not removed returning owner_id, ws->'project'->>'title' as title`,
      [id, reason, st.id],
    )
    if (!rows[0]) return reply.code(404).send({ error: 'Project not found or already removed.' })
    await pool.query("update reports set status = 'actioned', handled_by = $2, handled_at = now() where project_id = $1 and status = 'open'", [id, st.id])
    await log(st, 'removed', id, rows[0].title, reason)
    await addNotification('user', rows[0].owner_id, `"${rows[0].title}" was removed by moderators: ${reason}`, `/my-projects/${id}/overview`)
    return { ok: true }
  })

  app.post('/api/staff/projects/:id/restore', async (request, reply) => {
    const st = await requireStaff(request, reply)
    if (!st) return
    const id = (request.params as { id: string }).id
    const { rows } = await pool.query(
      `update projects set removed = false, removed_reason = '', removed_by = null, removed_at = null, updated_at = now()
        where id = $1 and removed returning owner_id, ws->'project'->>'title' as title`,
      [id],
    )
    if (!rows[0]) return reply.code(404).send({ error: 'Project not found or not removed.' })
    await log(st, 'restored', id, rows[0].title)
    await addNotification('user', rows[0].owner_id, `"${rows[0].title}" was restored. You can list it again from the Overview.`, `/my-projects/${id}/overview`)
    return { ok: true }
  })

  // Permanent deletion is admin-only.
  app.delete('/api/staff/projects/:id', async (request, reply) => {
    const st = await requireStaff(request, reply, 'admin')
    if (!st) return
    const id = (request.params as { id: string }).id
    const { rows } = await pool.query("delete from projects where id = $1 returning ws->'project'->>'title' as title", [id])
    if (!rows[0]) return reply.code(404).send({ error: 'Project not found.' })
    await log(st, 'deleted', id, rows[0].title)
    return { ok: true }
  })

  app.get('/api/staff/reports', async (request, reply) => {
    const st = await requireStaff(request, reply)
    if (!st) return
    const { rows } = await pool.query(
      `select r.id, r.project_id as "projectId", p.ws->'project'->>'title' as title, r.reason, r.details,
              to_char(r.created_at, 'YYYY-MM-DD') as date,
              case when r.by_kind = 'user' then (select name from users where id = r.by_id)
                   else (select name from sponsors where id = r.by_id) end as "reporter"
         from reports r join projects p on p.id = r.project_id
        where r.status = 'open' order by r.created_at desc limit 200`,
    )
    return { reports: rows }
  })

  app.post('/api/staff/reports/:id/dismiss', async (request, reply) => {
    const st = await requireStaff(request, reply)
    if (!st) return
    const { rows } = await pool.query(
      `update reports set status = 'dismissed', handled_by = $2, handled_at = now() where id = $1 and status = 'open' returning project_id`,
      [(request.params as { id: string }).id, st.id],
    )
    if (!rows[0]) return reply.code(404).send({ error: 'Report not found.' })
    const t = await pool.query("select ws->'project'->>'title' as title from projects where id = $1", [rows[0].project_id])
    await log(st, 'dismissed report', rows[0].project_id, t.rows[0]?.title ?? '')
    return { ok: true }
  })

  app.get('/api/staff/log', async (request, reply) => {
    const st = await requireStaff(request, reply)
    if (!st) return
    const { rows } = await pool.query(
      `select id, actor_name as actor, action, project_id as "projectId", project_title as title, reason,
              to_char(created_at, 'YYYY-MM-DD HH24:MI') as at
         from moderation_log order by created_at desc limit 100`,
    )
    return { log: rows }
  })

  // Admin manages who is on the ops team.
  app.get('/api/staff/team', async (request, reply) => {
    const st = await requireStaff(request, reply, 'admin')
    if (!st) return
    const { rows } = await pool.query("select id, name, email, staff_role as role from users where staff_role is not null order by staff_role, name")
    return { team: rows }
  })

  app.post('/api/staff/team', async (request, reply) => {
    const st = await requireStaff(request, reply, 'admin')
    if (!st) return
    const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(request.body)
    const { rows } = await pool.query("update users set staff_role = 'ops' where email = $1 and staff_role is null returning id, name", [email])
    if (!rows[0]) return reply.code(404).send({ error: 'No creator account with that email, or they are already staff.' })
    return { ok: true }
  })

  app.delete('/api/staff/team/:id', async (request, reply) => {
    const st = await requireStaff(request, reply, 'admin')
    if (!st) return
    const { rowCount } = await pool.query("update users set staff_role = null where id = $1 and staff_role = 'ops'", [(request.params as { id: string }).id])
    if (!rowCount) return reply.code(404).send({ error: 'Ops team member not found.' })
    return { ok: true }
  })
}
