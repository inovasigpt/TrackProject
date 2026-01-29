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
    icon: text('icon'),
    notes: text('notes'),
    documents: json('documents'), // Store documents as JSON array
    archived: boolean('archived').default(false).notNull(),
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
export type Message = typeof messages.$inferSelect;
export type Parameter = typeof parameters.$inferSelect;
export type NewParameter = typeof parameters.$inferInsert;
