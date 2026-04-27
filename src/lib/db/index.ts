/**
 * Generic Database Client
 *
 * Auto-detects the backend from DATABASE_URL:
 *   file:./dev.db   → SQLite (better-sqlite3) — zero-setup local dev
 *   postgresql://…  → PostgreSQL (pg) — Docker / Supabase / Neon / RDS
 *
 * The query API (select, insert, update, where…) is identical for both.
 * Switch backends by changing DATABASE_URL in .env — no code changes needed.
 */

import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as pgSchema from './schema'

const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db'
const IS_SQLITE = !process.env.DATABASE_URL || DATABASE_URL.startsWith('file:')

function createClient() {
  if (IS_SQLITE) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require('drizzle-orm/better-sqlite3')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sqliteSchema = require('./schema-sqlite')
    const filePath = DATABASE_URL.replace('file:', '') || './dev.db'
    const sqlite = new Database(filePath)
    // Enable WAL mode for better concurrent read performance
    sqlite.pragma('journal_mode = WAL')
    return { db: drizzle(sqlite, { schema: sqliteSchema }), schema: sqliteSchema }
  }

  const useSSL = process.env.DATABASE_SSL === 'true'
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  })
  return { db: drizzlePg(pool, { schema: pgSchema }), schema: pgSchema }
}

const { db: _db, schema: _schema } = createClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any { return _db }

// Typed as PG schema for TypeScript — at runtime points to the right adapter's table
export const users = _schema.users as typeof pgSchema.users
export const documentRequests = _schema.documentRequests as typeof pgSchema.documentRequests

export type { User, NewUser, DocumentRequest, NewDocumentRequest } from './schema'
