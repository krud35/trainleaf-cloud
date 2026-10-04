import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { SqlDatabase, SqlExecutor, SqlRow, SqlValue } from '../data/database';
import { serialQueue } from './database';
import { AppError } from '../data/errors';
const STORE = 'snapshots';
const KEY = 'main';
const LOCK = 'fieldwork-local-database';

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('fieldwork-mobile-preview', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new AppError('closeOtherTabs', 'Zamknij pozostałe karty podglądu i spróbuj ponownie.'));
  });
}

function read(store: IDBDatabase): Promise<Uint8Array | undefined> {
  return new Promise((resolve, reject) => {
    const tx = store.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(KEY);
    tx.oncomplete = () => resolve(request.result as Uint8Array | undefined);
    tx.onabort = () => reject(tx.error ?? new AppError('localReadFailed', 'Nie udało się odczytać danych lokalnych.'));
  });
}

function persist(store: IDBDatabase, bytes: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = store.transaction(STORE, 'readwrite', { durability: 'strict' });
    tx.objectStore(STORE).put(bytes, KEY);
    // A request's success is too early: only transaction completion confirms persistence.
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new AppError('localWriteFailed', 'Nie udało się zapisać danych. Sprawdź wolne miejsce.'));
  });
}

function executor(db: Database): SqlExecutor {
  return {
    async execute(sql, params = []) {
      db.run(sql, params);
      return { changes: db.getRowsModified() };
    },
    async query<T extends SqlRow>(sql: string, params: SqlValue[] = []) {
      const statement = db.prepare(sql, params);
      const rows: T[] = [];
      try { while (statement.step()) rows.push(statement.getAsObject() as T); }
      finally { statement.free(); }
      return rows;
    },
  };
}

/** Browser preview uses the same SQL schema, persisted in IndexedDB after every write.
 * Web Locks and reloading under the lock prevent concurrent tabs from losing changes.
 * The Android build uses native SQLite, never this snapshot adapter.
 */
export async function openBrowserDatabase(): Promise<SqlDatabase> {
  if (!navigator.locks) throw new AppError('browserUnsupported', 'Otwórz podgląd w aktualnej przeglądarce Chrome lub Edge przez localhost lub HTTPS.');
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const store = await openStore();
  const serial = serialQueue();
  let closed = false;
  async function withDatabase<T>(write: boolean, operation: (db: Database) => Promise<T>): Promise<T> {
    return serial(() => navigator.locks.request(LOCK, async () => {
      if (closed) throw new AppError('databaseClosed', 'Baza danych jest zamknięta.');
      const db = new SQL.Database(await read(store));
      try {
        db.run('PRAGMA foreign_keys = ON');
        const result = await operation(db);
        if (write) await persist(store, db.export());
        return result;
      } finally { db.close(); }
    }));
  }
  return {
    execute: (sql, params) => withDatabase(true, db => executor(db).execute(sql, params)),
    query: (sql, params) => withDatabase(false, db => executor(db).query(sql, params)),
    transaction: operation => withDatabase(true, async db => {
      db.run('BEGIN IMMEDIATE');
      try {
        const result = await operation(executor(db));
        db.run('COMMIT');
        return result;
      } catch (error) { db.run('ROLLBACK'); throw error; }
    }),
    close: () => serial(async () => { store.close(); closed = true; }),
  };
}
