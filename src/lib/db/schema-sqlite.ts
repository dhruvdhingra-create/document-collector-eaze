import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  managerId: text('manager_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const documentRequests = sqliteTable('document_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  language: text('language').notNull(),
  dob: text('dob').notNull(),
  gender: text('gender').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  token: text('token').unique().notNull().$defaultFn(() => crypto.randomUUID()),
  status: text('status').default('NOT_UPLOADED').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }),
  fileName: text('file_name'),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  filePath: text('file_path'),
  createdById: text('created_by_id').notNull(),
})
