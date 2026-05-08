#!/usr/bin/env tsx
/**
 * npm run db:setup
 *
 * Creates all tables. Safe to re-run (IF NOT EXISTS).
 * Auto-detects backend from DATABASE_URL:
 *   file:…   → SQLite (better-sqlite3)
 *   postgres… → PostgreSQL (pg)
 */

import 'dotenv/config'

const url = process.env.DATABASE_URL || 'file:./dev.db'

async function setupSqlite() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3')
  const filePath = url.replace('file:', '') || './dev.db'
  const db = new Database(filePath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL,
      manager_id  TEXT REFERENCES users(id),
      created_at  INTEGER
    );
    CREATE TABLE IF NOT EXISTS document_requests (
      id            TEXT    PRIMARY KEY,
      name          TEXT    NOT NULL,
      phone         TEXT    NOT NULL,
      language      TEXT    NOT NULL,
      dob           TEXT    NOT NULL,
      gender        TEXT    NOT NULL,
      is_active     INTEGER NOT NULL DEFAULT 1,
      token         TEXT    UNIQUE NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'NOT_UPLOADED',
      created_at    INTEGER NOT NULL,
      uploaded_at   INTEGER,
      file_name     TEXT,
      file_type     TEXT,
      file_size     INTEGER,
      file_path     TEXT,
      created_by_id TEXT    NOT NULL REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_doc_requests_created_by ON document_requests(created_by_id);
    CREATE INDEX IF NOT EXISTS idx_doc_requests_token      ON document_requests(token);
    CREATE INDEX IF NOT EXISTS idx_doc_requests_status     ON document_requests(status);
    CREATE INDEX IF NOT EXISTS idx_users_manager           ON users(manager_id);
  `)
  db.close()
  console.log('✅  SQLite tables created at', filePath)
}

async function setupPostgres() {
  const { Pool } = await import('pg')
  const useSSL = process.env.DATABASE_SSL === 'true'
  const pool = new Pool({ connectionString: url, ssl: useSSL ? { rejectUnauthorized: false } : undefined })
  const client = await pool.connect()
  console.log('🔌  Connected to PostgreSQL.')
  try {
    await client.query('BEGIN')
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        username    TEXT        UNIQUE NOT NULL,
        password    TEXT        NOT NULL,
        role        TEXT        NOT NULL,
        manager_id  UUID        REFERENCES users(id),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_requests (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT        NOT NULL,
        phone         TEXT        NOT NULL,
        language      TEXT        NOT NULL,
        dob           TEXT        NOT NULL,
        gender        TEXT        NOT NULL,
        is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
        token         UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        status        TEXT        NOT NULL DEFAULT 'NOT_UPLOADED',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        uploaded_at   TIMESTAMPTZ,
        file_name     TEXT,
        file_type     TEXT,
        file_size     INTEGER,
        file_path     TEXT,
        created_by_id UUID        NOT NULL REFERENCES users(id)
      )
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_requests_created_by ON document_requests(created_by_id);
      CREATE INDEX IF NOT EXISTS idx_doc_requests_token      ON document_requests(token);
      CREATE INDEX IF NOT EXISTS idx_doc_requests_status     ON document_requests(status);
      CREATE INDEX IF NOT EXISTS idx_users_manager           ON users(manager_id);
    `)
    await client.query(`
      ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS file2_name TEXT;
      ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS file2_type TEXT;
      ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS file2_size INTEGER;
      ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS file2_path TEXT;
    `)
    await client.query('COMMIT')
    console.log('✅  PostgreSQL tables created successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

const isSqlite = !process.env.DATABASE_URL || url.startsWith('file:')

;(isSqlite ? setupSqlite() : setupPostgres()).catch((err) => {
  console.error('❌  db:setup failed:', err.message)
  process.exit(1)
})
