import { listRecs, listShares, publicShare } from '$lib/server/db.js';
import { MOCK_TRACKS } from '$lib/server/mock.js';
import { fetchSpotifyPlaylists, fetchSpotifyTopTracks } from '$lib/server/spotify.js';

export async function load({ locals }) {
	const user = locals.user;
	const connected = Boolean(user?.spotify?.accessToken);

	let tracks = MOCK_TRACKS;
	let usingLiveData = false;
	let playlists = [];
	let loadError = null;

	if (connected) {
		try {
			tracks = await fetchSpotifyTopTracks(user);
			usingLiveData = true;
		} catch (err) {
			console.error('Overview top tracks failed:', err.message);
			tracks = MOCK_TRACKS;
			loadError = 'Could not load live tracks from Spotify right now, showing sample picks.';
		}
		try {
			playlists = await fetchSpotifyPlaylists(user);
		} catch (err) {
			console.error('Overview playlists failed:', err.message);
		}
	}

	let shares = [];
	let recCount = 0;
	try {
		shares = (await listShares()).map((s) => publicShare(s, user?.id ?? null));
	} catch (err) {
		console.error('Overview shares failed:', err.message);
	}
	try {
		recCount = (await listRecs()).length;
	} catch (err) {
		console.error('Overview recs failed:', err.message);
	}

	return {
		connected,
		usingLiveData,
		loadError,
		tracks: tracks.slice(0, 8),
		playlists: playlists.slice(0, 6),
		playlistTotal: playlists.length,
		recentShares: shares.slice(0, 4),
		shareTotal: shares.length,
		recCount,
		reactionTotal: shares.reduce((n, s) => n + s.reactionCount, 0)
	};
}
