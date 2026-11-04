import { fileURLToPath } from 'node:url'

const env = process.env
const here = fileURLToPath(new URL('.', import.meta.url))

export const config = {
  port: Number(env.PORT ?? 8392),
  databaseUrl: env.DATABASE_URL ?? 'postgres://cb:cb@localhost:5432/conceptbridge',
  /** Send the session cookie only over HTTPS. Keep true behind the Cloudflare tunnel. */
  cookieSecure: (env.COOKIE_SECURE ?? (env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true',
  /** Create the demo creators/sponsors (password "demo1234") on startup. */
  seedDemo: env.SEED_DEMO === 'true',
  adminEmail: env.ADMIN_EMAIL?.trim().toLowerCase() || undefined,
  adminPassword: env.ADMIN_PASSWORD || undefined,
  staticDir: env.STATIC_DIR ?? fileURLToPath(new URL('../../dist', import.meta.url)),
  migrationsDir: fileURLToPath(new URL('../sql', import.meta.url)),
  sessionDays: 30,
  here,
}

export const DEMO_PASSWORD = 'demo1234'
