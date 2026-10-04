import { z } from 'zod';
import { loadState, readStateRow } from '@/lib/storage';
import { StateError, type Issue, type QuarantineEntry } from '@/lib/state-recovery';
import { AUTH_HEADERS, AuthError, assertSameOrigin, authFailure, readJson, requireCoach } from '@/lib/auth';
import { listBackups, quarantineOverview, readBackup, resolveQuarantine } from '@/lib/state-store';
export const dynamic = 'force-dynamic';
// Coach-only diagnostics for a damaged document: rule paths/codes, quarantined raw records,
// raw backups and (on request) the raw stored payload. The repair write itself is PUT /api/state
// with `repair: 'replace-corrupt-state'`, which keeps same-origin, coach, schema and CAS checks.
const resolveSchema = z.object({ action: z.literal('resolve'), keys: z.array(z.object({ collection: z.string().regex(/^[A-Za-z]{1,40}$/), key: z.string().regex(/^[a-f0-9]{64}:\d{1,6}$/) }).strict()).min(1).max(1000) }).strict();
export async function GET(request: Request) {
  try {
    const auth = await requireCoach(request), params = new URL(request.url).searchParams;
    const backup = params.get('backup');
    if (backup !== null) {
      const revision = Number(backup);
      if (!Number.isSafeInteger(revision) || revision < 0) throw new AuthError(400, 'Nieprawidłowa rewizja kopii.');
      const row = await readBackup(auth.owner, revision);
      if (!row) throw new AuthError(404, 'Nie znaleziono kopii.');
      return Response.json(row, { headers: AUTH_HEADERS });
    }
    let health: 'ok' | 'degraded' | 'corrupt', revision: number, issues: Issue[] = [], live: QuarantineEntry[] = [];
    try { const snapshot = await loadState(auth.owner); health = snapshot.health; revision = snapshot.revision; live = snapshot.quarantine; }
    catch (error) { if (!(error instanceof StateError)) throw error; health = 'corrupt'; revision = error.revision; issues = error.issues; }
    const payload = params.get('payload') === '1' ? (await readStateRow(auth.owner)).payload : undefined;
    return Response.json({ health, revision, issues, quarantine: await quarantineOverview(auth.owner, live, true), backups: await listBackups(auth.owner), ...(payload === undefined ? {} : { payload }) }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error, { coach: true }); }
}
/** Marks quarantined records as handled (kept for audit); unresolved ones keep Sheets export paused. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireCoach(request);
    const parsed = resolveSchema.safeParse(await readJson(request, 200_000));
    if (!parsed.success) throw new AuthError(400, 'Nieprawidłowa lista rekordów.');
    return Response.json({ resolved: await resolveQuarantine(auth.owner, parsed.data.keys) }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error, { coach: true }); }
}
