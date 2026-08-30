import { listShares, publicShare } from '$lib/server/db.js';

export async function load({ locals }) {
	// The dashboard layout load redirects signed-out visitors, but SvelteKit
	// runs layout and page loads in parallel, so this must not assume a user.
	const userId = locals.user?.id ?? null;
	if (!userId) return { shares: [], error: null };

	try {
		const shares = await listShares();
		return { shares: shares.map((s) => publicShare(s, userId)), error: null };
	} catch (err) {
		console.error('List shares error:', err);
		return { shares: [], error: err.message || 'Could not load the feed right now.' };
	}
}
