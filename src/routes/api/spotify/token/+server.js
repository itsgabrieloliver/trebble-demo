import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { getFreshSpotifyToken } from '$lib/server/spotify.js';

// Hands the browser a short-lived Spotify access token so the Web Playback SDK
// can run client-side. Never exposes the refresh token.
export async function GET({ locals }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	if (!user.spotify || !user.spotify.accessToken) return json({ connected: false });

	try {
		const spotify = await getFreshSpotifyToken(user);
		return json({
			connected: true,
			accessToken: spotify.accessToken,
			// 'premium' is the only tier where the Web Playback SDK can hold a
			// full-track stream open; everything else falls back to previews.
			isPremium: spotify.product === 'premium'
		});
	} catch (err) {
		console.error('Spotify token refresh failed:', err.message);
		return json({ connected: true, accessToken: null });
	}
}
