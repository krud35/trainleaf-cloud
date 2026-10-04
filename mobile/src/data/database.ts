
import { AppError } from './errors';
/** Adapters must bind values, serialize transactions and persist before resolving. */
export type SqlValue = string | number | null;
export type SqlRow = Record<string, SqlValue>;

export interface SqlExecutor {
  execute(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;
  query<T extends SqlRow = SqlRow>(sql: string, params?: SqlValue[]): Promise<T[]>;
}

export interface SqlDatabase extends SqlExecutor {
  /** Roll back every statement on error. Never resolve before durable storage succeeds. */
  transaction<T>(operation: (tx: SqlExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export const DATABASE_VERSION = 8;

const migrationOne = [
  `CREATE TABLE local_profiles (
    id TEXT PRIMARY KEY NOT NULL CHECK (id = 'local-profile'),
    display_name TEXT NOT NULL,
    roles TEXT NOT NULL,
    sport_ids TEXT NOT NULL,
    modules TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_state TEXT NOT NULL DEFAULT 'local-only' CHECK (sync_state = 'local-only')
  )`,
  `CREATE TABLE local_workouts (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES local_profiles(id),
    sport_id TEXT NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
    rpe INTEGER CHECK (rpe BETWEEN 0 AND 10),
    notes TEXT NOT NULL DEFAULT '',
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_state TEXT NOT NULL DEFAULT 'local-only' CHECK (sync_state = 'local-only')
  )`,
];

const migrationTwo = [
  'ALTER TABLE local_workouts ADD COLUMN deleted_at TEXT',
  'CREATE INDEX local_workouts_profile_date ON local_workouts(profile_id, deleted_at, date DESC, created_at DESC)',
];

const migrationThree = [
  `CREATE TABLE local_revision_state (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    revision_floor INTEGER NOT NULL CHECK (revision_floor BETWEEN 0 AND 9007199254740991)
  )`,
  'INSERT INTO local_revision_state (id, revision_floor) VALUES (1, 0)',
];

// Rebuild the journal table because the original NOT NULL/CHECK >= 1 constraint
// cannot represent a session for which the athlete did not measure time.
const migrationFour = [
  'ALTER TABLE local_revision_state ADD COLUMN epoch INTEGER NOT NULL DEFAULT 0 CHECK (epoch BETWEEN 0 AND 9007199254740991)',
  `CREATE TABLE local_workouts_v4 (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL REFERENCES local_profiles(id),
    sport_id TEXT NOT NULL, date TEXT NOT NULL, title TEXT NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes BETWEEN 0 AND 1440),
    rpe INTEGER CHECK (rpe BETWEEN 0 AND 10), notes TEXT NOT NULL DEFAULT '',
    revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), deleted_at TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned','completed','skipped')),
    was_planned INTEGER NOT NULL DEFAULT 0 CHECK (was_planned IN (0,1)), time TEXT,
    planned_minutes INTEGER CHECK (planned_minutes BETWEEN 0 AND 1440),
    sections TEXT NOT NULL DEFAULT '{"warmup":[],"main":[],"cooldown":[]}',
    plan_notes TEXT NOT NULL DEFAULT '', period_id TEXT
  )`,
  `INSERT INTO local_workouts_v4 (id, profile_id, sport_id, date, title, duration_minutes, rpe,
    notes, revision, created_at, updated_at, sync_state, deleted_at)
    SELECT id, profile_id, sport_id, date, title, duration_minutes, rpe, notes, revision,
    created_at, updated_at, sync_state, deleted_at FROM local_workouts`,
  'DROP TABLE local_workouts',
  'ALTER TABLE local_workouts_v4 RENAME TO local_workouts',
  'CREATE INDEX local_workouts_profile_date ON local_workouts(profile_id, deleted_at, date DESC, created_at DESC)',
  ...['custom_exercises', 'exercise_notes', 'templates', 'periods', 'wellness', 'goals', 'drafts'].map(name =>
    `CREATE TABLE local_${name} (
      id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id),
      revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), payload TEXT NOT NULL
    )`),
];

const migrationFive = [
  `ALTER TABLE local_profiles ADD COLUMN visible_shortcuts TEXT NOT NULL DEFAULT '["history","library","templates","wellness","goals","periods","backup"]'`,
  'ALTER TABLE local_workouts ADD COLUMN training_type TEXT',
  'ALTER TABLE local_workouts ADD COLUMN load_calculation TEXT',
  "ALTER TABLE local_workouts ADD COLUMN supersets TEXT NOT NULL DEFAULT '[]'",
  `ALTER TABLE local_workouts ADD COLUMN post_workout TEXT NOT NULL DEFAULT '{"aerobicFatigue":null,"muscularFatigue":null,"satisfaction":null,"notes":""}'`,
];

// Frozen: an earlier events-only variant of version 6 may exist in preview storage.
// Version 7 repairs that variant without rewriting this migration or existing rows.
const migrationSix = [
  `ALTER TABLE local_workouts ADD COLUMN planned_fatigue TEXT NOT NULL DEFAULT '{"aerobicFatigue":null,"muscularFatigue":null}'`,
  'ALTER TABLE local_workouts ADD COLUMN planned_load_calculation TEXT',
  ...['events', 'readiness_references', 'exercise_roles', 'muscle_targets'].map(name => `CREATE TABLE local_${name} (
    id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id),
    revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), payload TEXT NOT NULL
  )`),
];

async function migrationSeven(tx: SqlExecutor): Promise<void> {
  const columns = new Set((await tx.query('PRAGMA table_info(local_workouts)')).map(column => column.name));
  if (!columns.has('planned_fatigue')) await tx.execute(`ALTER TABLE local_workouts ADD COLUMN planned_fatigue TEXT NOT NULL DEFAULT '{"aerobicFatigue":null,"muscularFatigue":null}'`);
  if (!columns.has('planned_load_calculation')) await tx.execute('ALTER TABLE local_workouts ADD COLUMN planned_load_calculation TEXT');
  for (const name of ['events', 'readiness_references', 'exercise_roles', 'muscle_targets']) {
    await tx.execute(`CREATE TABLE IF NOT EXISTS local_${name} (
      id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id),
      revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), payload TEXT NOT NULL
    )`);
  }
}

// Additive: answers of the onboarding quiz. Reference rows of readiness-v1 stay untouched.
const migrationEight = [
  `CREATE TABLE local_training_quiz (
    id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL REFERENCES local_profiles(id),
    revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    sync_state TEXT NOT NULL CHECK (sync_state = 'local-only'), payload TEXT NOT NULL
  )`,
];

/** All pending migrations form one atomic change; never open a newer schema as empty. */
export async function migrateDatabase(database: SqlDatabase): Promise<void> {
  await database.execute('PRAGMA foreign_keys = ON');
  await database.transaction(async (tx) => {
    const rows = await tx.query<{ user_version: number }>('PRAGMA user_version');
    const version = rows[0]?.user_version ?? 0;
    if (!Number.isInteger(version) || version < 0 || version > DATABASE_VERSION) {
      throw new AppError('databaseNewer', 'Ta baza danych pochodzi z nowszej lub nieobsługiwanej wersji aplikacji.');
    }
    for (let next = version + 1; next <= DATABASE_VERSION; next++) {
      if (next === 7) await migrationSeven(tx);
      else {
        const statements = next === 1 ? migrationOne : next === 2 ? migrationTwo : next === 3 ? migrationThree : next === 4 ? migrationFour : next === 5 ? migrationFive : next === 6 ? migrationSix : migrationEight;
        for (const statement of statements) await tx.execute(statement);
      }
      await tx.execute(`PRAGMA user_version = ${next}`);
    }
  });
}
