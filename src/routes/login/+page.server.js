import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { createSession, hashPassword, setSessionCookie, verifyPassword } from '$lib/server/auth.js';
import { DbNotReadyError, createUser, findUserByEmail } from '$lib/server/db.js';

export async function load({ locals, url }) {
	if (locals.user) redirect(302, '/dashboard');
	return { mode: url.searchParams.get('mode') === 'login' ? 'login' : 'signup' };
}

export const actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') || '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') || '');

		try {
			const user = await findUserByEmail(email);
			if (!user || !verifyPassword(password, user.passwordHash)) {
				return fail(401, { mode: 'login', email, error: 'Incorrect email or password.' });
			}
			setSessionCookie(cookies, createSession(user.id));
		} catch (err) {
			if (err instanceof DbNotReadyError) {
				return fail(503, { mode: 'login', email, error: err.message });
			}
			console.error('Login error:', err);
			return fail(500, { mode: 'login', email, error: 'Could not log in right now.' });
		}
		redirect(303, '/dashboard');
	},

	signup: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') || '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') || '');
		const displayName = String(form.get('displayName') || '').trim() || email.split('@')[0];

		if (!email || !email.includes('@')) {
			return fail(400, { mode: 'signup', email, error: 'Enter a valid email address.' });
		}
		if (password.length < 8) {
			return fail(400, { mode: 'signup', email, error: 'Password must be at least 8 characters.' });
		}

		try {
			const existing = await findUserByEmail(email);
			if (existing) {
				return fail(409, {
					mode: 'signup',
					email,
					error: 'An account with that email already exists.'
				});
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
		} catch (err) {
			if (err instanceof DbNotReadyError) {
				return fail(503, { mode: 'signup', email, error: err.message });
			}
			console.error('Signup error:', err);
			return fail(500, { mode: 'signup', email, error: 'Could not create account right now.' });
		}
		redirect(303, '/dashboard');
	}
};
