import { pgTable, text, timestamp, boolean, uuid, json } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').default('user').notNull(),
    status: text('status').default('pending').notNull(),
    avatar: text('avatar'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Roles table
export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    value: text('value').notNull().unique(),
    label: text('label').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
});

// Projects table
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    priority: text('priority').default('Medium').notNull(),
    status: text('status').default('Active').notNull(),
    description: text('description'),
    stream: json('stream').$type<string[]>(),
    icon: text('icon'),
    notes: text('notes'),
    documents: json('documents'), // Store documents as JSON array
    archived: boolean('archived').default(false).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Phases table
export const phases = pgTable('phases', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    status: text('status').default('pending').notNull(),
    progress: text('progress').default('0').notNull(),
    order: text('order').default('0').notNull(),
});

// Project PICs (many-to-many)
export const projectPics = pgTable('project_pics', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    avatar: text('avatar'),
});

// Parameters table
export const parameters = pgTable('parameters', {
    id: uuid('id').primaryKey().defaultRandom(),
    category: text('category').notNull(), // 'role', 'phase', 'status', 'priority'
    label: text('label').notNull(),
    value: text('value').notNull(), // code or internal value
    color: text('color'),
    order: text('order').default('0'), // for sorting
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Messages table
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    sender: text('sender').notNull(),
    type: text('type').default('info').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Phase = typeof phases.$inferSelect;
export type NewPhase = typeof phases.$inferInsert;
export type Parameter = typeof parameters.$inferSelect;
export type NewParameter = typeof parameters.$inferInsert;

import { relations } from 'drizzle-orm';

// ... existing imports ...

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // CREATE, UPDATE, DELETE, ARCHIVE
    entityType: text('entity_type').notNull(), // PROJECT, PHASE
    entityId: uuid('entity_id'),
    details: text('details').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

import { AnyPgColumn } from 'drizzle-orm/pg-core';

// Bugs table
export const bugs = pgTable('bugs', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(), // GMMP-101
    summary: text('summary').notNull(),
    description: text('description'),
    reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'set null' }),
    status: text('status').default('OPEN').notNull(),
    priority: text('priority').default('Medium').notNull(),
    type: text('type').default('Bug').notNull(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => bugs.id, { onDelete: 'set null' }),
    components: json('components').$type<string[]>(),
    labels: json('labels').$type<string[]>(),
    attachments: json('attachments').$type<string[]>(), // Array of URLs
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bugsRelations = relations(bugs, ({ one, many }) => ({
    reporter: one(users, {
        fields: [bugs.reporterId],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [bugs.projectId],
        references: [projects.id],
    }),
    parent: one(bugs, {
        fields: [bugs.parentId],
        references: [bugs.id],
        relationName: 'child_bugs',
    }),
    children: many(bugs, {
        relationName: 'child_bugs',
    }),
}));

export type Bug = typeof bugs.$inferSelect;
export type NewBug = typeof bugs.$inferInsert;
