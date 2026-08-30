import { fetchSpotifyPlaylists } from '$lib/server/spotify.js';

export async function load({ locals }) {
	const user = locals.user;
	const connected = Boolean(user?.spotify?.accessToken);
	if (!connected) return { connected: false, playlists: [], error: null };

	try {
		const playlists = await fetchSpotifyPlaylists(user);
		return { connected: true, playlists, error: null };
	} catch (err) {
		console.error(
			'Spotify playlists fetch failed:',
			err.message,
			err.status ? `(status ${err.status})` : ''
		);
		if (err.status === 403) {
			return {
				connected: true,
				playlists: [],
				error:
					'Spotify denied access to your library. Reconnect your Spotify account to grant the required permissions.'
			};
		}
		return { connected: true, playlists: [], error: 'Could not load playlists right now.' };
	}
}
