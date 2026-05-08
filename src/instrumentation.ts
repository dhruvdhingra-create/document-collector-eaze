export async function register() {
  // Only run in Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const url = process.env.DATABASE_URL || 'file:./dev.db'
  const isSqlite = url.startsWith('file:')

  try {
    if (isSqlite) {
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
      console.log('[db] SQLite tables ready')
    } else {
      const { Pool } = await import('pg')
      const useSSL = process.env.DATABASE_SSL === 'true'
      const pool = new Pool({
        connectionString: url,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      })
      const client = await pool.connect()
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
        console.log('[db] PostgreSQL tables ready')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
        await pool.end()
      }
    }
  } catch (err: any) {
    console.error('[db] Auto-setup failed:', err.message)
    // Don't crash the server — tables may already exist or be managed externally
  }
}
