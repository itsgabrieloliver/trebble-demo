import { redirect } from '@sveltejs/kit';
import { updateUserSpotify } from '$lib/server/db.js';
import {
	exchangeCodeForTokens,
	fetchSpotifyProfile,
	spotifyEnv,
	takeOAuthState
} from '$lib/server/spotify.js';

function fail(reason) {
	redirect(302, `/dashboard?spotify=error&reason=${encodeURIComponent(reason)}`);
}

export async function GET({ url }) {
	const cfg = spotifyEnv();
	if (!cfg) {
		fail(
			'Spotify is not set up on this deployment. SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET or SPOTIFY_REDIRECT_URI is missing.'
		);
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (error) fail('Spotify sign-in was cancelled or denied.');

	const pending = takeOAuthState(state);
	if (!pending) fail('That Spotify sign-in link expired. Try connecting again.');
	if (!code) fail('Spotify did not return an authorization code.');

	let tokenData;
	try {
		tokenData = await exchangeCodeForTokens(cfg, code);
	} catch (err) {
		console.error('Spotify callback error:', err);
		fail('Could not reach Spotify. Try again shortly.');
	}
	if (!tokenData) fail('Spotify rejected that sign-in. Please try again.');

	const { product, spotifyUserId } = await fetchSpotifyProfile(tokenData.access_token);

	await updateUserSpotify(pending.userId, {
		accessToken: tokenData.access_token,
		refreshToken: tokenData.refresh_token || null,
		expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
		connectedAt: new Date().toISOString(),
		product,
		spotifyUserId
	});

	console.log(
		`Spotify token stored for userId=${pending.userId} spotifyUserId=${spotifyUserId || '(unknown)'} ` +
			`product=${product || '(unknown)'} token prefix=${tokenData.access_token.slice(0, 10)}...`
	);

	redirect(302, '/dashboard?spotify=connected');
}
