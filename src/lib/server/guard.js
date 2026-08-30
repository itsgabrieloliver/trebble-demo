import { json } from '@sveltejs/kit';
import { DbNotReadyError } from './db.js';

// Mirrors the old server's behaviour exactly: 503 when the database is
// configured but not connected yet, 401 when there is no valid session.
export function requireUser(locals) {
	if (locals.dbError) {
		return { error: json({ error: locals.dbError }, { status: 503 }) };
	}
	if (!locals.user) {
		return { error: json({ error: 'Not signed in.' }, { status: 401 }) };
	}
	return { user: locals.user };
}

export function dbErrorResponse(err, fallbackMessage) {
	if (err instanceof DbNotReadyError) {
		return json({ error: err.message }, { status: 503 });
	}
	console.error(fallbackMessage, err);
	return json({ error: fallbackMessage }, { status: 500 });
}

export async function readJson(request) {
	try {
		return await request.json();
	} catch {
		return null;
	}
}
