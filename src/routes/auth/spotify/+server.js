import { redirect } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { buildAuthorizeUrl, rememberOAuthState, spotifyEnv } from '$lib/server/spotify.js';

export async function GET({ locals }) {
	if (!locals.user) redirect(302, '/login');

	const cfg = spotifyEnv();
	if (!cfg) {
		redirect(
			302,
			`/dashboard?spotify=error&reason=${encodeURIComponent(
				'Spotify is not set up on this deployment. SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET or SPOTIFY_REDIRECT_URI is missing.'
			)}`
		);
	}

	const state = randomBytes(16).toString('hex');
	rememberOAuthState(state, locals.user.id);
	redirect(302, buildAuthorizeUrl(cfg, state));
}
