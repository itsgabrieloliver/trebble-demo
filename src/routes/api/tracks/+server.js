import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { fetchSpotifyTopTracks } from '$lib/server/spotify.js';
import { MOCK_TRACKS } from '$lib/server/mock.js';

export async function GET({ locals }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	const spotifyConnected = Boolean(user.spotify && user.spotify.accessToken);
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
