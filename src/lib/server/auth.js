import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// --- Password hashing -------------------------------------------------------

export function hashPassword(password) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
	const [salt, hash] = String(stored || '').split(':');
	if (!salt || !hash) return false;
	const hashBuf = Buffer.from(hash, 'hex');
	const candidate = scryptSync(password, salt, 64);
	if (candidate.length !== hashBuf.length) return false;
	return timingSafeEqual(candidate, hashBuf);
}

// --- Sessions (in-memory cookie sessions, one process) ----------------------

const sessions = new Map(); // sid -> { userId, expires }
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
export const SESSION_COOKIE = 'sid';

export function createSession(userId) {
	const sid = randomBytes(24).toString('hex');
	sessions.set(sid, { userId, expires: Date.now() + SESSION_TTL_MS });
	return sid;
}

export function getSession(sid) {
	if (!sid) return null;
	const s = sessions.get(sid);
	if (!s) return null;
	if (s.expires < Date.now()) {
		sessions.delete(sid);
		return null;
	}
	return s;
}

export function destroySession(sid) {
	if (sid) sessions.delete(sid);
}

export function setSessionCookie(cookies, sid) {
	cookies.set(SESSION_COOKIE, sid, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_MS / 1000
	});
}

export function clearSessionCookie(cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function publicUser(user) {
	return { id: user.id, email: user.email, displayName: user.displayName };
}
