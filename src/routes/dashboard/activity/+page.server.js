import { fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { DbNotReadyError, insertRec, listRecs } from '$lib/server/db.js';
import { MOCK_FRIENDS } from '$lib/server/mock.js';

function buildFeed(posted, userId) {
	const postedItems = posted.map((r) => ({
		kind: 'recommend',
		name: r.displayName,
		avatar: r.avatar,
		title: r.title,
		artist: r.artist,
		note: r.note,
		art: r.art,
		createdAt: r.createdAt,
		self: r.userId === userId
	}));
	const mockItems = MOCK_FRIENDS.map((f) => ({
		...f,
		createdAt: new Date(Date.now() - f.minutesAgo * 60000).toISOString()
	}));
	return [...postedItems, ...mockItems].sort(
		(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
	);
}

export async function load({ locals }) {
	let posted = [];
	try {
		posted = await listRecs();
	} catch (err) {
		console.error('Feed read error:', err);
	}
	// Layout and page loads run in parallel, so the redirect for signed-out
	// visitors may not have happened yet when this runs.
	return { feed: buildFeed(posted, locals.user?.id ?? null) };
}

export const actions = {
	recommend: async ({ request, locals }) => {
		const form = await request.formData();
		const title = String(form.get('title') || '').trim();
		const artist = String(form.get('artist') || '').trim();
		const note = String(form.get('note') || '')
			.trim()
			.slice(0, 280);

		if (!title || !artist) {
			return fail(400, { error: 'Title and artist are required.', title, artist, note });
		}

		const user = locals.user;
		if (!user) return fail(401, { error: 'Sign in again to post a recommendation.' });

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
			if (err instanceof DbNotReadyError) return fail(503, { error: err.message });
			console.error('Post rec error:', err);
			return fail(500, { error: 'Could not post your recommendation right now.' });
		}
		return { posted: true, title };
	}
};
