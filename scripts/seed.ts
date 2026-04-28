#!/usr/bin/env tsx
/**
 * npm run db:seed
 *
 * Creates the admin user. Safe to re-run (upserts on username conflict).
 * Reads credentials from env vars — set these in Kubero before deploying:
 *
 *   ADMIN_USERNAME=your-username   (default: admin)
 *   ADMIN_PASSWORD=your-password   (default: password)
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const isSqlite = !process.env.DATABASE_URL || url.startsWith('file:')

const adminUsername = process.env.ADMIN_USERNAME || 'admin'
const adminPassword = process.env.ADMIN_PASSWORD || 'password'

async function seedSqlite(hash: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3')
  const filePath = url.replace('file:', '') || './dev.db'
  const db = new Database(filePath)

  db.prepare(`
    INSERT INTO users (id, username, password, role, manager_id, created_at)
    VALUES (?, ?, ?, 'ADMIN', NULL, ?)
    ON CONFLICT(username) DO UPDATE SET password = excluded.password
  `).run(randomUUID(), adminUsername, hash, Date.now())

  db.close()
}

async function seedPostgres(hash: string) {
  const { Pool } = await import('pg')
  const useSSL = process.env.DATABASE_SSL === 'true'
  const pool = new Pool({ connectionString: url, ssl: useSSL ? { rejectUnauthorized: false } : undefined })
  const client = await pool.connect()
  try {
    await client.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, 'ADMIN')
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
      [adminUsername, hash]
    )
  } finally {
    client.release()
    await pool.end()
  }
}

async function seed() {
  console.log(`[seed] Creating admin user "${adminUsername}"…`)
  const hash = await bcrypt.hash(adminPassword, 12)

  if (isSqlite) {
    await seedSqlite(hash)
  } else {
    await seedPostgres(hash)
  }

  console.log(`[seed] Done — admin user "${adminUsername}" is ready.`)
}

seed().catch((err) => {
  console.error('[seed] Failed:', err.message)
  process.exit(1)
})
