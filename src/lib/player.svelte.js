// Shared playback engine: Spotify Web Playback SDK when the account is Premium,
// 30 second preview clips otherwise. Ported from the previous dashboard client
// with the same guards, diagnostics and auto-advance behaviour.

import { browser } from '$app/environment';

export const player = $state({
	queue: [],
	index: -1,
	queueId: null,
	isPlaying: false,
	mode: 'none', // 'sdk' | 'preview' | 'none'
	badge: null,
	position: 0,
	duration: 0,
	isPremium: false,
	sdkReady: false,
	capability: 'Checking playback options'
});

let accessToken = null;
let sdkPlayer = null;
let sdkDeviceId = null;
let progressTimer = null;
let previewAudio = null;
// Timestamp of the moment the current track's SDK playback actually started,
// used to bracket a 15s window of verbose player_state_changed logging.
let currentTrackStartedAt = null;
// Only ever auto-advance after the listener has started playback themselves;
// browsers block audio without a prior user gesture anyway.
let userInitiatedPlayback = false;
let autoAdvancing = false;
let lastSdkPosition = 0;
let sdkScriptLoaded = false;

export function currentTrack() {
	return player.queue[player.index] || null;
}

export function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${String(s).padStart(2, '0')}`;
}

export async function api(path, options = {}) {
	const res = await fetch(path, {
		credentials: 'same-origin',
		headers: { 'content-type': 'application/json' },
		...options
	});
	let data = null;
	try {
		data = await res.json();
	} catch {
		data = null;
	}
	if (!res.ok) {
		const err = new Error((data && data.error) || 'Something went wrong.');
		err.status = res.status;
		throw err;
	}
	return data;
}

// Fire-and-forget diagnostics so browser-only SDK events show up in server
// runtime logs. Never throws, never blocks playback.
function sendClientLog(event, message, extra = {}) {
	try {
		fetch('/api/client-log', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'content-type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({
				event: String(event || '').slice(0, 100),
				message: String(message || '').slice(0, 500),
				trackUri: extra.trackUri ? String(extra.trackUri).slice(0, 200) : null,
				position: typeof extra.position === 'number' ? extra.position : null,
				paused: typeof extra.paused === 'boolean' ? extra.paused : null,
				ts: new Date().toISOString()
			})
		}).catch(() => {});
	} catch {
		// never let logging break playback
	}
}

async function fetchAccessToken() {
	try {
		const data = await api('/api/spotify/token');
		accessToken = data.connected ? data.accessToken : null;
		player.isPremium = Boolean(data.isPremium);
		return accessToken;
	} catch {
		accessToken = null;
		player.isPremium = false;
		return null;
	}
}

function loadSdkScript() {
	if (sdkScriptLoaded || document.querySelector('script[data-spotify-sdk]')) return;
	sdkScriptLoaded = true;
	const script = document.createElement('script');
	script.src = 'https://sdk.scdn.co/spotify-player.js';
	script.async = true;
	script.dataset.spotifySdk = 'true';
	document.head.appendChild(script);
}

function initSdkPlayer() {
	return new Promise((resolve) => {
		// Never create a second device: every new Spotify.Player registers a NEW
		// Spotify Connect device server-side, and duplicates make playback jump
		// between them.
		if (sdkPlayer) return resolve(player.sdkReady);

		// The SDK registers a device and fires 'ready' for free accounts too;
		// only holding a full-track stream open requires Premium. Gate on the
		// real subscription tier instead of trusting 'ready'.
		if (!window.Spotify || !player.isPremium) return resolve(false);

		const instance = new window.Spotify.Player({
			name: 'Studio 6A',
			getOAuthToken: (cb) => {
				fetchAccessToken().then((token) => cb(token || ''));
			},
			volume: 0.8
		});

		instance.addListener('ready', ({ device_id }) => {
			sdkDeviceId = device_id;
			player.sdkReady = true;
			resolve(true);
		});
		instance.addListener('not_ready', () => {
			player.sdkReady = false;
		});
		instance.addListener('initialization_error', ({ message } = {}) => {
			console.error('Spotify SDK initialization_error:', message);
			sendClientLog('initialization_error', message);
			resolve(false);
		});
		instance.addListener('authentication_error', ({ message } = {}) => {
			console.error('Spotify SDK authentication_error:', message);
			sendClientLog('authentication_error', message);
			resolve(false);
		});
		instance.addListener('account_error', ({ message } = {}) => {
			console.error('Spotify SDK account_error:', message);
			sendClientLog('account_error', message);
			resolve(false);
		});
		instance.addListener('playback_error', ({ message } = {}) => {
			console.error('Spotify SDK playback_error:', message);
			sendClientLog('playback_error', message, { trackUri: currentTrack()?.uri || null });
		});

		instance.addListener('player_state_changed', (state) => {
			if (!state) return;
			player.isPlaying = !state.paused;
			renderSdkProgress(state);

			const trackUri = state.track_window?.current_track?.uri || null;
			if (currentTrackStartedAt && Date.now() - currentTrackStartedAt <= 15000) {
				sendClientLog('player_state_changed', 'state transition within 15s of track start', {
					trackUri,
					position: state.position,
					paused: state.paused
				});
			}

			// Spotify flips paused=true and resets position to 0 when a single-uri
			// playback finishes; there is no distinct "ended" event.
			const wasNearEnd = state.duration > 0 && state.duration - lastSdkPosition < 1500;
			if (
				state.paused &&
				state.position === 0 &&
				wasNearEnd &&
				userInitiatedPlayback &&
				player.mode === 'sdk'
			) {
				autoAdvance();
			} else {
				lastSdkPosition = state.position;
			}

			// player_state_changed only fires on discrete transitions, so poll
			// while playing or the progress bar freezes at the first position.
			if (player.isPlaying) startSdkProgressPolling();
			else stopProgressTimer();
		});

		sdkPlayer = instance;
		instance.connect();

		// If Spotify never calls 'ready' (e.g. non-Premium) do not hang forever.
		setTimeout(() => resolve(player.sdkReady), 4000);
	});
}

export async function setupPlayback() {
	if (!browser) return;
	if (!previewAudio) {
		previewAudio = new Audio();
		previewAudio.preload = 'none';
		previewAudio.addEventListener('ended', () => {
			player.isPlaying = false;
			stopProgressTimer();
			autoAdvance();
		});
		previewAudio.addEventListener('timeupdate', () => {
			if (player.mode !== 'preview') return;
			player.position = previewAudio.currentTime;
			player.duration = previewAudio.duration || 0;
		});
		window.addEventListener('pagehide', teardownPlayback);
	}

	const token = await fetchAccessToken();
	if (!token) {
		player.capability = 'Connect Spotify to play tracks';
		return;
	}

	window.onSpotifyWebPlaybackSDKReady = async () => {
		const ok = await initSdkPlayer();
		player.capability = ok
			? 'Full playback, Premium account'
			: '30 second previews, Premium required for full tracks';
	};
	loadSdkScript();
	if (window.Spotify) window.onSpotifyWebPlaybackSDKReady();
}

// Release this tab's Spotify Connect device so a reload does not leave a stale
// device connected server-side.
export function teardownPlayback() {
	stopProgressTimer();
	if (sdkPlayer) {
		try {
			sdkPlayer.disconnect();
		} catch {
			// already gone
		}
	}
}

// Web Audio and the SDK refuse to start sound until they have seen a direct
// user gesture. This must run synchronously inside the click handler, before
// any await, or the very first play click silently does nothing.
export function markUserGesture() {
	userInitiatedPlayback = true;
	if (sdkPlayer && typeof sdkPlayer.activateElement === 'function') {
		try {
			sdkPlayer.activateElement();
		} catch (err) {
			console.error('Spotify player activateElement() failed:', err);
		}
	}
}

async function playViaSdk(track) {
	if (!sdkDeviceId || !track.uri || !player.isPremium) return false;
	try {
		const token = accessToken || (await fetchAccessToken());
		if (!token) return false;
		const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${sdkDeviceId}`, {
			method: 'PUT',
			headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
			body: JSON.stringify({ uris: [track.uri] })
		});
		if (!res.ok && res.status !== 204) {
			const body = await res.text().catch(() => '');
			console.error(`Spotify play request failed (status ${res.status}): ${body}`);
			return false;
		}
		return true;
	} catch (err) {
		console.error('playViaSdk threw:', err);
		return false;
	}
}

