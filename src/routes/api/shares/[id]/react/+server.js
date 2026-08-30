import { json } from '@sveltejs/kit';
import { DbNotReadyError, findShareById, publicShare, toggleShareReaction } from '$lib/server/db.js';
import { requireUser } from '$lib/server/guard.js';

export async function POST({ locals, params }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	try {
		const existing = await findShareById(params.id);
		if (!existing) return json({ error: 'That share no longer exists.' }, { status: 404 });
		const updated = await toggleShareReaction(params.id, user.id);
		return json({ share: publicShare(updated, user.id) });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Toggle reaction error:', err);
		return json({ error: 'Could not react to that share right now.' }, { status: 500 });
	}
}
