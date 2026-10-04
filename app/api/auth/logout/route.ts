import { database } from '@/lib/storage';
import { AUTH_HEADERS, assertSameOrigin, authFailure, coachOwner, digest, getAuth, sessionCookie, sessionToken } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await getAuth(request), token = sessionToken(request);
    if (token) await database().prepare('DELETE FROM athlete_sessions WHERE token_hash = ? AND owner = ?').bind(await digest(token), coachOwner()).run();
    return Response.json({ success: true, ...(auth?.role === 'coach' ? { signOutUrl: '/signout-with-chatgpt?return_to=/' } : {}) }, { headers: { ...AUTH_HEADERS, 'Set-Cookie': sessionCookie('', 0) } });
  } catch (error) { return authFailure(error); }
}
