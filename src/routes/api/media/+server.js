import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { DbNotReadyError, saveMedia } from '$lib/server/db.js';
import { requireUser } from '$lib/server/guard.js';
import {
	IMAGE_TYPES,
	VIDEO_TYPES,
	MAX_IMAGE_BYTES,
	MAX_VIDEO_BYTES,
	mediaKindOf
} from '$lib/media.js';

// POST /api/media — multipart upload of one image or short video for a post.
// Validates type and size server-side (the composer already checks client-side)
// and stores the bytes in GridFS (bucket `postMedia`) or the memory fallback.
export async function POST({ locals, request }) {
	const { error } = requireUser(locals);
	if (error) return error;

	// Reject oversize bodies before buffering when the client declares a length.
	const declared = Number(request.headers.get('content-length') || 0);
	if (declared > MAX_VIDEO_BYTES + 64 * 1024) {
		return json({ error: 'That file is too large to upload.' }, { status: 413 });
	}

	// Only a multipart body can carry a file. Say so precisely rather than
	// blaming the client for a parse failure that was really something else.
	const bodyType = String(request.headers.get('content-type') || '').toLowerCase();
	if (!bodyType.includes('multipart/form-data')) {
		return json(
			{
				error:
					'Uploads must be sent as multipart form data with the file attached. Received content type: ' +
					(bodyType || 'none') +
					'.'
			},
			{ status: 400 }
		);
	}

	let form;
	try {
		form = await request.formData();
	} catch (err) {
		console.error('Media upload form parse failed:', err?.message || err);
		return json(
			{ error: 'That upload could not be read. Attach the file again and retry.' },
			{ status: 400 }
		);
	}

	// Accept the field name the composer sends plus the obvious aliases, so a
	// mismatch in one caller can never turn a valid upload into a 400.
	let file = null;
	for (const name of ['file', 'media', 'upload', 'image', 'video']) {
		const candidate = form.get(name);
		if (candidate && typeof candidate.arrayBuffer === 'function') {
			file = candidate;
			break;
		}
	}
	if (!file) {
		// Last resort: take the first file-like entry whatever it is named.
		for (const [, value] of form.entries()) {
			if (value && typeof value.arrayBuffer === 'function') {
				file = value;
				break;
			}
		}
	}
	if (!file) {
		return json({ error: 'No file attached. Add one under the "file" field.' }, { status: 400 });
	}

	const contentType = String(file.type || '').toLowerCase();
	const kind = mediaKindOf(contentType);
	if (!kind) {
		return json(
			{
				error: `Unsupported file type. Images: ${IMAGE_TYPES.join(', ')}. Video: ${VIDEO_TYPES.join(', ')}.`
			},
			{ status: 415 }
		);
	}

	const cap = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
	if (file.size > cap) {
		return json(
			{ error: `That ${kind} is over the ${Math.round(cap / 1048576)}MB limit.` },
			{ status: 413 }
		);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	if (!buffer.length) {
		return json({ error: 'That file is empty.' }, { status: 400 });
	}

	const id = randomUUID();
	try {
		await saveMedia({ id, buffer, contentType });
	} catch (err) {
		if (err instanceof DbNotReadyError) return json({ error: err.message }, { status: 503 });
		console.error('Media upload error:', err);
		return json({ error: 'Could not store that file right now.' }, { status: 500 });
	}

	return json({ mediaId: id, mediaType: kind, contentType, size: buffer.length }, { status: 201 });
}
