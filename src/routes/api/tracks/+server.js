import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { fetchSpotifyTopTracks, searchSpotifyTracks, spotifyEnv } from '$lib/server/spotify.js';
import { MOCK_TRACKS } from '$lib/server/mock.js';

// GET /api/tracks            -> the listener's own top tracks (library view)
// GET /api/tracks?q=<query>  -> a search across the whole Spotify catalogue
//
// Search intentionally does NOT filter by the library: the composer needs any
// track on Spotify. It degrades to an empty list (never a 500) when the app has
// no Spotify credentials or the search call fails.
export async function GET({ locals, url }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	const query = (url.searchParams.get('q') || '').trim();
	const spotifyConnected = Boolean(user.spotify && user.spotify.accessToken);

	if (query) {
		if (!spotifyEnv()) {
			// No credentials configured: fall back to matching the sample catalogue
			// so the composer stays usable in a fresh environment.
			const q = query.toLowerCase();
			const tracks = MOCK_TRACKS.filter(
				(t) =>
					String(t.title || '')
						.toLowerCase()
						.includes(q) ||
					String(t.artist || '')
						.toLowerCase()
						.includes(q)
			);
			return json({ spotifyConnected, usingLiveData: false, query, tracks });
		}

		try {
			const tracks = await searchSpotifyTracks(user, query);
			return json({ spotifyConnected, usingLiveData: true, query, tracks });
		} catch (err) {
			console.error('Spotify track search failed:', err.message, err.status || '');
			return json({ spotifyConnected, usingLiveData: false, query, tracks: [] });
		}
	}

	if (!spotifyConnected) {
		return json({ spotifyConnected: false, tracks: MOCK_TRACKS });
	}

	try {
		const tracks = await fetchSpotifyTopTracks(user);
		return json({ spotifyConnected: true, usingLiveData: true, tracks });
	} catch (err) {
		console.error(
			'Spotify top tracks fetch failed:',
			err.message,
			err.status ? `(status ${err.status})` : '',
			err.body ? `body: ${err.body}` : ''
		);
		return json({ spotifyConnected: true, usingLiveData: false, tracks: MOCK_TRACKS });
	}
}
