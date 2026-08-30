import { json } from '@sveltejs/kit';
import { SESSION_COOKIE, getSession } from '$lib/server/auth.js';
import { readJson } from '$lib/server/guard.js';

// Web Playback SDK error/state events only ever fire in the browser, so without
// this the server has zero visibility into why full-track playback might cut
// off. Small, size-capped, lightly rate limited: no auth complexity, just
// enough to surface events in runtime logs while resisting abuse.

const clientLogBuckets = new Map(); // key -> { count, windowStart }
const CLIENT_LOG_WINDOW_MS = 10000;
const CLIENT_LOG_MAX_PER_WINDOW = 40;

function checkClientLogRateLimit(key) {
	const now = Date.now();
	const bucket = clientLogBuckets.get(key);
	if (!bucket || now - bucket.windowStart > CLIENT_LOG_WINDOW_MS) {
		clientLogBuckets.set(key, { count: 1, windowStart: now });
		return true;
	}
	bucket.count += 1;
	return bucket.count <= CLIENT_LOG_MAX_PER_WINDOW;
}

export async function POST({ request, cookies, getClientAddress }) {
	const sid = cookies.get(SESSION_COOKIE);
	const session = getSession(sid);
	const rateKey = session ? `sid:${sid}` : `ip:${getClientAddress() || 'unknown'}`;
	if (!checkClientLogRateLimit(rateKey)) {
		return json({ error: 'Too many log events.' }, { status: 429 });
	}

	const body = await readJson(request);
	if (!body) return json({ error: 'Invalid request body.' }, { status: 400 });

	const event = String(body.event || 'unknown').slice(0, 100);
	const message = String(body.message || '').slice(0, 500);
	const trackUri = body.trackUri ? String(body.trackUri).slice(0, 200) : null;
	const position = Number.isFinite(body.position) ? body.position : null;
	const paused = typeof body.paused === 'boolean' ? body.paused : null;
	const ts = body.ts ? String(body.ts).slice(0, 40) : new Date().toISOString();

	console.log(
		`[client] event=${event} userId=${session ? session.userId : '(anon)'} trackUri=${trackUri || '(none)'} ` +
			`position=${position !== null ? position : '(none)'} paused=${paused !== null ? paused : '(none)'} ` +
			`ts=${ts} message=${JSON.stringify(message)}`
	);
	return json({ ok: true });
}
