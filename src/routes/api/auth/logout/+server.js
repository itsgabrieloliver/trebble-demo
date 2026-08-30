import { json } from '@sveltejs/kit';
import { SESSION_COOKIE, clearSessionCookie, destroySession } from '$lib/server/auth.js';

export async function POST({ cookies }) {
	destroySession(cookies.get(SESSION_COOKIE));
	clearSessionCookie(cookies);
	return json({ ok: true });
}
