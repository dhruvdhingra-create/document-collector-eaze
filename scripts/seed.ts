#!/usr/bin/env tsx
/**
 * npm run db:seed
 *
 * Creates default users. Safe to re-run.
 * Auto-detects SQLite vs PostgreSQL from DATABASE_URL.
 *
 * Roles:
 *   ADMIN — full access, manages OM accounts
 *   OM    — Onboarding Manager, creates links, views documents
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const isSqlite = !process.env.DATABASE_URL || url.startsWith('file:')

async function seedSqlite(hash: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3')
  const filePath = url.replace('file:', '') || './dev.db'
  const db = new Database(filePath)

  const adminId = randomUUID()
  const now = Date.now()

  const upsertUser = db.prepare(`
    INSERT INTO users (id, username, password, role, manager_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET password = excluded.password, manager_id = excluded.manager_id
  `)

  upsertUser.run(adminId, 'admin', hash, 'ADMIN', null, now)
  upsertUser.run(randomUUID(), 'om1', hash, 'OM', adminId, now)
  upsertUser.run(randomUUID(), 'om2', hash, 'OM', adminId, now)
  upsertUser.run(randomUUID(), 'om3', hash, 'OM', adminId, now)
  db.close()
}

async function seedPostgres(hash: string) {
  const { Pool } = await import('pg')
  const useSSL = process.env.DATABASE_SSL === 'true'
  const pool = new Pool({ connectionString: url, ssl: useSSL ? { rejectUnauthorized: false } : undefined })
  const client = await pool.connect()
  try {
    const { rows: [admin] } = await client.query<{ id: string }>(
      `INSERT INTO users (username, password, role) VALUES ('admin', $1, 'ADMIN')
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password RETURNING id`, [hash])

    await client.query(
      `INSERT INTO users (username, password, role, manager_id)
       VALUES ('om1', $1, 'OM', $2), ('om2', $1, 'OM', $2), ('om3', $1, 'OM', $2)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, manager_id = EXCLUDED.manager_id`,
      [hash, admin.id])
  } finally {
    client.release()
    await pool.end()
  }
}

async function seed() {
  console.log('🔐  Hashing passwords…')
  const hash = await bcrypt.hash('password', 12)

  if (isSqlite) {
    await seedSqlite(hash)
  } else {
    await seedPostgres(hash)
  }

  console.log('\n✅  Seed complete!')
  console.log('   ┌─────────────────────────────────────────────────┐')
  console.log('   │  Role                Username   Password         │')
  console.log('   ├─────────────────────────────────────────────────┤')
  console.log('   │  Admin               admin      password         │')
  console.log('   │  Onboarding Manager  om1        password         │')
  console.log('   │  Onboarding Manager  om2        password         │')
  console.log('   │  Onboarding Manager  om3        password         │')
  console.log('   └─────────────────────────────────────────────────┘')
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
