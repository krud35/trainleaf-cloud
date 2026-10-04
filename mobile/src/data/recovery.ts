import type { SqlDatabase, SqlRow } from './database';
import { AppError } from './errors';

const TABLES = ['local_profiles', 'local_workouts', 'local_custom_exercises', 'local_exercise_notes',
  'local_templates', 'local_periods', 'local_wellness', 'local_goals', 'local_drafts', 'local_events', 'local_readiness_references', 'local_exercise_roles', 'local_muscle_targets', 'local_training_quiz', 'local_revision_state'] as const;
const MAX_BYTES = 25 * 1024 * 1024;
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
const quoteIdentifier = (name: string) => `"${name.replaceAll('"', '""')}"`;
type RecoveryTable = { status: 'ok' | 'missing' | 'error'; rows: SqlRow[]; error?: string };

/** Raw rescue export, intentionally incompatible with normal backup restore.
 * Never migrate, repair, parse domain payloads, or change a damaged database here.
 */
export async function exportRecoveryData(database: SqlDatabase): Promise<string> {
  return database.transaction(async tx => {
    const errors: { source: string; message: string }[] = [];
    let databaseVersion: SqlRow[] | null = null;
    let schema: SqlRow[] | null = null;
    try { databaseVersion = await tx.query('PRAGMA user_version'); }
    catch (error) { errors.push({ source: 'user_version', message: errorText(error) }); }
    try { schema = await tx.query("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT GLOB 'sqlite_*' ORDER BY type, name"); }
    catch (error) { errors.push({ source: 'schema', message: errorText(error) }); }
    const tables: Record<string, RecoveryTable> = Object.create(null);
    // Future-version table names are data, never SQL fragments or object prototypes.
    const discovered = (schema ?? []).filter(row => row.type === 'table' && typeof row.name === 'string').map(row => String(row.name));
    const tableNames = new Set<string>([...TABLES, ...discovered]);
    let rowBytes = 0;
    for (const table of tableNames) {
      if (schema && !schema.some(row => row.type === 'table' && row.name === table)) {
        tables[table] = { status: 'missing', rows: [] };
        continue;
      }
      const result: RecoveryTable = { status: 'ok', rows: [] };
      tables[table] = result;
      let offset = 0;
      while (true) {
        let batch: SqlRow[];
        try { batch = await tx.query(`SELECT * FROM ${quoteIdentifier(table)} LIMIT 500 OFFSET ?`, [offset]); }
        catch (error) {
          result.status = 'error'; result.error = errorText(error);
          errors.push({ source: table, message: result.error });
          break;
        }
        for (const row of batch) {
          rowBytes += new TextEncoder().encode(JSON.stringify(row)).byteLength;
          if (rowBytes > MAX_BYTES) throw new AppError('recoveryTooLarge', 'Plik ratunkowy przekracza limit 25 MB. Nie utworzono uciętego eksportu.');
          result.rows.push(row);
        }
        if (batch.length < 500) break;
        offset += batch.length;
      }
    }
    const result = JSON.stringify({ format: 'training-companion-recovery', version: 1, exportedAt: new Date().toISOString(),
      purpose: 'Surowe dane ratunkowe do ręcznego odzyskiwania. Nie jest to kopia do automatycznego przywracania.',
      complete: errors.length === 0, databaseVersion, schema, tables, errors }, null, 2);
    if (new TextEncoder().encode(result).byteLength > MAX_BYTES)
      throw new AppError('recoveryTooLarge', 'Plik ratunkowy przekracza limit 25 MB. Nie utworzono uciętego eksportu.');
    return result;
  });
}