function playViaPreview(track) {
	if (!track.previewUrl || !previewAudio) return false;
	previewAudio.src = track.previewUrl;
	previewAudio.currentTime = 0;
	previewAudio.play().catch(() => {});
	return true;
}

export async function playFromQueue(queue, index, queueId = null) {
	player.queue = queue;
	player.index = index;
	if (queueId !== null) player.queueId = queueId;
	const track = queue[index];
	if (!track) return;

	stopProgressTimer();
	currentTrackStartedAt = null;
	lastSdkPosition = 0;
	player.position = 0;
	player.duration = 0;
	previewAudio?.pause();
	if (sdkPlayer) {
		try {
			await sdkPlayer.pause();
		} catch {
			// not the active device, ignore
		}
	}

	let played = false;
	if (player.sdkReady && player.isPremium && track.uri) {
		played = await playViaSdk(track);
		if (played) {
			player.mode = 'sdk';
			player.badge = null;
			player.isPlaying = true;
			currentTrackStartedAt = Date.now();
			sendClientLog('sdk_play_started', 'playViaSdk succeeded, starting 15s diagnostic window', {
				trackUri: track.uri
			});
			startSdkProgressPolling();
		}
	}
	if (!played) {
		currentTrackStartedAt = null;
		played = playViaPreview(track);
		if (played) {
			player.mode = 'preview';
			player.badge = 'Preview 30s';
			player.isPlaying = true;
		}
	}
	if (!played) {
		player.mode = 'none';
		player.badge = 'No audio available';
		player.isPlaying = false;
	}
}

