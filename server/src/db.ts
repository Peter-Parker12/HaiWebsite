import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import pg from 'pg'
import { config } from './config.js'

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The database container may still be starting; retry for a while. */
export async function waitForDb(tries = 30) {
  for (let i = 1; ; i++) {
    try {
      await pool.query('select 1')
      return
    } catch (err) {
      if (i >= tries) throw err
      await sleep(1000)
    }
  }
}

/** Apply sql/*.sql files in name order, once each. */
export async function migrate() {
  await pool.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())')
  const files = (await readdir(config.migrationsDir)).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    const done = await pool.query('select 1 from schema_migrations where name = $1', [file])
    if (done.rowCount) continue
    const sql = await readFile(join(config.migrationsDir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query('insert into schema_migrations (name) values ($1)', [file])
      await client.query('commit')
      console.log(`migration applied: ${file}`)
    } catch (err) {
      await client.query('rollback')
      throw err
    } finally {
      client.release()
    }
  }
}
