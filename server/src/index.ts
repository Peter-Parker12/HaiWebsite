import { existsSync } from 'node:fs'
import cookie from '@fastify/cookie'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import { config } from './config.js'
import { migrate, pool, waitForDb } from './db.js'
import { authRoutes } from './routes/auth.js'
import { projectRoutes } from './routes/projects.js'
import { staffRoutes } from './routes/staff.js'
import { supportRoutes } from './routes/supports.js'
import { bootstrapAdmin, seedDemoAccounts, seedDemoProjects } from './seed.js'
import { purgeExpiredSessions } from './session.js'

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 1_000_000 })

await app.register(cookie)

app.setErrorHandler((err, request, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({ error: err.issues[0]?.message ?? 'Invalid request.', issues: err.issues })
  }
  const status = (err as { statusCode?: number }).statusCode ?? 500
  if (status >= 500) request.log.error(err)
  reply.code(status).send({ error: status >= 500 ? 'Something went wrong.' : err.message })
})

app.get('/api/health', async () => {
  await pool.query('select 1')
  return { ok: true }
})

await app.register(authRoutes)
await app.register(projectRoutes)
await app.register(supportRoutes)
await app.register(staffRoutes)

// Built frontend (single container, no CORS). Unknown non-API paths fall back to the SPA.
if (existsSync(config.staticDir)) {
  await app.register(fastifyStatic, {
    root: config.staticDir,
    wildcard: false,
    cacheControl: false,
    setHeaders(res, filePath) {
      res.setHeader('Cache-Control', filePath.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
    },
  })
  app.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET' || request.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found.' })
    return reply.sendFile('index.html')
  })
} else {
  app.log.warn(`static dir ${config.staticDir} not found; serving the API only`)
}

await waitForDb()
await migrate()
await bootstrapAdmin()
if (config.seedDemo) {
  await seedDemoAccounts()
  await seedDemoProjects()
}
await purgeExpiredSessions()
setInterval(() => purgeExpiredSessions().catch(() => undefined), 6 * 3_600_000).unref()

await app.listen({ port: config.port, host: '0.0.0.0' })
