import { database } from './storage';
import type { State } from './domain';
import type { Issue, QuarantineEntry } from './state-recovery';

// Writes of the coach document plus the recovery tables (drizzle/0002). Every query is scoped by owner.

/** The document version a write is based on. `corrupt` = explicit coach repair of an unreadable document. */
export type WriteBase = { revision: number; health?: 'ok' | 'degraded' | 'corrupt'; quarantine?: QuarantineEntry[] };
export type WriteOptions = {
  reason: string;
  /** Extra SQL condition appended to the CAS update (e.g. the athlete session check). */
  guard?: { sql: string; params: unknown[] };
  /** Disables automatic Sheets export for the owner in the same transaction (used after a repair). */
  pauseSheets?: string;
};

/**
 * Compare-and-swap write of the whole document. When the base was not healthy, the raw stored
 * payload is copied to planner_state_backups and quarantined records to planner_quarantine in
 * the SAME D1 batch (a transaction): either all of it is committed or nothing changes.
 * Returns false when the revision (or guard) no longer matches.
 */
export async function writeState(owner: string, base: WriteBase, state: State, options: WriteOptions): Promise<boolean> {
  const db = database(), now = new Date().toISOString(), statements: D1PreparedStatement[] = [];
  const atBase = 'EXISTS (SELECT 1 FROM planner_state WHERE owner = ? AND revision = ?)';
  if (base.health === 'degraded' || base.health === 'corrupt') {
    // Copied inside SQLite, so the backup is byte-for-byte the stored payload at that revision.
    statements.push(db.prepare('INSERT OR IGNORE INTO planner_state_backups (owner, revision, payload, reason, created_at) SELECT owner, revision, payload, ?, ? FROM planner_state WHERE owner = ? AND revision = ?').bind(options.reason, now, owner, base.revision));
  }
  if (base.health === 'degraded' && base.quarantine?.length) {
    const rows = base.quarantine.map(e => ({ collection: e.collection, key: e.key, recordId: e.recordId, profileId: e.profileId, raw: e.raw, issues: JSON.stringify(e.issues), resolution: e.resolution }));
    statements.push(db.prepare(`INSERT OR IGNORE INTO planner_quarantine (owner, collection, record_key, record_id, profile_id, raw_json, rule_codes, resolution, source_revision, created_at) SELECT ?, json_extract(value, '$.collection'), json_extract(value, '$.key'), json_extract(value, '$.recordId'), json_extract(value, '$.profileId'), json_extract(value, '$.raw'), json_extract(value, '$.issues'), json_extract(value, '$.resolution'), ?, ? FROM json_each(?) WHERE ${atBase}`).bind(owner, base.revision, now, JSON.stringify(rows), owner, base.revision));
  }
  if (options.pauseSheets) statements.push(db.prepare(`UPDATE sheet_connections SET auto_sync = 0, last_error = ? WHERE owner = ? AND auto_sync = 1 AND ${atBase}`).bind(options.pauseSheets, owner, owner, base.revision));
  statements.push(db.prepare(`UPDATE planner_state SET payload = ?, revision = revision + 1, updated_at = ? WHERE owner = ? AND revision = ?${options.guard ? ' AND ' + options.guard.sql : ''}`).bind(JSON.stringify(state), now, owner, base.revision, ...(options.guard?.params || [])));
  const results = await db.batch(statements);
  return !!results.at(-1)?.meta.changes;
}

export type StoredQuarantine = { collection: string; key: string; recordId: string | null; profileId: string | null; issues: Issue[]; resolution: string; sourceRevision: number; createdAt: string; raw?: string };
type Row = { collection: string; record_key: string; record_id: string | null; profile_id: string | null; rule_codes: string; resolution: string; source_revision: number; created_at: string; raw_json?: string };
const fromRow = (r: Row): StoredQuarantine => ({ collection: r.collection, key: r.record_key, recordId: r.record_id, profileId: r.profile_id, issues: JSON.parse(r.rule_codes), resolution: r.resolution, sourceRevision: r.source_revision, createdAt: r.created_at, ...(r.raw_json !== undefined ? { raw: r.raw_json } : {}) });
/** Unresolved quarantined records of one owner (coach only). */
export async function listQuarantine(owner: string, includeRaw = false) {
  const rows = await database().prepare(`SELECT collection, record_key, record_id, profile_id, rule_codes, resolution, source_revision, created_at${includeRaw ? ', raw_json' : ''} FROM planner_quarantine WHERE owner = ? AND resolved_at IS NULL ORDER BY created_at, collection, record_key LIMIT 1000`).bind(owner).all<Row>();
  return rows.results.map(fromRow);
}
/** Coach view: records quarantined in memory by the current read plus those already stored. */
export async function quarantineOverview(owner: string, live: QuarantineEntry[] = [], includeRaw = false) {
  const stored = await listQuarantine(owner, includeRaw), seen = new Set(stored.map(q => q.collection + '/' + q.key));
  const pending = live.filter(e => !seen.has(e.collection + '/' + e.key)).map(e => ({ collection: e.collection, key: e.key, recordId: e.recordId, profileId: e.profileId, issues: e.issues, resolution: e.resolution, stored: false, ...(includeRaw ? { raw: e.raw } : {}) }));
  return [...pending, ...stored.map(q => ({ ...q, stored: true }))];
}
export async function resolveQuarantine(owner: string, keys: { collection: string; key: string }[]) {
  if (!keys.length) return 0;
  const result = await database().prepare("UPDATE planner_quarantine SET resolved_at = ? WHERE owner = ? AND resolved_at IS NULL AND collection || '/' || record_key IN (SELECT value FROM json_each(?))").bind(new Date().toISOString(), owner, JSON.stringify(keys.map(k => k.collection + '/' + k.key))).run();
  return result.meta.changes || 0;
}
/** True when a removed profile record is waiting in quarantine: its account stays locked. */
export async function profileQuarantined(owner: string, profileId: string) {
  return !!await database().prepare("SELECT 1 AS found FROM planner_quarantine WHERE owner = ? AND collection = 'profiles' AND profile_id = ? AND resolution = 'removed' AND resolved_at IS NULL LIMIT 1").bind(owner, profileId).first();
}
/** True when exporting this profile would drop records that are still in quarantine. */
export async function exportBlocked(owner: string, profileId: string, live: QuarantineEntry[] = []) {
  if (live.some(e => e.resolution === 'removed' && (e.profileId === profileId || e.profileId === null))) return true;
  return !!await database().prepare("SELECT 1 AS found FROM planner_quarantine WHERE owner = ? AND resolution = 'removed' AND resolved_at IS NULL AND (profile_id = ? OR profile_id IS NULL) LIMIT 1").bind(owner, profileId).first();
}
export async function listBackups(owner: string) {
  const rows = await database().prepare('SELECT revision, reason, created_at AS createdAt, length(CAST(payload AS BLOB)) AS bytes FROM planner_state_backups WHERE owner = ? ORDER BY revision DESC LIMIT 100').bind(owner).all<{ revision: number; reason: string; createdAt: string; bytes: number }>();
  return rows.results;
}
export async function readBackup(owner: string, revision: number) {
  return database().prepare('SELECT revision, reason, created_at AS createdAt, payload FROM planner_state_backups WHERE owner = ? AND revision = ?').bind(owner, revision).first<{ revision: number; reason: string; createdAt: string; payload: string }>();
}
