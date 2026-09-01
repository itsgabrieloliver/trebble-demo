// Spotify OAuth + Web API access. Every credential is read from the
// environment; nothing is ever hardcoded here.

import { env } from '$env/dynamic/private';
import { updateUserSpotify } from './db.js';

export const SPOTIFY_SCOPES = [
	'user-top-read',
	// Required for GET /v1/me to actually include the `product` field
	// ("premium" / "free"). Without this scope Spotify silently omits `product`
	// from the profile response (no error, just a missing key), which makes the
	// client think a genuinely Premium account is not Premium and never even
	// attempt the Web Playback SDK path.
	'user-read-private',
	'playlist-read-private',
	'playlist-read-collaborative',
	'user-library-read',
	'user-read-recently-played',
	'user-read-email',
	'streaming',
	'user-read-playback-state',
	'user-modify-playback-state'
].join(' ');

export function spotifyEnv() {
	const clientId = env.SPOTIFY_CLIENT_ID;
	const clientSecret = env.SPOTIFY_CLIENT_SECRET;
	const redirectUri = env.SPOTIFY_REDIRECT_URI;
	if (!clientId || !clientSecret || !redirectUri) return null;
	return { clientId, clientSecret, redirectUri };
}

// In-memory map of OAuth state token -> userId, so the callback can attach the
// resulting tokens to the user who started the flow.
const spotifyOAuthState = new Map();

export function rememberOAuthState(state, userId) {
	spotifyOAuthState.set(state, { userId, expires: Date.now() + 10 * 60 * 1000 });
}

export function takeOAuthState(state) {
	if (!state) return null;
	const pending = spotifyOAuthState.get(state);
	spotifyOAuthState.delete(state);
	if (!pending || pending.expires < Date.now()) return null;
	return pending;
}

export function buildAuthorizeUrl(env2, state) {
	const authorizeUrl = new URL('https://accounts.spotify.com/authorize');
	authorizeUrl.searchParams.set('response_type', 'code');
	authorizeUrl.searchParams.set('client_id', env2.clientId);
	authorizeUrl.searchParams.set('scope', SPOTIFY_SCOPES);
	authorizeUrl.searchParams.set('redirect_uri', env2.redirectUri);
	authorizeUrl.searchParams.set('state', state);
	// Force Spotify's consent screen every time. Without this, if the user
	// already granted an earlier (narrower) scope set, Spotify can silently
	// redirect straight back with a code for the OLD scopes, so a "reconnect"
	// click looks like it worked but grants nothing new.
	authorizeUrl.searchParams.set('show_dialog', 'true');
	return authorizeUrl.toString();
}

export async function exchangeCodeForTokens(env2, code) {
	const basicAuth = Buffer.from(`${env2.clientId}:${env2.clientSecret}`).toString('base64');
	const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			authorization: `Basic ${basicAuth}`
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: env2.redirectUri
		})
	});
	const tokenData = await tokenRes.json();
	if (!tokenRes.ok || !tokenData.access_token) {
		console.error('Spotify token exchange failed:', tokenData);
		return null;
	}
	// Ground truth for whether a reconnect actually picked up new permissions.
	console.log(
		`Spotify token exchange OK. Granted scope: "${tokenData.scope || '(none returned)'}" | requested scope: "${SPOTIFY_SCOPES}"`
	);
	if (tokenData.scope) {
		const granted = new Set(tokenData.scope.split(' '));
		const missing = SPOTIFY_SCOPES.split(' ').filter((s) => !granted.has(s));
		if (missing.length) {
			console.warn(`Spotify granted token is MISSING requested scopes: ${missing.join(', ')}`);
		}
	}
	return tokenData;
}

// Fetches the account's subscription tier ("premium" / "free") and its Spotify
// user id, so the client knows up front whether full-track SDK playback is even
// possible and playlist ownership can be classified correctly.
export async function fetchSpotifyProfile(accessToken) {
	try {
		const profileRes = await fetch('https://api.spotify.com/v1/me', {
			headers: { authorization: `Bearer ${accessToken}` }
		});
		if (!profileRes.ok) return { product: null, spotifyUserId: null };
		const profile = await profileRes.json();
		return { product: profile.product || null, spotifyUserId: profile.id || null };
	} catch (err) {
		console.error('Spotify profile fetch (product tier) failed:', err.message);
		return { product: null, spotifyUserId: null };
	}
}

export async function refreshSpotifyToken(user) {
	const cfg = spotifyEnv();
	if (!cfg || !user.spotify?.refreshToken) return null;

	const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
	const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			authorization: `Basic ${basicAuth}`
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: user.spotify.refreshToken
		})
	});
	const tokenData = await tokenRes.json();
	if (!tokenRes.ok || !tokenData.access_token) {
		console.error(
			`Spotify token refresh failed (status ${tokenRes.status}):`,
			JSON.stringify(tokenData)
		);
		throw new Error(`Could not refresh Spotify token (status ${tokenRes.status}).`);
	}
	const spotify = {
		...user.spotify,
		accessToken: tokenData.access_token,
		expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000
	};
	await updateUserSpotify(user.id, spotify);
	return spotify;
}

