import { getSession, SESSION_COOKIE } from '$lib/server/auth.js';
import { DbNotReadyError, findUserById, initStorage } from '$lib/server/db.js';

initStorage();

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const sid = event.cookies.get(SESSION_COOKIE);
	const session = getSession(sid);
	event.locals.user = null;
	event.locals.dbError = null;

	if (session) {
		try {
			event.locals.user = await findUserById(session.userId);
		} catch (err) {
			// Never let a storage problem take down page rendering. A configured
			// but unreachable database, or a driver error mid-query, degrades to a
			// signed-out view with an explanation rather than a 500.
			if (err instanceof DbNotReadyError) {
				event.locals.dbError = err.message;
			} else {
				console.error('Session user lookup failed:', err);
				event.locals.dbError = 'The database is temporarily unavailable. Try again shortly.';
			}
		}
	}

	return resolve(event);
}