// Advances to the next queued track. Only ever runs after a real user gesture.
function autoAdvance() {
	if (autoAdvancing || !userInitiatedPlayback) return;
	if (!player.queue.length || player.index < 0) return;
	autoAdvancing = true;
	const next = player.index + 1;
	if (next >= player.queue.length) {
		// End of queue: stop rather than silently looping forever.
		autoAdvancing = false;
		return;
	}
	playFromQueue(player.queue, next)
		.catch((err) => console.error('autoAdvance failed:', err))
		.finally(() => {
			autoAdvancing = false;
		});
}

function renderSdkProgress(state) {
	player.duration = state.duration / 1000;
	player.position = state.position / 1000;
}

// The SDK only pushes state on discrete events, so read the real position back
// from the player rather than running an independent local clock.
function startSdkProgressPolling() {
	stopProgressTimer();
	progressTimer = setInterval(async () => {
		if (!sdkPlayer || player.mode !== 'sdk') return stopProgressTimer();
		const state = await sdkPlayer.getCurrentState().catch(() => null);
		if (!state) return;
		player.isPlaying = !state.paused;
		renderSdkProgress(state);
		lastSdkPosition = state.position;
	}, 500);
}

function stopProgressTimer() {
	if (progressTimer) {
		clearInterval(progressTimer);
		progressTimer = null;
	}
}

export async function togglePlay() {
	if (player.index < 0) return;
	userInitiatedPlayback = true;
	if (player.mode === 'sdk' && sdkPlayer) {
		await sdkPlayer.togglePlay();
		return;
	}
	if (player.mode === 'preview' && previewAudio) {
		if (previewAudio.paused) {
			previewAudio.play().catch(() => {});
			player.isPlaying = true;
		} else {
			previewAudio.pause();
			player.isPlaying = false;
		}
	}
}

export function skip(delta) {
	if (!player.queue.length) return;
	markUserGesture();
	const next = (player.index + delta + player.queue.length) % player.queue.length;
	playFromQueue(player.queue, next);
}

export function seekRatio(ratio) {
	const clamped = Math.min(1, Math.max(0, ratio));
	if (player.mode === 'preview' && previewAudio?.duration) {
		previewAudio.currentTime = clamped * previewAudio.duration;
	} else if (player.mode === 'sdk' && sdkPlayer) {
		sdkPlayer.getCurrentState().then((state) => {
			if (state) sdkPlayer.seek(clamped * state.duration);
		});
	}
}
