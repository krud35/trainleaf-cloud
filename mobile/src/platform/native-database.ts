import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { SqlDatabase, SqlExecutor, SqlRow } from '../data/database';
import { serialQueue } from './database';
import { AppError } from '../data/errors';
// Capacitor SQLite supports Android and iOS. Only Android is configured in this stage.
let opening: Promise<SqlDatabase> | undefined;
export function openNativeDatabase(): Promise<SqlDatabase> {
  opening ??= connect().catch(error => { opening = undefined; throw error; });
  return opening;
}

async function connect(): Promise<SqlDatabase> {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  // A reloaded WebView may leave native handles behind. Reconcile once at startup.
  await sqlite.checkConnectionsConsistency();
  // Schema upgrades belong to the repository. Do not register plugin upgrades too.
  const connection = await sqlite.createConnection('fieldwork_local', false, 'no-encryption', 1, false);
  try {
    await connection.open();
    await connection.execute('PRAGMA foreign_keys = ON', false);
    await connection.execute('PRAGMA synchronous = FULL', false);
  } catch (error) {
    await sqlite.closeConnection('fieldwork_local', false).catch(() => undefined);
    throw error;
  }
  const serial = serialQueue();
  let closed = false;
  const checkOpen = () => { if (closed) throw new AppError('databaseClosed', 'Baza danych jest zamknięta.'); };
  const executor: SqlExecutor = {
    async execute(sql, params = []) {
      const result = params.length
        ? await connection.run(sql, params, false)
        : await connection.execute(sql, false);
      return { changes: result.changes?.changes ?? 0 };
    },
    async query<T extends SqlRow>(sql: string, params = []) {
      return (await connection.query(sql, params)).values as T[] ?? [];
    },
  };
  return {
    execute: (sql, params) => serial(async () => { checkOpen(); return executor.execute(sql, params); }),
    query: (sql, params) => serial(async () => { checkOpen(); return executor.query(sql, params); }),
    transaction: (operation) => serial(async () => {
      checkOpen();
      await connection.beginTransaction();
      try {
        const result = await operation(executor);
        await connection.commitTransaction();
        return result;
      } catch (error) {
        if ((await connection.isTransactionActive()).result) await connection.rollbackTransaction();
        throw error;
      }
    }),
    close: () => serial(async () => {
      if (!closed) { await sqlite.closeConnection('fieldwork_local', false); closed = true; opening = undefined; }
    }),
  };
}
