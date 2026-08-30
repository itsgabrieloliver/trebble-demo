import { json } from '@sveltejs/kit';
import { DbNotReadyError, addCommentToShare, findShareById, publicShare } from '$lib/server/db.js';
import { readJson, requireUser } from '$lib/server/guard.js';

export async function POST({ locals, params, request }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	const body = await readJson(request);
	if (!body) return json({ error: 'Invalid request body.' }, { status: 400 });

	const text = String(body.text || '')
		.trim()
		.slice(0, 500);
	if (!text) return json({ error: 'Comment cannot be empty.' }, { status: 400 });

	try {
		const existing = await findShareById(params.id);
		if (!existing) return json({ error: 'That share no longer exists.' }, { status: 404 });
		const comment = {
			userId: user.id,
			displayName: user.displayName,
			text,
			createdAt: new Date().toISOString()
		};
		const updated = await addCommentToShare(params.id, comment);
		return json({ share: publicShare(updated, user.id) }, { status: 201 });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Add comment error:', err);
		return json({ error: 'Could not post that comment right now.' }, { status: 500 });
	}
}
