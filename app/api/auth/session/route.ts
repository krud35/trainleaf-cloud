import { AUTH_HEADERS, authFailure, getAuth, publicSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { return Response.json(await publicSession(await getAuth(request)), { headers: AUTH_HEADERS }); }
  catch (error) { return authFailure(error); }
}
