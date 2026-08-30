import { MOCK_TRACKS } from '$lib/server/mock.js';
import { fetchSpotifyTopTracks } from '$lib/server/spotify.js';

export async function load({ locals }) {
	const user = locals.user;
	const connected = Boolean(user?.spotify?.accessToken);

	if (!connected) {
		return { connected: false, usingLiveData: false, tracks: MOCK_TRACKS, error: null };
	}

	try {
		const tracks = await fetchSpotifyTopTracks(user);
		return { connected: true, usingLiveData: true, tracks, error: null };
	} catch (err) {
		console.error(
			'Spotify top tracks fetch failed:',
			err.message,
			err.status ? `(status ${err.status})` : ''
		);
		return {
			connected: true,
			usingLiveData: false,
			tracks: MOCK_TRACKS,
			error: 'Connected, but Spotify would not return your top tracks right now.'
		};
	}
}
