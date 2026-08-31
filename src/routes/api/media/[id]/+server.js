import { error as httpError, json } from '@sveltejs/kit';
import { Readable } from 'node:stream';
import { DbNotReadyError, findMedia } from '$lib/server/db.js';

// GET /api/media/[id] — streams a stored upload with its real content-type.
// Ids are random UUIDs generated at upload, so responses are immutable and
// safe to cache hard.
export async function GET({ params }) {
	// Ids are UUIDs we minted; anything else can 404 without touching storage.
	const id = String(params.id || '');
	if (!/^[0-9a-f-]{36}$/i.test(id)) throw httpError(404, 'No such media.');

	let media;
	try {
		media = await findMedia(id);
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Media read error:', err);
		return json({ error: 'Could not read that media right now.' }, { status: 500 });
	}
	if (!media) throw httpError(404, 'No such media.');

	const headers = {
		'content-type': media.contentType,
		'content-length': String(media.length),
		'cache-control': 'public, max-age=31536000, immutable'
	};

	// Memory fallback returns the whole buffer; GridFS returns a Node stream
	// that we hand to the Response as a web stream so nothing is buffered.
	if (media.buffer) {
		return new Response(media.buffer, { headers });
	}
	return new Response(Readable.toWeb(media.stream()), { headers });
}
