import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { DbNotReadyError, insertShare, listShares, publicShare } from '$lib/server/db.js';
import { readJson, requireUser } from '$lib/server/guard.js';

export async function GET({ locals }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	try {
		const shares = await listShares();
		return json({ shares: shares.map((s) => publicShare(s, user.id)) });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('List shares error:', err);
		return json({ error: 'Could not load the feed right now.' }, { status: 500 });
	}
}

export async function POST({ locals, request }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	const body = await readJson(request);
	if (!body) return json({ error: 'Invalid request body.' }, { status: 400 });

	const uri = String(body.uri || '').trim();
	const title = String(body.title || '').trim();
	const artist = String(body.artist || '').trim();
	const art = body.art ? String(body.art).trim() : null;
	const caption = String(body.caption || '')
		.trim()
		.slice(0, 280);

	if (!uri || !title || !artist) {
		return json({ error: 'A track uri, title and artist are required to share.' }, { status: 400 });
	}

	const share = {
		id: randomUUID(),
		userId: user.id,
		displayName: user.displayName,
		avatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(user.email)}`,
		track: { uri, title, artist, art },
		caption,
		createdAt: new Date().toISOString(),
		comments: [],
		reactedUserIds: []
	};

	try {
		await insertShare(share);
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Create share error:', err);
		return json({ error: 'Could not post that share right now.' }, { status: 500 });
	}

	return json({ share: publicShare(share, user.id) }, { status: 201 });
}
