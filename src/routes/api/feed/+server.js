import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { DbNotReadyError, insertRec, listRecs } from '$lib/server/db.js';
import { readJson, requireUser } from '$lib/server/guard.js';
import { MOCK_FRIENDS } from '$lib/server/mock.js';

export async function GET({ locals }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	let posted = [];
	try {
		posted = await listRecs();
	} catch (err) {
		console.error('Feed read error:', err);
	}

	const postedItems = posted.map((r) => ({
		kind: 'recommend',
		name: r.displayName,
		avatar: r.avatar,
		title: r.title,
		artist: r.artist,
		note: r.note,
		art: r.art,
		createdAt: r.createdAt,
		self: r.userId === user.id
	}));
	const mockItems = MOCK_FRIENDS.map((f) => ({
		...f,
		createdAt: new Date(Date.now() - f.minutesAgo * 60000).toISOString()
	}));
	const feed = [...postedItems, ...mockItems].sort(
		(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
	);
	return json({ feed });
}

export async function POST({ locals, request }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	const body = await readJson(request);
	if (!body) return json({ error: 'Invalid request body.' }, { status: 400 });

	const title = String(body.title || '').trim();
	const artist = String(body.artist || '').trim();
	const note = String(body.note || '')
		.trim()
		.slice(0, 280);
	if (!title || !artist) return json({ error: 'Title and artist are required.' }, { status: 400 });

	const rec = {
		id: randomUUID(),
		userId: user.id,
		displayName: user.displayName,
		avatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(user.email)}`,
		title,
		artist,
		note,
		art: `https://picsum.photos/seed/${encodeURIComponent(title + artist)}/300/300`,
		createdAt: new Date().toISOString()
	};

	try {
		await insertRec(rec);
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Post rec error:', err);
		return json({ error: 'Could not post your recommendation right now.' }, { status: 500 });
	}

	return json(
		{
			item: {
				kind: 'recommend',
				name: rec.displayName,
				avatar: rec.avatar,
				title: rec.title,
				artist: rec.artist,
				note: rec.note,
				art: rec.art,
				createdAt: rec.createdAt,
				self: true
			}
		},
		{ status: 201 }
	);
}
