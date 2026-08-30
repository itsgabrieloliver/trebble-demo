// Route smoke test: boots the adapter-node build and checks that every route
// responds without a server error, both signed out and with a session cookie.
import { spawn } from 'node:child_process';

const PORT = process.env.SMOKE_PORT || '4319';
const BASE = `http://127.0.0.1:${PORT}`;

const ROUTES = [
	'/',
	'/login',
	'/dashboard',
	'/dashboard/library',
	'/dashboard/playlists',
	'/dashboard/feed',
	'/dashboard/activity',
	'/dashboard/profile',
	'/api/auth/me',
	'/api/tracks',
	'/api/feed'
];

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

function shutdown(code) {
	server.kill('SIGTERM');
	setTimeout(() => process.exit(code), 200);
}

const booted = await waitForBoot();
if (!booted) {
	console.log('SERVER FAILED TO BOOT');
	console.log(serverLog);
	shutdown(1);
}

let failures = 0;
console.log('--- signed out ---');
for (const route of ROUTES) {
	const res = await fetch(BASE + route, { redirect: 'manual' });
	const body = res.status < 400 ? await res.text() : '';
	const flag = res.status >= 500 ? 'FAIL' : 'ok';
	if (res.status >= 500) failures++;
	const note = res.status >= 300 && res.status < 400 ? ` -> ${res.headers.get('location')}` : '';
	console.log(`${flag}  ${res.status}  ${route}${note}  ${body ? body.length + 'b' : ''}`);
}

// Sign up a user so the dashboard renders with a real session.
const email = `smoke${Date.now()}@example.com`;
const signup = await fetch(BASE + '/api/auth/signup', {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ email, password: 'smoke-pass-123', displayName: 'Smoke Tester' })
});
console.log(`\nsignup status ${signup.status}`);
const cookie = (signup.headers.get('set-cookie') || '').split(';')[0];

if (cookie) {
	console.log('--- signed in (no spotify, memory storage) ---');
	for (const route of ROUTES) {
		const res = await fetch(BASE + route, { headers: { cookie }, redirect: 'manual' });
		const body = res.status < 400 ? await res.text() : await res.text();
		const flag = res.status >= 500 ? 'FAIL' : 'ok';
		if (res.status >= 500) failures++;
		console.log(`${flag}  ${res.status}  ${route}  ${body.length}b`);
		if (res.status >= 500) console.log(body.slice(0, 600));
	}
} else {
	console.log('NO SESSION COOKIE RETURNED');
	failures++;
}

console.log(`\nfailures: ${failures}`);
if (serverLog.trim()) console.log('--- server log ---\n' + serverLog.trim());
shutdown(failures ? 1 : 0);
