import { z } from 'zod';
import { database, loadState } from '@/lib/storage';
import { AUTH_HEADERS, AuthError, assertSameOrigin, authFailure, hashPassword, passwordSchema, readJson, requireCoach, usernameSchema } from '@/lib/auth';
export const dynamic = 'force-dynamic';
const profileIdSchema = z.string().min(1).max(100).regex(/^[\w-]+$/);
const configureSchema = z.object({ profileId: profileIdSchema, username: usernameSchema, password: passwordSchema }).strict();
const disableSchema = z.object({ profileId: profileIdSchema }).strict();
export async function GET(request: Request) {
  try {
    const auth = await requireCoach(request);
    const profileId = new URL(request.url).searchParams.get('profileId');
    const rows = await database().prepare('SELECT profile_id AS profileId, username, disabled, updated_at AS updatedAt FROM athlete_accounts WHERE owner = ?').bind(auth.owner).all<{ profileId: string; username: string; disabled: number; updatedAt: number }>();
    const accounts = rows.results.map(a => ({ ...a, disabled: !!a.disabled }));
    return Response.json(profileId ? { account: accounts.find(a => a.profileId === profileId) || null } : { accounts }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireCoach(request);
    const parsed = configureSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success) throw new AuthError(400, parsed.error.issues[0]?.message || 'Sprawdź dane konta.');
    const { profileId, username, password } = parsed.data;
    const { state } = await loadState(auth.owner);
    if (!state.profiles.some(p => p.id === profileId)) throw new AuthError(404, 'Nie znaleziono profilu.');
    const duplicate = await database().prepare('SELECT id FROM athlete_accounts WHERE owner = ? AND username = ? AND profile_id <> ?').bind(auth.owner, username, profileId).first();
    if (duplicate) throw new AuthError(409, 'Ten login jest już używany.');
    const passwordHash = await hashPassword(password), now = Date.now();
    await database().batch([
      database().prepare(`INSERT INTO athlete_accounts (id, owner, profile_id, username, password_hash, password_version, disabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?) ON CONFLICT(owner, profile_id) DO UPDATE SET username = excluded.username, password_hash = excluded.password_hash, password_version = athlete_accounts.password_version + 1, disabled = 0, updated_at = excluded.updated_at`).bind(crypto.randomUUID(), auth.owner, profileId, username, passwordHash, now, now),
      database().prepare('DELETE FROM athlete_sessions WHERE owner = ? AND account_id IN (SELECT id FROM athlete_accounts WHERE owner = ? AND profile_id = ?)').bind(auth.owner, auth.owner, profileId),
    ]);
    return Response.json({ success: true, account: { profileId, username, disabled: false, updatedAt: now } }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error); }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await requireCoach(request);
    const parsed = disableSchema.safeParse(await readJson(request, 1024));
    if (!parsed.success) throw new AuthError(400, 'Nieprawidłowy profil.');
    await database().batch([
      database().prepare('UPDATE athlete_accounts SET disabled = 1, password_version = password_version + 1, updated_at = ? WHERE owner = ? AND profile_id = ?').bind(Date.now(), auth.owner, parsed.data.profileId),
      database().prepare('DELETE FROM athlete_sessions WHERE owner = ? AND account_id IN (SELECT id FROM athlete_accounts WHERE owner = ? AND profile_id = ?)').bind(auth.owner, auth.owner, parsed.data.profileId),
    ]);
    return Response.json({ success: true }, { headers: AUTH_HEADERS });
  } catch (error) { return authFailure(error); }
}
