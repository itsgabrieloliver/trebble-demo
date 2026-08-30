import { json } from '@sveltejs/kit';
import { DbNotReadyError, deleteShareById } from '$lib/server/db.js';
import { requireUser } from '$lib/server/guard.js';

export async function DELETE({ locals, params }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	try {
		const result = await deleteShareById(params.id, user.id);
		if (!result.ok && result.reason === 'not_found') {
			return json({ error: 'That share no longer exists.' }, { status: 404 });
		}
		if (!result.ok && result.reason === 'forbidden') {
			return json({ error: 'You can only delete your own shares.' }, { status: 403 });
		}
		return json({ ok: true });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Delete share error:', err);
		return json({ error: 'Could not delete that share right now.' }, { status: 500 });
	}
}