export async function getFreshSpotifyToken(user) {
	let spotify = user.spotify;
	if (!spotify || !spotify.accessToken) return null;
	if (spotify.expiresAt && spotify.expiresAt < Date.now() + 30000) {
		const refreshed = await refreshSpotifyToken(user);
		if (refreshed) spotify = refreshed;
	}
	return spotify;
}

async function spotifyApiError(apiRes, context) {
	let bodyText = '';
	try {
		bodyText = await apiRes.text();
	} catch {
		bodyText = '<unreadable body>';
	}
	const err = new Error(
		`${context}: Spotify API request failed (status ${apiRes.status}): ${bodyText}`
	);
	err.status = apiRes.status;
	err.body = bodyText;
	return err;
}

export function mapSpotifyTracks(items) {
	const mapped = (items || [])
		.map((entry) => {
			// /v1/playlists/{id}/items nests the track under `item` in some
			// responses and the deprecated `track` in others; /me/top/tracks has
			// no wrapper at all.
			return entry?.item || entry?.track || entry;
		})
		.filter(Boolean)
		.map((t) => ({
			id: t.id,
			uri: t.uri,
			title: t.name,
			artist: (t.artists || []).map((a) => a.name).join(', '),
			album: t.album?.name || null,
			art: t.album?.images?.[0]?.url || 'https://picsum.photos/seed/spotify/300/300',
			durationMs: t.duration_ms || 0,
			previewUrl: t.preview_url || null
		}));

	if (mapped.length) {
		console.log(
			`mapSpotifyTracks: mapped ${mapped.length} track(s), sample: ` +
				mapped
					.slice(0, 3)
					.map((t) => `"${t.title}" uri=${t.uri || '(missing)'} previewUrl=${t.previewUrl || '(null)'}`)
					.join(' | ')
		);
	}
	return mapped;
}

export async function fetchSpotifyTopTracks(user) {
	let spotify = user.spotify;
	if (spotify.expiresAt && spotify.expiresAt < Date.now() + 30000) {
		const refreshed = await refreshSpotifyToken(user);
		if (refreshed) spotify = refreshed;
	}

	const url = 'https://api.spotify.com/v1/me/top/tracks?limit=20';
	const apiRes = await fetch(url, { headers: { authorization: `Bearer ${spotify.accessToken}` } });

	if (apiRes.status === 401) {
		const refreshed = await refreshSpotifyToken(user);
		if (!refreshed)
			throw await spotifyApiError(apiRes, 'fetchSpotifyTopTracks (401, refresh unavailable)');
		const retryRes = await fetch(url, {
			headers: { authorization: `Bearer ${refreshed.accessToken}` }
		});
		if (!retryRes.ok)
			throw await spotifyApiError(retryRes, 'fetchSpotifyTopTracks (retry after refresh)');
		const retryData = await retryRes.json();
		return mapSpotifyTracks(retryData.items);
	}

	if (!apiRes.ok) throw await spotifyApiError(apiRes, 'fetchSpotifyTopTracks');
	const data = await apiRes.json();
	return mapSpotifyTracks(data.items);
}

// Client-credentials token, cached in memory until shortly before it expires.
// Used for catalogue search when the listener has not connected their own
// account, so search still covers all of Spotify rather than nothing.
let appToken = null;

async function getAppToken() {
	const cfg = spotifyEnv();
	if (!cfg) return null;
	if (appToken && appToken.expiresAt > Date.now() + 30000) return appToken.accessToken;

	const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
	const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			authorization: `Basic ${basicAuth}`
		},
		body: new URLSearchParams({ grant_type: 'client_credentials' })
	});
	const tokenData = await tokenRes.json().catch(() => null);
	if (!tokenRes.ok || !tokenData?.access_token) {
		console.error('Spotify client-credentials token request failed:', JSON.stringify(tokenData));
		appToken = null;
		return null;
	}
	appToken = {
		accessToken: tokenData.access_token,
		expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000
	};
	return appToken.accessToken;
}

