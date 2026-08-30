import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.user) redirect(302, '/login?mode=login');

	const spotify = locals.user.spotify || null;
	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			displayName: locals.user.displayName,
			createdAt: locals.user.createdAt || null
		},
		spotify: {
			connected: Boolean(spotify && spotify.accessToken),
			product: spotify?.product || null,
			connectedAt: spotify?.connectedAt || null,
			spotifyUserId: spotify?.spotifyUserId || null
		}
	};
}
