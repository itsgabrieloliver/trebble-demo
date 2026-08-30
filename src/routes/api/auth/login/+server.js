import { json } from '@sveltejs/kit';
import { createSession, publicUser, setSessionCookie, verifyPassword } from '$lib/server/auth.js';
import { DbNotReadyError, findUserByEmail, storageLabel } from '$lib/server/db.js';
import { readJson } from '$lib/server/guard.js';

export async function POST({ request, cookies }) {
	const body = await readJson(request);
	if (!body) return json({ error: 'Invalid request body.' }, { status: 400 });

	const email = String(body.email || '')
		.trim()
		.toLowerCase();
	const password = String(body.password || '');

	try {
		const user = await findUserByEmail(email);
		if (!user || !verifyPassword(password, user.passwordHash)) {
			return json({ error: 'Incorrect email or password.' }, { status: 401 });
		}
		setSessionCookie(cookies, createSession(user.id));
		return json({ user: publicUser(user), storage: storageLabel() });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Login error:', err);
		return json({ error: 'Could not log in right now.' }, { status: 500 });
	}
}
