import { pgTable, uuid, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { type AdapterAccount } from 'next-auth/adapters';

export const roleEnum = pgEnum('role', ['admin', 'developer', 'hr']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'approved', 'rejected']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  image: text('image'),
  role: roleEnum('role').notNull().default('developer'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }).notNull().default('0'),
  jiraToken: text('jira_token'),
  jiraUrl: text('jira_url'),
  jiraConnected: boolean('jira_connected').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NextAuth.js required tables
export const accounts = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: [account.provider, account.providerAccountId],
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: [vt.identifier, vt.token],
  })
);

export const weeks = pgTable('weeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isOpen: boolean('is_open').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  weekId: uuid('week_id').notNull().references(() => weeks.id),
  jiraTaskId: text('jira_task_id'),
  jiraTaskKey: text('jira_task_key'),
  description: text('description').notNull(),
  hours: decimal('hours', { precision: 5, scale: 2 }).notNull(),
  status: taskStatusEnum('status').notNull().default('pending'),
  adminComment: text('admin_comment'),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceStatusEnum = pgEnum('invoice_status', ['pending', 'paid', 'rejected']);

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  weekId: uuid('week_id').references(() => weeks.id),
  invoiceNumber: text('invoice_number').notNull(),
  totalHours: decimal('total_hours', { precision: 8, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('pending'),
  pdfUrl: text('pdf_url'),
  fileName: text('file_name'),
  fileUrl: text('file_url'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment evidence records (for admin/HR to upload payment proofs)
export const paymentEvidence = pgTable('payment_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  weekId: uuid('week_id').notNull().references(() => weeks.id),
  filename: text('filename').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Jira integration for developers
export const jiraIntegration = pgTable('jira_integration', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  accessToken: text('access_token').notNull(),
  cloudId: text('cloud_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Developer work schedules (for tracking expected work hours)
export const developerWorkSchedules = pgTable('developer_work_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  daysPerWeek: integer('days_per_week').notNull().default(5),
  hoursPerDay: integer('hours_per_day').notNull().default(8),
  expectedPayout: decimal('expected_payout', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  weekId: uuid('week_id').notNull().references(() => weeks.id),
  totalHours: decimal('total_hours', { precision: 8, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  approvedBy: uuid('approved_by').notNull().references(() => users.id),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  invoices: many(invoices),
  payments: many(payments),
  accounts: many(accounts),
  sessions: many(sessions),
  workSchedule: one(developerWorkSchedules, {
    fields: [users.id],
    references: [developerWorkSchedules.userId],
  }),
}));

export const developerWorkSchedulesRelations = relations(developerWorkSchedules, ({ one }) => ({
  user: one(users, {
    fields: [developerWorkSchedules.userId],
    references: [users.id],
  }),
}));

export const weeksRelations = relations(weeks, ({ many }) => ({
  tasks: many(tasks),
  invoices: many(invoices),
  payments: many(payments),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  week: one(weeks, {
    fields: [tasks.weekId],
    references: [weeks.id],
  }),
  approver: one(users, {
    fields: [tasks.approvedBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  week: one(weeks, {
    fields: [invoices.weekId],
    references: [weeks.id],
  }),
  uploader: one(users, {
    fields: [invoices.uploadedBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  week: one(weeks, {
    fields: [payments.weekId],
    references: [weeks.id],
  }),
  approver: one(users, {
    fields: [payments.approvedBy],
    references: [users.id],
  }),
}));