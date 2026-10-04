import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const plannerState = sqliteTable('planner_state', { owner: text('owner').primaryKey(), payload: text('payload').notNull(), revision: integer('revision').notNull().default(0), updatedAt: text('updated_at').notNull() });
export const sheetConnections = sqliteTable('sheet_connections', { owner: text('owner').notNull(), profileId: text('profile_id').notNull(), endpoint: text('endpoint').notNull(), secret: text('secret').notNull(), spreadsheetId: text('spreadsheet_id').notNull(), autoSync: integer('auto_sync').notNull().default(0), lastRevision: integer('last_revision'), lastSyncedAt: text('last_synced_at'), lastError: text('last_error') }, table => [primaryKey({ columns: [table.owner, table.profileId] })]);
export const athleteAccounts = sqliteTable('athlete_accounts', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), profileId: text('profile_id').notNull(), username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(), passwordVersion: integer('password_version').notNull().default(1), disabled: integer('disabled').notNull().default(0),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, table => [uniqueIndex('athlete_accounts_owner_profile').on(table.owner, table.profileId), uniqueIndex('athlete_accounts_owner_username').on(table.owner, table.username)]);
export const athleteSessions = sqliteTable('athlete_sessions', {
  tokenHash: text('token_hash').primaryKey(), owner: text('owner').notNull(), accountId: text('account_id').notNull().references(() => athleteAccounts.id, { onDelete: 'cascade' }),
  accountVersion: integer('account_version').notNull(), createdAt: integer('created_at').notNull(), expiresAt: integer('expires_at').notNull(),
}, table => [index('athlete_sessions_account').on(table.accountId), index('athlete_sessions_expiry').on(table.expiresAt)]);
export const authRateLimits = sqliteTable('auth_rate_limits', {
  key: text('key').primaryKey(), windowStart: integer('window_start').notNull(), attempts: integer('attempts').notNull(),
}, table => [index('auth_rate_limits_window').on(table.windowStart)]);
// Raw copy of a damaged document, written in the same batch that replaces it (lib/state-store.ts).
export const plannerStateBackups = sqliteTable('planner_state_backups', {
  owner: text('owner').notNull(), revision: integer('revision').notNull(), payload: text('payload').notNull(), reason: text('reason').notNull(), createdAt: text('created_at').notNull(),
}, table => [primaryKey({ columns: [table.owner, table.revision] })]);
// Records set aside by read-time recovery; key = sha256(raw record):occurrence, so inserts are idempotent.
export const plannerQuarantine = sqliteTable('planner_quarantine', {
  owner: text('owner').notNull(), collection: text('collection').notNull(), recordKey: text('record_key').notNull(), recordId: text('record_id'), profileId: text('profile_id'),
  rawJson: text('raw_json').notNull(), ruleCodes: text('rule_codes').notNull(), resolution: text('resolution').notNull(), sourceRevision: integer('source_revision').notNull(),
  createdAt: text('created_at').notNull(), resolvedAt: text('resolved_at'),
}, table => [primaryKey({ columns: [table.owner, table.collection, table.recordKey] }), index('planner_quarantine_owner_profile').on(table.owner, table.profileId)]);
