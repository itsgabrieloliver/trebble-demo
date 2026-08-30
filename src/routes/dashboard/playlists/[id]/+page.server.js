import { error as kitError } from '@sveltejs/kit';
import { fetchSpotifyPlaylistTracks, fetchSpotifyPlaylists } from '$lib/server/spotify.js';

export async function load({ locals, params }) {
	const user = locals.user;
	if (!user?.spotify?.accessToken) {
		return { connected: false, playlist: null, tracks: [], error: null };
	}

	let playlist = null;
	try {
		const all = await fetchSpotifyPlaylists(user);
		playlist = all.find((p) => p.id === params.id) || null;
	} catch (err) {
		console.error('Playlist lookup failed:', err.message);
	}

	try {
		const tracks = await fetchSpotifyPlaylistTracks(user, params.id);
		return { connected: true, playlist, tracks, error: null };
	} catch (err) {
		console.error(
			`Spotify playlist tracks fetch failed for playlist ${params.id}:`,
			err.message,
			err.status ? `(status ${err.status})` : ''
		);
		if (err.status === 400) kitError(400, 'That playlist link looks invalid.');
		if (err.status === 403) {
			return {
				connected: true,
				playlist,
				tracks: [],
				error: playlist?.isSpotifyOwned
					? 'Spotify restricts third-party apps from reading tracks in its own algorithmic playlists such as Discover Weekly, Release Radar and Daily Mix. This is not a permissions problem on your account, open it in Spotify directly.'
					: 'Spotify denied access to this playlist. Reconnect your Spotify account to grant the required permissions.'
			};
		}
		return {
			connected: true,
			playlist,
			tracks: [],
			error: 'Could not load that playlist right now.'
		};
	}
}
