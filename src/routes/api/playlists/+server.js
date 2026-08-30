import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { fetchSpotifyPlaylists } from '$lib/server/spotify.js';

export async function GET({ locals }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	const spotifyConnected = Boolean(user.spotify && user.spotify.accessToken);
	if (!spotifyConnected) return json({ spotifyConnected: false, playlists: [] });

	try {
		const playlists = await fetchSpotifyPlaylists(user);
		return json({ spotifyConnected: true, playlists });
	} catch (err) {
		console.error(
			'Spotify playlists fetch failed:',
			err.message,
			err.status ? `(status ${err.status})` : '',
			err.body ? `body: ${err.body}` : ''
		);
		if (err.status === 403) {
			return json({
				spotifyConnected: true,
				playlists: [],
				error:
					'Spotify denied access to your library. Reconnect your Spotify account to grant the required permissions.'
			});
		}
		return json({
			spotifyConnected: true,
			playlists: [],
			error: 'Could not load playlists right now.'
		});
	}
}
