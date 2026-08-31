// Storage layer: MongoDB when DATABASE_URL is set, in-memory fallback otherwise.
// Collections and queries are kept exactly as the previous server used them:
// `users`, `recommendations`, `shares`.

import { env } from '$env/dynamic/private';

let mongoClient = null;
let usersCollection = null;
let recsCollection = null;
let sharesCollection = null;
let mediaBucket = null;
let mongoReady = false;

// DATABASE_URL is read straight from the environment with no hardcoded
// fallback, so we never silently connect to the wrong place. If it is unset
// we intentionally run in an in-memory dev mode; if it IS set, the app is
// expected to reach a real MongoDB and says so explicitly while it hasn't yet,
// rather than quietly switching storage backends mid-flight.
const dbConfigured = Boolean(env.DATABASE_URL);

// dbState communicates *why* the DB isn't usable yet so API routes can
// return a clear, honest error instead of hanging or 500ing.
let dbState = dbConfigured ? 'connecting' : 'disabled';
let storageInitStarted = false;

export class DbNotReadyError extends Error {}

const memory = {
	users: new Map(), // email -> user
	usersById: new Map(),
	recs: [],
	shares: [],
	media: new Map() // id -> { buffer, contentType, length }
};

export function storageLabel() {
	return mongoReady ? 'mongodb' : 'memory';
}

export function storageState() {
	return { configured: dbConfigured, state: dbState, ready: mongoReady };
}

export async function initStorage() {
	if (storageInitStarted) return;
	storageInitStarted = true;

	if (!dbConfigured) {
		dbState = 'disabled';
		console.log('DATABASE_URL not set, using in-memory storage fallback.');
		return;
	}

	dbState = 'connecting';
	try {
		const { MongoClient, GridFSBucket } = await import('mongodb');
		mongoClient = new MongoClient(env.DATABASE_URL, { serverSelectionTimeoutMS: 5000 });
		await mongoClient.connect();
		const db = mongoClient.db();
		usersCollection = db.collection('users');
		recsCollection = db.collection('recommendations');
		sharesCollection = db.collection('shares');
		// New bucket for post media only; existing collections stay untouched.
		mediaBucket = new GridFSBucket(db, { bucketName: 'postMedia' });
		await usersCollection.createIndex({ email: 1 }, { unique: true });
		await sharesCollection.createIndex({ createdAt: -1 });
		mongoReady = true;
		dbState = 'ready';
		console.log('Connected to MongoDB.');
	} catch (err) {
		console.error('MongoDB connection failed:', err.message);
		mongoReady = false;
		dbState = 'unavailable';
		mongoClient = null;
		usersCollection = null;
		recsCollection = null;
		sharesCollection = null;
		mediaBucket = null;
		// Retry in the background so a transient network blip recovers on its
		// own without needing a redeploy or restart.
		setTimeout(() => {
			storageInitStarted = false;
			initStorage();
		}, 5000).unref?.();
	}
}

// Throws DbNotReadyError (never hangs, never silently swaps storage) if a real
// database was configured but is not connected yet.
function ensureDbAvailable() {
	if (!dbConfigured) return;
	if (dbState !== 'ready') {
		throw new DbNotReadyError(
			dbState === 'connecting'
				? 'Database is still starting up. Try again in a few seconds.'
				: 'Database is temporarily unavailable. Try again shortly.'
		);
	}
}

export async function findUserByEmail(email) {
	if (dbConfigured) {
		ensureDbAvailable();
		return usersCollection.findOne({ email });
	}
	return memory.users.get(email) || null;
}

export async function findUserById(id) {
	if (dbConfigured) {
		ensureDbAvailable();
		return usersCollection.findOne({ id });
	}
	return memory.usersById.get(id) || null;
}

export async function createUser(user) {
	if (dbConfigured) {
		ensureDbAvailable();
		await usersCollection.insertOne(user);
		return user;
	}
	memory.users.set(user.email, user);
	memory.usersById.set(user.id, user);
	return user;
}

export async function updateUserSpotify(userId, spotify) {
	if (dbConfigured) {
		ensureDbAvailable();
		await usersCollection.updateOne({ id: userId }, { $set: { spotify } });
		return;
	}
	const user = memory.usersById.get(userId);
	if (user) user.spotify = spotify;
}

export async function insertRec(rec) {
	if (dbConfigured) {
		ensureDbAvailable();
		await recsCollection.insertOne(rec);
		return rec;
	}
	memory.recs.unshift(rec);
	return rec;
}

export async function listRecs() {
	if (dbConfigured) {
		ensureDbAvailable();
		return recsCollection.find({}).sort({ createdAt: -1 }).limit(50).toArray();
	}
	return memory.recs.slice(0, 50);
}

