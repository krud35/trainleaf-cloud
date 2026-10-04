import { z } from 'zod';
import { loadState, type Snapshot } from '@/lib/storage';
import { StateError } from '@/lib/state-recovery';
import { stateSchema } from '@/lib/domain';
import { AUTH_HEADERS, AuthError, assertProfileAvailable, assertSameOrigin, athleteState, authFailure, getAuth, readJson, requireCoach } from '@/lib/auth';
import { changedProfileIds, queueSheetsSync } from '@/lib/sheets-sync';
import { quarantineOverview, writeState, type WriteBase } from '@/lib/state-store';
export const dynamic = 'force-dynamic';
// `repair` must be sent explicitly to replace a document that cannot be read at all.
const REPAIR_CONFIRMATION = 'replace-corrupt-state';
const writeSchema = z.object({ revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1), state: stateSchema, repair: z.literal(REPAIR_CONFIRMATION).optional() }).strict();
const CONFLICT = 'Dane zmieniły się w innej karcie. Odśwież dane, zachowując formularz, przed ponownym zapisem.';
export async function GET(request: Request) {
  let coach = false;
  try {
    const auth = await getAuth(request);
    if (!auth) throw new AuthError(401, 'Zaloguj się, aby otworzyć swój planer.');
    coach = auth.role === 'coach';
    const snapshot = await loadState(auth.owner);
    if (auth.role === 'athlete') {
      await assertProfileAvailable(snapshot, auth.owner, auth.profileId);
      // Athletes never see quarantine metadata or other profiles' records.
      return Response.json({ state: athleteState(snapshot.state, auth.profileId), revision: snapshot.revision }, { headers: AUTH_HEADERS });
    }
    return Response.json({ state: snapshot.state, revision: snapshot.revision, health: snapshot.health, quarantine: await quarantineOverview(auth.owner, snapshot.quarantine) }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error, { coach }); }
}
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireCoach(request);
    const parsed = writeSchema.safeParse(await readJson(request, 1_500_000));
    if (!parsed.success) throw new AuthError(400, parsed.error.issues[0]?.message || 'Sprawdź formularz.');
    const { state, revision, repair } = parsed.data;
    let previous: Snapshot | null = null, base: WriteBase;
    try { previous = await loadState(auth.owner); base = previous; }
    catch (error) {
      // An unreadable document can only be replaced with explicit confirmation; CAS and a raw backup still apply.
      if (!(error instanceof StateError) || !repair) throw error;
      base = { revision: error.revision, health: 'corrupt' };
    }
    if (base.revision !== revision) throw new AuthError(409, CONFLICT, 'revision_conflict');
    const written = await writeState(auth.owner, base, state, previous
      ? { reason: 'coach_write' }
      : { reason: 'coach_repair', pauseSheets: 'Automatyczny eksport wyłączono po naprawie danych planu. Sprawdź plan i włącz go ponownie.' });
    if (!written) throw new AuthError(409, CONFLICT, 'revision_conflict');
    if (previous) await queueSheetsSync(auth.owner, changedProfileIds(previous.state, state));
    return Response.json({ revision: revision + 1 }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error, { coach: true }); }
}
