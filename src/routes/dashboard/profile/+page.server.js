import { listRecs, listShares, publicShare, storageState } from '$lib/server/db.js';
import { fetchSpotifyPlaylists, fetchSpotifyTopTracks } from '$lib/server/spotify.js';

export async function load({ locals }) {
	const user = locals.user;
	const connected = Boolean(user?.spotify?.accessToken);

	let allShares = [];
	let recs = [];
	try {
		allShares = (await listShares()).map((s) => publicShare(s, user?.id ?? null));
	} catch (err) {
		console.error('Profile shares failed:', err.message);
	}
	try {
		recs = await listRecs();
	} catch (err) {
		console.error('Profile recs failed:', err.message);
	}

	let playlistCount = 0;
	let topArtists = [];
	if (connected) {
		try {
			playlistCount = (await fetchSpotifyPlaylists(user)).length;
		} catch (err) {
			console.error('Profile playlists failed:', err.message);
		}
		try {
			const tracks = await fetchSpotifyTopTracks(user);
			const seen = new Map();
			for (const t of tracks) {
				const name = String(t.artist || '')
					.split(',')[0]
					.trim();
				if (!name) continue;
				if (!seen.has(name)) seen.set(name, { name, art: t.art, plays: 0 });
				seen.get(name).plays += 1;
			}
			topArtists = [...seen.values()].sort((a, b) => b.plays - a.plays).slice(0, 8);
		} catch (err) {
			console.error('Profile top artists failed:', err.message);
		}
	}

	const mine = allShares.filter((s) => s.userId === user?.id);

	return {
		connected,
		spotifyProduct: user?.spotify?.product || null,
		spotifyUserId: user?.spotify?.spotifyUserId || null,
		connectedAt: user?.spotify?.connectedAt || null,
		createdAt: user?.createdAt || null,
		storage: storageState().configured ? 'Managed database' : 'In-memory (development)',
		playlistCount,
		topArtists,
		myShares: mine.slice(0, 6),
		stats: {
			shares: mine.length,
			recommendations: recs.filter((r) => r.userId === user?.id).length,
			reactions: mine.reduce((n, s) => n + s.reactionCount, 0),
			comments: mine.reduce((n, s) => n + s.comments.length, 0)
		}
	};
}