export async function insertShare(share) {
	if (dbConfigured) {
		ensureDbAvailable();
		await sharesCollection.insertOne(share);
		return share;
	}
	memory.shares.unshift(share);
	return share;
}

export async function listShares() {
	if (dbConfigured) {
		ensureDbAvailable();
		return sharesCollection.find({}).sort({ createdAt: -1 }).limit(50).toArray();
	}
	return memory.shares.slice(0, 50);
}

export async function findShareById(id) {
	if (dbConfigured) {
		ensureDbAvailable();
		return sharesCollection.findOne({ id });
	}
	return memory.shares.find((s) => s.id === id) || null;
}

export async function addCommentToShare(id, comment) {
	if (dbConfigured) {
		ensureDbAvailable();
		const result = await sharesCollection.findOneAndUpdate(
			{ id },
			{ $push: { comments: comment } },
			{ returnDocument: 'after' }
		);
		return result?.value || result;
	}
	const share = memory.shares.find((s) => s.id === id);
	if (!share) return null;
	share.comments.push(comment);
	return share;
}

export async function toggleShareReaction(id, userId) {
	if (dbConfigured) {
		ensureDbAvailable();
		const existing = await sharesCollection.findOne({ id });
		if (!existing) return null;
		const already = (existing.reactedUserIds || []).includes(userId);
		const update = already
			? { $pull: { reactedUserIds: userId } }
			: { $addToSet: { reactedUserIds: userId } };
		const result = await sharesCollection.findOneAndUpdate({ id }, update, {
			returnDocument: 'after'
		});
		return result?.value || result || (await sharesCollection.findOne({ id }));
	}
	const share = memory.shares.find((s) => s.id === id);
	if (!share) return null;
	const idx = share.reactedUserIds.indexOf(userId);
	if (idx === -1) share.reactedUserIds.push(userId);
	else share.reactedUserIds.splice(idx, 1);
	return share;
}

export async function deleteShareById(id, userId) {
	if (dbConfigured) {
		ensureDbAvailable();
		const share = await sharesCollection.findOne({ id });
		if (!share) return { ok: false, reason: 'not_found' };
		if (share.userId !== userId) return { ok: false, reason: 'forbidden' };
		await sharesCollection.deleteOne({ id });
		return { ok: true };
	}
	const idx = memory.shares.findIndex((s) => s.id === id);
	if (idx === -1) return { ok: false, reason: 'not_found' };
	if (memory.shares[idx].userId !== userId) return { ok: false, reason: 'forbidden' };
	memory.shares.splice(idx, 1);
	return { ok: true };
}

// Media (post uploads) -------------------------------------------------------
// Stored in GridFS bucket `postMedia` when MongoDB is configured, or an
// in-memory map otherwise. The app-level id is the GridFS filename, so we
// never expose raw ObjectIds and the memory fallback uses the same shape.

export async function saveMedia({ id, buffer, contentType }) {
	if (dbConfigured) {
		ensureDbAvailable();
		await new Promise((resolve, reject) => {
			const upload = mediaBucket.openUploadStream(id, {
				contentType,
				metadata: { contentType }
			});
			upload.on('error', reject);
			upload.on('finish', resolve);
			upload.end(buffer);
		});
		return { id, contentType, length: buffer.length };
	}
	memory.media.set(id, { buffer, contentType, length: buffer.length });
	return { id, contentType, length: buffer.length };
}

export async function findMedia(id) {
	if (dbConfigured) {
		ensureDbAvailable();
		const file = await mediaBucket.find({ filename: id }).next();
		if (!file) return null;
		return {
			id,
			contentType: file.contentType || file.metadata?.contentType || 'application/octet-stream',
			length: file.length,
			// Lazily opened Node readable stream over the GridFS chunks.
			stream: () => mediaBucket.openDownloadStreamByName(id)
		};
	}
	const entry = memory.media.get(id);
	if (!entry) return null;
	return {
		id,
		contentType: entry.contentType,
		length: entry.length,
		buffer: entry.buffer
	};
}

export function publicShare(share, currentUserId) {
	return {
		id: share.id,
		userId: share.userId,
		displayName: share.displayName,
		avatar: share.avatar,
		track: share.track,
		caption: share.caption || '',
		// Media is optional and new; old share documents simply have none and
		// render exactly as they always did.
		media: share.mediaId
			? {
					url: `/api/media/${encodeURIComponent(share.mediaId)}`,
					type: share.mediaType === 'video' ? 'video' : 'image',
					effect: share.effect || 'none'
				}
			: null,
		createdAt: share.createdAt,
		comments: (share.comments || []).map((c) => ({
			userId: c.userId,
			displayName: c.displayName,
			text: c.text,
			createdAt: c.createdAt
		})),
		reactionCount: (share.reactedUserIds || []).length,
		reactedByMe: (share.reactedUserIds || []).includes(currentUserId),
		canDelete: share.userId === currentUserId
	};
}
