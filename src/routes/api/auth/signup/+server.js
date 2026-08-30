import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { createSession, hashPassword, publicUser, setSessionCookie } from '$lib/server/auth.js';
import { DbNotReadyError, createUser, findUserByEmail, storageLabel } from '$lib/server/db.js';
import { readJson } from '$lib/server/guard.js';

export async function POST({ request, cookies }) {
	const body = await readJson(request);
	if (!body) return json({ error: 'Invalid request body.' }, { status: 400 });

	const email = String(body.email || '')
		.trim()
		.toLowerCase();
	const password = String(body.password || '');
	const displayName = String(body.displayName || '').trim() || email.split('@')[0];

	if (!email || !email.includes('@')) {
		return json({ error: 'Enter a valid email address.' }, { status: 400 });
	}
	if (password.length < 8) {
		return json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
	}

	try {
		const existing = await findUserByEmail(email);
		if (existing) {
			return json({ error: 'An account with that email already exists.' }, { status: 409 });
		}
		const user = {
			id: randomUUID(),
			email,
			displayName,
			passwordHash: hashPassword(password),
			createdAt: new Date().toISOString()
		};
		await createUser(user);
		setSessionCookie(cookies, createSession(user.id));
		return json({ user: publicUser(user), storage: storageLabel() }, { status: 201 });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Signup error:', err);
		return json({ error: 'Could not create account right now.' }, { status: 500 });
	}
}
