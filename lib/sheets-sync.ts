import { waitUntil } from 'cloudflare:workers';
import { database, loadState } from '@/lib/storage';
import { exportRows, type State } from '@/lib/domain';
import { buildWeeklySheets } from '@/lib/sheets-weeks';
import { StateError } from '@/lib/state-recovery';
import { exportBlocked } from '@/lib/state-store';

export type SheetConnection = { owner: string; profile_id: string; endpoint: string; secret: string; spreadsheet_id: string; auto_sync: number; last_revision: number | null; last_synced_at: string | null; last_error: string | null };
export class SheetSyncError extends Error { constructor(message: string, public code?: string) { super(message); } }
const SYNC_PAUSED = 'Synchronizacja wstrzymana: część danych tej osoby czeka w kwarantannie na naprawę przez trenera.';
const validEndpoint = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
export async function sheetConnection(owner: string, profileId: string) {
  return database().prepare('SELECT owner, profile_id, endpoint, secret, spreadsheet_id, auto_sync, last_revision, last_synced_at, last_error FROM sheet_connections WHERE owner = ? AND profile_id = ?').bind(owner, profileId).first<SheetConnection>();
}
export function publicConnection(connection: SheetConnection | null) {
  return { configured: !!connection, endpoint: connection?.endpoint || '', spreadsheetId: connection?.spreadsheet_id || '', autoSync: !!connection?.auto_sync, lastRevision: connection?.last_revision ?? null, lastSyncedAt: connection?.last_synced_at ?? null, lastError: connection?.last_error ?? null };
}
export function changedProfileIds(previous: State, next: State) {
  const data = (s: State, id: string) => ({ profile: s.profiles.find(p => p.id === id), workouts: s.workouts.filter(w => w.profileId === id), fatigue: s.fatigue.filter(f => f.profileId === id), wellness:s.wellness.filter(w=>w.profileId===id), periods: s.periods.filter(p => p.profileId === id), events: s.events.filter(e => e.profileId === id), exerciseNotes: s.exerciseNotes.filter(n => n.profileId === id) });
  return next.profiles.filter(p => JSON.stringify(data(previous, p.id)) !== JSON.stringify(data(next, p.id))).map(p => p.id);
}
function safeError(error: unknown, secret: string) {
  const message = error instanceof SheetSyncError || error instanceof StateError ? error.message : error instanceof Error && /timeout|aborted/i.test(error.message) ? 'Upłynął czas oczekiwania. Eksport mógł się udać; sprawdź arkusz przed ponowieniem.' : 'Nie udało się zsynchronizować arkusza. Spróbuj ponownie.';
  return message.split(secret).join('[ukryto]').slice(0, 400);
}
async function boundedText(response: Response, limit = 10_000) {
  if (!response.body) throw new SheetSyncError('Google nie zwrócił potwierdzenia.');
  const reader = response.body.getReader(), decoder = new TextDecoder(); let body = '', size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); throw new SheetSyncError('Google zwrócił nieprawidłową odpowiedź. Sprawdź dostęp do skryptu.'); } body += decoder.decode(value, { stream: true }); } return body + decoder.decode(); }
  finally { reader.releaseLock(); }
}
export async function syncProfile(owner: string, profileId: string, options: { automatic?: boolean } = {}) {
  const c = await sheetConnection(owner, profileId);
  if (!c || options.automatic && !c.auto_sync) return null;
  let revision: number | null = null;
  try {
    if (!validEndpoint.test(c.endpoint) || !/^[A-Za-z0-9_-]{20,150}$/.test(c.spreadsheet_id) || c.secret.length < 32) throw new SheetSyncError('Sprawdź konfigurację połączenia z arkuszem.');
    const snapshot = await loadState(owner); revision = snapshot.revision;
    if (!snapshot.state.profiles.some(p => p.id === profileId)) return null;
    // A degraded document must not overwrite the managed tabs without the quarantined records.
    if (await exportBlocked(owner, profileId, snapshot.quarantine)) {
      await database().prepare('UPDATE sheet_connections SET last_error = ? WHERE owner = ? AND profile_id = ?').bind(SYNC_PAUSED, owner, profileId).run();
      if (options.automatic) return null;
      throw new SheetSyncError(SYNC_PAUSED, 'sync_paused');
    }
    const rows = exportRows(snapshot.state, profileId), weeks = buildWeeklySheets(snapshot.state, profileId);
    if (rows.length > 50_000 || weeks.length > 520) throw new SheetSyncError('Eksport przekracza limit wielkości.');
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fieldwork-v1:' + owner));
    const installation = Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join('').slice(0, 24), requestId = crypto.randomUUID();
    const body = JSON.stringify({ secret: c.secret, spreadsheetId: c.spreadsheet_id, rows, weeks, revision, installation, requestId, profileId });
    if (new TextEncoder().encode(body).length > 8_000_000) throw new SheetSyncError('Eksport przekracza limit wielkości.');
    // One shared deadline includes POST, expected ContentService redirect and response body.
    const signal = AbortSignal.timeout(25_000);
    let response = await fetch(c.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, redirect: 'manual', signal });
    if ([301, 302, 303].includes(response.status)) {
      const location = response.headers.get('location'); if (!location) throw new SheetSyncError('Brak odpowiedzi Google.');
      const redirect = new URL(location);
      if (redirect.protocol !== 'https:' || redirect.hostname !== 'script.googleusercontent.com' || redirect.username || redirect.password || redirect.port) throw new SheetSyncError('Google wymaga innej konfiguracji dostępu. Sprawdź wdrożenie skryptu.');
      // Never forward the credential-bearing POST body to a redirect destination.
      response = await fetch(redirect.toString(), { method: 'GET', redirect: 'error', signal });
    }
    if (!response.ok) throw new SheetSyncError('Google nie potwierdził eksportu. Sprawdź arkusz przed ponowieniem.');
    let result: Record<string, unknown>; try { result = JSON.parse(await boundedText(response)); } catch (error) { if (error instanceof SheetSyncError) throw error; throw new SheetSyncError('Google zwrócił stronę logowania lub nieprawidłową odpowiedź. Sprawdź dostęp do skryptu.'); }
    if (result.success !== true) throw new SheetSyncError(typeof result.error === 'string' ? result.error : 'Google nie potwierdził zapisu.');
    if (result.requestId !== requestId || result.profileId !== profileId || result.revision !== revision) throw new SheetSyncError('Nieprawidłowe potwierdzenie zapisu. Sprawdź arkusz.');
    const syncedAt = new Date().toISOString();
    await database().prepare(`UPDATE sheet_connections SET last_revision = ?, last_synced_at = ?, last_error = NULL WHERE owner = ? AND profile_id = ? AND endpoint = ? AND spreadsheet_id = ? AND secret = ? AND (last_revision IS NULL OR last_revision <= ?)`).bind(revision, syncedAt, owner, profileId, c.endpoint, c.spreadsheet_id, c.secret, revision).run();
    return { success: true, rows: rows.length - 1, weeks: weeks.length, revision, lastSyncedAt: syncedAt, url: `https://docs.google.com/spreadsheets/d/${c.spreadsheet_id}/edit` };
  } catch (error) {
    const message = safeError(error, c.secret);
    try { await database().prepare(`UPDATE sheet_connections SET last_error = ? WHERE owner = ? AND profile_id = ? AND endpoint = ? AND spreadsheet_id = ? AND secret = ? AND (last_revision IS NULL OR ? IS NULL OR last_revision < ?)`).bind(message, owner, profileId, c.endpoint, c.spreadsheet_id, c.secret, revision, revision).run(); } catch { /* The application save is already committed and must not be reported as failed. */ }
    throw new SheetSyncError(message, error instanceof SheetSyncError ? error.code : error instanceof StateError ? error.code : undefined);
  }
}
export async function syncConfiguredSheets(owner: string, profileIds: string[]) {
  // Include previously failed connections: a later save retries without a timer.
  const failed = await database().prepare('SELECT profile_id FROM sheet_connections WHERE owner = ? AND auto_sync = 1 AND last_error IS NOT NULL').bind(owner).all<{ profile_id: string }>();
  const ids = [...new Set([...profileIds, ...failed.results.map(row => row.profile_id)])];
  await Promise.allSettled(ids.map(profileId => syncProfile(owner, profileId, { automatic: true })));
}
export async function queueSheetsSync(owner: string, profileIds: string[]) {
  // Called only after a successful D1 write. Remote failure never rolls it back.
  const job = syncConfiguredSheets(owner, profileIds).catch(() => { console.error('Fieldwork background export unavailable.'); });
  try { waitUntil(job); } catch { await job; }
}
