import { Capacitor } from '@capacitor/core';
import type { SqlDatabase } from '../data/database';
import { AppError } from '../data/errors';
export async function openDatabase(): Promise<SqlDatabase> {
  if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
    const { openNativeDatabase } = await import('./native-database');
    return openNativeDatabase();
  }
  if (Capacitor.isNativePlatform()) throw new AppError('platformUnsupported', 'Ta platforma nie jest jeszcze obsługiwana.');
  const { openBrowserDatabase } = await import('./browser-database');
  return openBrowserDatabase();
}

/** Reads and transactions cannot interleave on a single native connection. */
export function serialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>): Promise<T> => {
    const next = tail.then(operation);
    tail = next.catch(() => undefined);
    return next;
  };
}
