import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'OM' | 'TELECALLER'
  managerId: uuid('manager_id').references((): AnyPgColumn => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const documentRequests = pgTable('document_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  language: text('language').notNull(),
  dob: text('dob').notNull(),
  gender: text('gender').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  token: uuid('token').unique().notNull().defaultRandom(),
  status: text('status').default('NOT_UPLOADED').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
  fileName: text('file_name'),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  filePath: text('file_path'),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
})

export const usersRelations = relations(users, ({ many, one }) => ({
  documents: many(documentRequests),
  teamMembers: many(users, { relationName: 'manager' }),
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: 'manager',
  }),
}))

export const documentRequestsRelations = relations(documentRequests, ({ one }) => ({
  createdBy: one(users, {
    fields: [documentRequests.createdById],
    references: [users.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type DocumentRequest = typeof documentRequests.$inferSelect
export type NewDocumentRequest = typeof documentRequests.$inferInsert