// Full catalogue search (type=track). Prefers the listener's own token so
// results respect their market, and falls back to an app token. Returns [] when
// there is nothing usable rather than throwing, so search never 500s.
export async function searchSpotifyTracks(user, query, limit = 12) {
	const q = String(query || '').trim();
	if (!q) return [];

	let token = null;
	let usedUserToken = false;
	try {
		const spotify = user ? await getFreshSpotifyToken(user) : null;
		if (spotify?.accessToken) {
			token = spotify.accessToken;
			usedUserToken = true;
		}
	} catch (err) {
		console.warn('Spotify search: user token refresh failed, trying app token:', err.message);
	}
	if (!token) token = await getAppToken();
	if (!token) return [];

	const url =
		`https://api.spotify.com/v1/search?type=track&limit=${Math.min(50, Math.max(1, limit))}` +
		`&q=${encodeURIComponent(q)}` +
		(usedUserToken ? '&market=from_token' : '');

	let apiRes = await fetch(url, { headers: { authorization: `Bearer ${token}` } });

	// A stale user token should not break search: retry once on the app token.
	if (apiRes.status === 401 && usedUserToken) {
		const fallback = await getAppToken();
		if (!fallback) return [];
		const retryUrl = `https://api.spotify.com/v1/search?type=track&limit=${Math.min(50, Math.max(1, limit))}&q=${encodeURIComponent(q)}`;
		apiRes = await fetch(retryUrl, { headers: { authorization: `Bearer ${fallback}` } });
	}

	if (!apiRes.ok) {
		const body = await apiRes.text().catch(() => '<unreadable body>');
		console.error(`Spotify track search failed (status ${apiRes.status}): ${body}`);
		return [];
	}

	const data = await apiRes.json().catch(() => null);
	return mapSpotifyTracks(data?.tracks?.items).map((t) => ({
		...t,
		// The composer and TrackRow read `art`; keep an explicit album name and
		// artwork alias so other callers have the full shape too.
		album: t.album || null,
		artwork: t.art
	}));
}

export async function fetchSpotifyPlaylists(user) {
	const spotify = await getFreshSpotifyToken(user);
	if (!spotify) throw new Error('Spotify not connected.');
	const apiRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
		headers: { authorization: `Bearer ${spotify.accessToken}` }
	});
	if (!apiRes.ok) throw await spotifyApiError(apiRes, 'fetchSpotifyPlaylists');
	const data = await apiRes.json();
	return (data.items || []).filter(Boolean).map((p) => ({
		id: p.id,
		name: p.name,
		trackCount: p.tracks?.total || 0,
		art: p.images?.[0]?.url || null,
		description: p.description || '',
		// Spotify's own algorithmic playlists (Discover Weekly, Release Radar,
		// Daily Mix) are owned by the "spotify" account and their /tracks
		// endpoint routinely 403s for third-party apps regardless of scope. That
		// is an expected limitation rather than a missing-permission bug, so the
		// UI can say so plainly.
		ownerId: p.owner?.id || null,
		ownerName: p.owner?.display_name || null,
		isSpotifyOwned: p.owner?.id === 'spotify'
	}));
}

async function logAndBuildPlaylistTracksError(apiRes, requestUrl) {
	let bodyText = '';
	try {
		bodyText = await apiRes.text();
	} catch {
		bodyText = '<unreadable body>';
	}
	console.error(
		`Spotify playlist tracks fetch failed: url=${requestUrl || '(unknown)'} status=${apiRes.status} ${apiRes.statusText} - ${bodyText}`
	);
	const err = new Error(
		`Spotify playlist tracks fetch failed: url=${requestUrl || '(unknown)'} status=${apiRes.status} ${apiRes.statusText} - ${bodyText}`
	);
	err.status = apiRes.status;
	err.body = bodyText;
	err.url = requestUrl || null;
	return err;
}

export async function fetchSpotifyPlaylistTracks(user, playlistId) {
	const spotify = await getFreshSpotifyToken(user);
	if (!spotify) throw new Error('Spotify not connected.');
	if (!playlistId || !/^[A-Za-z0-9]+$/.test(playlistId)) {
		const err = new Error(`Malformed playlist id: ${JSON.stringify(playlistId)}`);
		err.status = 400;
		throw err;
	}

	// Some playlists (region-restricted or relinked tracks) 400/403 on this
	// endpoint without a `market` param; `from_token` is the documented value
	// and is harmless otherwise.
	const url = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items?limit=100&market=from_token`;
	const apiRes = await fetch(url, { headers: { authorization: `Bearer ${spotify.accessToken}` } });

	if (apiRes.status === 401) {
		// Token was stale despite the pre-emptive refresh check (clock skew, or
		// revoked). Force a refresh and retry once.
		const refreshed = await refreshSpotifyToken(user);
		if (!refreshed) throw await logAndBuildPlaylistTracksError(apiRes, url);
		const retryRes = await fetch(url, {
			headers: { authorization: `Bearer ${refreshed.accessToken}` }
		});
		if (!retryRes.ok) throw await logAndBuildPlaylistTracksError(retryRes, url);
		const retryData = await retryRes.json();
		return mapSpotifyTracks(retryData.items);
	}

	if (!apiRes.ok) throw await logAndBuildPlaylistTracksError(apiRes, url);
	const data = await apiRes.json();
	return mapSpotifyTracks(data.items);
}
