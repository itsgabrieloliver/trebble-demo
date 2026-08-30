import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { fetchSpotifyPlaylistTracks } from '$lib/server/spotify.js';

export async function GET({ locals, params }) {
	const { user, error } = requireUser(locals);
	if (error) return error;

	if (!user.spotify || !user.spotify.accessToken) return json({ tracks: [] });

	try {
		const tracks = await fetchSpotifyPlaylistTracks(user, params.id);
		return json({ tracks });
	} catch (err) {
		console.error(
			`Spotify playlist tracks fetch failed for playlist ${params.id}:`,
			err.message,
			err.status ? `(status ${err.status})` : '',
			err.body ? `body: ${err.body}` : ''
		);
		if (err.status === 403) {
			return json({
				tracks: [],
				error:
					'Spotify denied access to this playlist. Reconnect your Spotify account to grant the required permissions.'
			});
		}
		if (err.status === 400) {
			return json({ error: 'That playlist link looks invalid.' }, { status: 400 });
		}
		return json({ error: 'Could not load that playlist right now.' }, { status: 500 });
	}
}
