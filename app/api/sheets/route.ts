import { z } from 'zod';
import { database, loadState } from '@/lib/storage';
import { AUTH_HEADERS, AuthError, assertSameOrigin, authFailure, readJson, requireCoach } from '@/lib/auth';
import { publicConnection, queueSheetsSync, sheetConnection, SheetSyncError, syncProfile } from '@/lib/sheets-sync';
export const dynamic = 'force-dynamic';
const id = z.string().min(1).max(100).regex(/^[\w-]+$/);
const configSchema = z.object({ action: z.literal('configure'), profileId: id, endpoint: z.string().regex(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/), spreadsheetId: z.string().regex(/^[A-Za-z0-9_-]{20,150}$/), secret: z.string().max(500).default(''), autoSync: z.boolean().optional() }).strict();
const syncSchema = z.object({ action: z.literal('sync'), profileId: id }).strict();
function failure(error: unknown) { return error instanceof SheetSyncError ? Response.json({ error: error.message, code: error.code || 'sync_failed' }, { status: error.code === 'sync_paused' || error.code === 'state_corrupt' ? 409 : 502, headers: AUTH_HEADERS }) : authFailure(error, { coach: true }); }
export async function GET(request: Request) {
  try {
    const auth = await requireCoach(request), profileId = new URL(request.url).searchParams.get('profileId') || '';
    const { state } = await loadState(auth.owner);
    if (!state.profiles.some(p => p.id === profileId)) throw new AuthError(404, 'Nie znaleziono profilu.');
    return Response.json(publicConnection(await sheetConnection(auth.owner, profileId)), { headers: AUTH_HEADERS });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireCoach(request);
    const parsed = z.union([configSchema, syncSchema]).safeParse(await readJson(request, 5000));
    if (!parsed.success) throw new AuthError(400, 'Sprawdź dane połączenia i identyfikator profilu.');
    const input = parsed.data, { state } = await loadState(auth.owner);
    if (!state.profiles.some(p => p.id === input.profileId)) throw new AuthError(404, 'Nie znaleziono profilu.');
    if (input.action === 'configure') {
      const existing = await sheetConnection(auth.owner, input.profileId), secret = input.secret || existing?.secret;
      if (!secret || secret.length < 32) throw new AuthError(400, 'Klucz musi mieć co najmniej 32 znaki.');
      const autoSync = input.autoSync ?? !!existing?.auto_sync;
      // The conditional insert also prevents two concurrent profile configurations
      // from assigning the same file; each athlete has a distinct spreadsheet.
      const result = await database().prepare(`INSERT INTO sheet_connections (owner, profile_id, endpoint, secret, spreadsheet_id, auto_sync) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM sheet_connections WHERE owner = ? AND spreadsheet_id = ? AND profile_id <> ?) ON CONFLICT(owner, profile_id) DO UPDATE SET last_revision = CASE WHEN sheet_connections.endpoint <> excluded.endpoint OR sheet_connections.spreadsheet_id <> excluded.spreadsheet_id OR sheet_connections.secret <> excluded.secret THEN NULL ELSE sheet_connections.last_revision END, last_synced_at = CASE WHEN sheet_connections.endpoint <> excluded.endpoint OR sheet_connections.spreadsheet_id <> excluded.spreadsheet_id OR sheet_connections.secret <> excluded.secret THEN NULL ELSE sheet_connections.last_synced_at END, last_error = NULL, endpoint = excluded.endpoint, secret = excluded.secret, spreadsheet_id = excluded.spreadsheet_id, auto_sync = excluded.auto_sync`).bind(auth.owner, input.profileId, input.endpoint, secret, input.spreadsheetId, autoSync ? 1 : 0, auth.owner, input.spreadsheetId, input.profileId).run();
      if (!result.meta.changes) throw new AuthError(409, 'Ten plik arkusza jest już przypisany do innej osoby. Użyj osobnego pliku.');
      if (autoSync) await queueSheetsSync(auth.owner, [input.profileId]);
      return Response.json({ success: true, ...publicConnection(await sheetConnection(auth.owner, input.profileId)) }, { headers: AUTH_HEADERS });
    }
    const result = await syncProfile(auth.owner, input.profileId);
    if (!result) throw new AuthError(400, 'Najpierw skonfiguruj połączenie z arkuszem.');
    return Response.json(result, { headers: AUTH_HEADERS });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireCoach(request);
    const parsed = z.object({ profileId: id }).strict().safeParse(await readJson(request, 1024));
    if (!parsed.success) throw new AuthError(400, 'Nieprawidłowy profil.');
    await database().prepare('DELETE FROM sheet_connections WHERE owner = ? AND profile_id = ?').bind(auth.owner, parsed.data.profileId).run();
    return Response.json({ success: true }, { headers: AUTH_HEADERS });
  } catch (error) { return failure(error); }
}
