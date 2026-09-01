// Focused check for the two fixed paths: multipart upload to /api/media and
// catalogue search on /api/tracks?q=. Boots the adapter-node build, signs up a
// throwaway user, then exercises each path and prints the real responses.
import { spawn } from 'node:child_process';

const PORT = process.env.VERIFY_PORT || '4321';
const BASE = `http://127.0.0.1:${PORT}`;

const server = spawn('node', ['build'], {
	env: { ...process.env, PORT, HOST: '127.0.0.1' },
	stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

async function waitForBoot() {
	for (let i = 0; i < 60; i++) {
		try {
			await fetch(BASE + '/', { redirect: 'manual' });
			return true;
		} catch {
			await new Promise((r) => setTimeout(r, 250));
		}
	}
	return false;
}

function done(code) {
	if (serverLog.trim()) console.log('\n--- server log ---\n' + serverLog.trim());
	server.kill('SIGTERM');
	setTimeout(() => process.exit(code), 200);
}

if (!(await waitForBoot())) {
	console.log('SERVER FAILED TO BOOT');
	done(1);
}

let failures = 0;
function check(label, ok, detail) {
	if (!ok) failures++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
}

const signup = await fetch(BASE + '/api/auth/signup', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({
		email: `verify${Date.now()}@example.com`,
		password: 'verify-pass-123',
		displayName: 'Verify Tester'
	})
});
const cookie = (signup.headers.get('set-cookie') || '').split(';')[0];
check('signup returns a session cookie', signup.status < 400 && Boolean(cookie), `status ${signup.status}`);

// --- BUG 1: multipart upload ------------------------------------------------
// A minimal but genuinely valid 1x1 PNG.
const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
);
const form = new FormData();
form.append('file', new Blob([png], { type: 'image/png' }), 'dot.png');
const upload = await fetch(BASE + '/api/media', { method: 'POST', headers: { cookie }, body: form });
const uploadBody = await upload.json().catch(() => null);
console.log(`\nPOST /api/media (multipart, field "file") -> ${upload.status}`);
console.log(JSON.stringify(uploadBody));
check('valid multipart upload is accepted', upload.status === 201, `status ${upload.status}`);
check('upload returns a media id', Boolean(uploadBody?.mediaId));

// The alias path: a client that names the field "media" must still work.
const aliasForm = new FormData();
aliasForm.append('media', new Blob([png], { type: 'image/png' }), 'dot.png');
const aliasUpload = await fetch(BASE + '/api/media', {
	method: 'POST',
	headers: { cookie },
	body: aliasForm
});
console.log(`POST /api/media (field "media") -> ${aliasUpload.status}`);
check('field-name alias is accepted', aliasUpload.status === 201, `status ${aliasUpload.status}`);

// A JSON body is the one case that should still be a clear 400.
const jsonUpload = await fetch(BASE + '/api/media', {
	method: 'POST',
	headers: { cookie, 'content-type': 'application/json' },
	body: JSON.stringify({ nope: true })
});
const jsonBody = await jsonUpload.json().catch(() => null);
console.log(`POST /api/media (json body) -> ${jsonUpload.status}  ${JSON.stringify(jsonBody)}`);
check('non-multipart body still 400s clearly', jsonUpload.status === 400);

// --- media id must flow into the share document -----------------------------
const share = await fetch(BASE + '/api/shares', {
	method: 'POST',
	headers: { cookie, 'content-type': 'application/json' },
	body: JSON.stringify({
		uri: 'spotify:track:verify',
		title: 'Nights',
		artist: 'Frank Ocean',
		art: null,
		caption: 'testing the upload path',
		mediaId: uploadBody?.mediaId,
		mediaType: 'image',
		effect: 'vhs'
	})
});
const shareBody = await share.json().catch(() => null);
console.log(`\nPOST /api/shares (with mediaId) -> ${share.status}`);
console.log(JSON.stringify(shareBody?.share?.media));
check('share stores the media', share.status === 201 && Boolean(shareBody?.share?.media));
check('share keeps the effect', shareBody?.share?.media?.effect === 'vhs');
check(
	'share media url points at the upload',
	shareBody?.share?.media?.url === `/api/media/${uploadBody?.mediaId}`
);

// A text-only post must never touch /api/media and must still succeed.
const textOnly = await fetch(BASE + '/api/shares', {
	method: 'POST',
	headers: { cookie, 'content-type': 'application/json' },
	body: JSON.stringify({
		uri: 'spotify:track:verify2',
		title: 'Just',
		artist: 'Radiohead',
		caption: 'no media on this one',
		mediaId: null,
		mediaType: null,
		effect: null
	})
});
const textBody = await textOnly.json().catch(() => null);
console.log(`POST /api/shares (no media) -> ${textOnly.status}`);
check('caption-only post succeeds', textOnly.status === 201 && textBody?.share?.media === null);

// The stored bytes must come back.
const fetched = await fetch(BASE + `/api/media/${uploadBody?.mediaId}`, { headers: { cookie } });
const bytes = Buffer.from(await fetched.arrayBuffer());
console.log(`GET /api/media/${uploadBody?.mediaId} -> ${fetched.status} ${bytes.length}b ${fetched.headers.get('content-type')}`);
check('stored media reads back byte-for-byte', fetched.status === 200 && bytes.length === png.length);

// --- BUG 2: search ----------------------------------------------------------
for (const q of ['drake', 'radiohead']) {
	const res = await fetch(BASE + `/api/tracks?q=${q}`, { headers: { cookie } });
	const body = await res.json().catch(() => null);
	console.log(`\nGET /api/tracks?q=${q} -> ${res.status}`);
	console.log(JSON.stringify(body).slice(0, 400));
	check(`search "${q}" never 500s`, res.status === 200, `status ${res.status}`);
	check(`search "${q}" returns an array`, Array.isArray(body?.tracks));
	check(`search "${q}" echoes the query`, body?.query === q);
}

const noQuery = await fetch(BASE + '/api/tracks', { headers: { cookie } });
const noQueryBody = await noQuery.json().catch(() => null);
console.log(`\nGET /api/tracks (no q) -> ${noQuery.status}  ${noQueryBody?.tracks?.length} tracks`);
check('library listing still works', noQuery.status === 200 && noQueryBody?.tracks?.length > 0);

console.log(`\nfailures: ${failures}`);
done(failures ? 1 : 0);
