import { json } from '@sveltejs/kit';
import { publicUser } from '$lib/server/auth.js';
import { storageLabel } from '$lib/server/db.js';
import { requireUser } from '$lib/server/guard.js';

export async function GET({ locals }) {
	const { user, error } = requireUser(locals);
	if (error) return error;
	return json({ user: publicUser(user), storage: storageLabel() });
}
