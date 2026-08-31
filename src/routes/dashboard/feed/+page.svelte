<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import EffectMedia from '$lib/components/EffectMedia.svelte';
	import { EFFECTS } from '$lib/effects.js';
	import {
		IMAGE_TYPES,
		VIDEO_TYPES,
		MAX_IMAGE_BYTES,
		MAX_VIDEO_BYTES,
		MAX_VIDEO_SECONDS,
		mediaKindOf
	} from '$lib/media.js';
	import { api, player, playFromQueue, markUserGesture } from '$lib/player.svelte.js';

	let { data } = $props();

	let shares = $state([...data.shares]);
	let refreshing = $state(false);
	let notice = $state(null);
	let commentDrafts = $state({});

	// Composer state
	let tracks = $state(null);
	let tracksLoading = $state(false);
	let trackQuery = $state('');
	let pickedTrack = $state(null);
	let mediaFile = $state(null);
	let mediaUrl = $state(null);
	let mediaType = $state(null);
	let mediaError = $state(null);
	let effect = $state('none');
	let caption = $state('');
	let posting = $state(false);
	let fileInput = $state(null);

	const ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(',');

	// The Spotify OAuth callback redirects to /dashboard, which lands here.
	const spotifyParam = $derived($page.url.searchParams.get('spotify'));
	const spotifyReason = $derived($page.url.searchParams.get('reason'));

	$effect(() => {
		shares = [...data.shares];
	});

	onMount(() => {
		loadTracks();
		return () => {
			if (mediaUrl) URL.revokeObjectURL(mediaUrl);
		};
	});

	const trackMatches = $derived.by(() => {
		if (!tracks) return [];
		const q = trackQuery.trim().toLowerCase();
		if (!q) return tracks.slice(0, 5);
		return tracks
			.filter(
				(t) =>
					String(t.title || '').toLowerCase().includes(q) ||
					String(t.artist || '').toLowerCase().includes(q)
			)
			.slice(0, 6);
	});

	async function loadTracks() {
		if (tracks || tracksLoading) return;
		tracksLoading = true;
		try {
			const res = await api('/api/tracks');
			tracks = res.tracks || [];
		} catch (err) {
			notice = err.message || 'Could not load your tracks for the composer.';
		} finally {
			tracksLoading = false;
		}
	}

	function pick(track) {
		pickedTrack = track;
		trackQuery = '';
	}

	function clearMedia(resetError = true) {
		if (mediaUrl) URL.revokeObjectURL(mediaUrl);
		mediaFile = null;
		mediaUrl = null;
		mediaType = null;
		effect = 'none';
		if (resetError) mediaError = null;
		if (fileInput) fileInput.value = '';
	}

	function onFile(event) {
		const file = event.currentTarget.files?.[0];
		clearMedia();
		if (!file) return;
		const kind = mediaKindOf(file.type);
		if (!kind) {
			mediaError = 'That file type is not supported. Use jpeg, png, webp, gif, mp4 or webm.';
			return;
		}
		const cap = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
		if (file.size > cap) {
			mediaError = `That ${kind} is ${(file.size / 1048576).toFixed(1)}MB, the cap is ${Math.round(cap / 1048576)}MB.`;
			if (fileInput) fileInput.value = '';
			return;
		}
		mediaFile = file;
		mediaType = kind;
		mediaUrl = URL.createObjectURL(file);
	}

	function onPreviewMeta(event) {
		const d = event.currentTarget?.duration;
		if (mediaType === 'video' && Number.isFinite(d) && d > MAX_VIDEO_SECONDS + 1) {
			mediaError = `That clip runs ${Math.round(d)}s, the cap is ${MAX_VIDEO_SECONDS}s. Trim it and try again.`;
			clearMedia(false);
		}
	}

	async function post() {
		if (!pickedTrack) {
			notice = 'Pick a track first, every post is built around one.';
			return;
		}
		posting = true;
		notice = null;
		try {
			let mediaId = null;
			if (mediaFile) {
				const form = new FormData();
				form.append('file', mediaFile);
				const res = await fetch('/api/media', {
					method: 'POST',
					credentials: 'same-origin',
					body: form
				});
				const body = await res.json().catch(() => null);
				if (!res.ok) throw new Error(body?.error || 'Could not upload that file.');
				mediaId = body.mediaId;
			}
			const res = await api('/api/shares', {
				method: 'POST',
				body: JSON.stringify({
					uri: pickedTrack.uri,
					title: pickedTrack.title,
					artist: pickedTrack.artist,
					art: pickedTrack.art,
					caption,
					mediaId,
					mediaType: mediaId ? mediaType : null,
					effect: mediaId ? effect : null
				})
			});
			shares = [res.share, ...shares];
			pickedTrack = null;
			caption = '';
			clearMedia();
		} catch (err) {
			notice = err.message || 'Could not publish that post.';
		} finally {
			posting = false;
		}
	}

	function timeAgo(iso) {
		const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function playShare(share) {
		markUserGesture();
		playFromQueue([share.track], 0, `share:${share.id}`);
	}

	function replace(updated) {
		shares = shares.map((s) => (s.id === updated.id ? updated : s));
	}

	async function refresh() {
		refreshing = true;
		notice = null;
		try {
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	}

	async function react(share) {
		try {
			const res = await api(`/api/shares/${encodeURIComponent(share.id)}/react`, { method: 'POST' });
			replace(res.share);
		} catch (err) {
			notice = err.message || 'Could not react to that post.';
		}
	}

	async function comment(share) {
		const text = (commentDrafts[share.id] || '').trim();
		if (!text) return;
		try {
			const res = await api(`/api/shares/${encodeURIComponent(share.id)}/comments`, {
				method: 'POST',
				body: JSON.stringify({ text })
			});
			replace(res.share);
			commentDrafts = { ...commentDrafts, [share.id]: '' };
		} catch (err) {
			notice = err.message || 'Could not post that comment.';
		}
	}

	async function remove(share) {
		try {
			await api(`/api/shares/${encodeURIComponent(share.id)}`, { method: 'DELETE' });
			shares = shares.filter((s) => s.id !== share.id);
		} catch (err) {
			notice = err.message || 'Could not delete that post.';
		}
	}
</script>

<svelte:head><title>Feed, Studio 6A</title></svelte:head>

<header class="page-head">
	<div class="head-row">
		<div>
			<h1>Feed</h1>
			<p class="meta">Moments people posted around what they are hearing</p>
		</div>
		<Button variant="secondary" size="sm" disabled={refreshing} onclick={refresh}>
			{refreshing ? 'Refreshing' : 'Refresh'}
		</Button>
	</div>
</header>

<div class="body">
	{#if spotifyParam === 'connected'}
		<p class="ok-note">Spotify connected. Your tracks are live in the composer.</p>
	{:else if spotifyParam === 'error'}
		<p class="error-note" role="alert">
			{spotifyReason || 'Could not connect to Spotify. Try again.'}
		</p>
	{/if}
	{#if data.error}
		<p class="error-note" role="alert">{data.error}</p>
	{/if}
	{#if notice}
		<p class="error-note" role="alert">{notice}</p>
	{/if}

	<section class="composer" aria-label="New post">
		{#if !pickedTrack}
			<div class="picker">
				<label class="field">
					<span>New post, start with the track</span>
					<input
						class="input"
						type="search"
						placeholder="Search your top tracks by title or artist"
						bind:value={trackQuery}
						onfocus={loadTracks}
					/>
				</label>
				{#if tracksLoading}
					<Skeleton rows={2} />
				{:else if trackMatches.length}
					<ul class="matches">
						{#each trackMatches as t, i (t.uri || t.title + i)}
							<li>
								<button type="button" class="match" onclick={() => pick(t)}>
									<img src={t.art} alt="" loading="lazy" />
									<span class="m-meta">
										<span class="m-title">{t.title}</span>
										<span class="meta">{t.artist}</span>
									</span>
									<span class="meta pick-hint">Pick</span>
								</button>
							</li>
						{/each}
					</ul>
				{:else if trackQuery.trim()}
					<p class="meta">No track matches that. Try another title or artist.</p>
				{:else}
					<p class="meta">Every post is built around a track. Search above to pick one.</p>
				{/if}
			</div>
		{:else}
			<div class="draft">
				<div class="picked">
					<img src={pickedTrack.art} alt="" />
					<span class="m-meta">
						<span class="m-title">{pickedTrack.title}</span>
						<span class="meta">{pickedTrack.artist}</span>
					</span>
					<button type="button" class="chip" onclick={() => (pickedTrack = null)}>
						Change track
					</button>
				</div>

				{#if mediaError}
					<p class="error-note" role="alert">{mediaError}</p>
				{/if}

				{#if mediaUrl}
					<div class="preview">
						<EffectMedia src={mediaUrl} type={mediaType} {effect} alt="Preview of your upload" onmeta={onPreviewMeta} />
						<div class="fx-row" role="radiogroup" aria-label="Effect">
							{#each EFFECTS as fx (fx.id)}
								<button
									type="button"
									class="chip"
									class:on={effect === fx.id}
									role="radio"
									aria-checked={effect === fx.id}
									title={fx.hint}
									onclick={() => (effect = fx.id)}
								>
									{fx.label}
								</button>
							{/each}
						</div>
						<button type="button" class="chip danger" onclick={() => clearMedia()}>
							Remove {mediaType}
						</button>
					</div>
				{:else}
					<label class="attach">
						<input
							type="file"
							accept={ACCEPT}
							bind:this={fileInput}
							onchange={onFile}
							class="visually-hidden"
						/>
						<span class="attach-cta">Add a photo or clip</span>
						<span class="meta">jpeg, png, webp, gif up to 8MB · mp4, webm up to 25MB / {MAX_VIDEO_SECONDS}s</span>
					</label>
				{/if}

				<div class="send">
					<label class="visually-hidden" for="caption">Caption</label>
					<input
						id="caption"
						class="input"
						type="text"
						maxlength="280"
						bind:value={caption}
						placeholder="Say what this moment sounds like (optional)"
						onkeydown={(e) => e.key === 'Enter' && post()}
					/>
					<Button disabled={posting} onclick={post}>{posting ? 'Posting' : 'Post'}</Button>
				</div>
			</div>
		{/if}
	</section>

	{#if refreshing && !shares.length}
		<Skeleton rows={3} />
	{:else if shares.length}
		<ol class="feed">
			{#each shares as share (share.id)}
				<li class="post">
					<header class="post-head">
						<Avatar name={share.displayName} src={share.avatar} size="md" shape="circle" />
						<div class="who">
							<span class="name">{share.displayName}</span>
							<span class="meta">{timeAgo(share.createdAt)}</span>
						</div>
						{#if share.media && share.media.effect !== 'none'}
							<span class="fx-tag">{share.media.effect}</span>
						{/if}
						{#if share.canDelete}
							<button type="button" class="del" onclick={() => remove(share)}>Delete</button>
						{/if}
					</header>

					{#if share.caption}
						<p class="caption">{share.caption}</p>
					{/if}

					{#if share.media}
						<EffectMedia
							src={share.media.url}
							type={share.media.type}
							effect={share.media.effect}
							alt={`Post by ${share.displayName}`}
						/>
					{/if}

					<button
						type="button"
						class="track"
						class:playing={player.queueId === `share:${share.id}`}
						onclick={() => playShare(share)}
					>
						<img
							src={share.track.art || 'https://picsum.photos/seed/studio6a/300/300'}
							alt=""
							loading="lazy"
						/>
						<span class="track-meta">
							<span class="t-title">{share.track.title}</span>
							<span class="t-artist">{share.track.artist}</span>
						</span>
						<span class="t-play" aria-hidden="true">▶</span>
					</button>

					<div class="actions">
						<button
							type="button"
							class="react"
							class:on={share.reactedByMe}
							onclick={() => react(share)}
							aria-pressed={share.reactedByMe}
						>
							★ <span>{share.reactionCount}</span>
						</button>
						<span class="meta">
							{share.comments.length}
							{share.comments.length === 1 ? 'comment' : 'comments'}
						</span>
					</div>

					{#if share.comments.length}
						<ol class="comments">
							{#each share.comments as c, i (c.createdAt + i)}
								<li>
									<span class="c-name">{c.displayName}</span>
									<span class="c-text">{c.text}</span>
									<span class="meta">{timeAgo(c.createdAt)}</span>
								</li>
							{/each}
						</ol>
					{/if}

					<div class="comment-form">
						<label class="visually-hidden" for={`c-${share.id}`}>Add a comment</label>
						<input
							id={`c-${share.id}`}
							class="input"
							type="text"
							maxlength="500"
							placeholder="Add a comment"
							value={commentDrafts[share.id] || ''}
							oninput={(e) => (commentDrafts = { ...commentDrafts, [share.id]: e.currentTarget.value })}
							onkeydown={(e) => e.key === 'Enter' && comment(share)}
						/>
						<Button size="sm" variant="secondary" onclick={() => comment(share)}>Post</Button>
					</div>
				</li>
			{/each}
		</ol>
	{:else}
		<EmptyState
			title="Nothing posted yet"
			description="Pick a track above, attach a photo or a short clip, put an effect on it and post the first moment."
			icon="◎"
		/>
	{/if}
</div>

<style>
	.head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		flex-wrap: wrap;
	}
	.body {
		display: grid;
		gap: var(--space-8);
		padding: var(--space-10);
		max-width: 44rem;
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
			max-width: none;
		}
	}

	/* Composer ---------------------------------------------------------------*/
	.composer {
		display: grid;
		gap: var(--space-6);
		padding: var(--space-8);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius);
	}
	.picker {
		display: grid;
		gap: var(--space-5);
	}
	.matches {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
	}
	.match {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		width: 100%;
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.match:hover {
		background: var(--surface-alt);
		border-color: var(--border-strong);
	}
	.match img {
		width: 2.25rem;
		height: 2.25rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.m-meta {
		flex: 1;
		display: grid;
		min-width: 0;
	}
	.m-title {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pick-hint {
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.draft {
		display: grid;
		gap: var(--space-6);
	}
	.picked {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}
	.picked img {
		width: 2.75rem;
		height: 2.75rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	.chip {
		min-height: 34px;
		padding: 0 var(--space-5);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		transition:
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease,
			background var(--dur-fast) ease;
	}
	.chip:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.chip.on {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--surface-alt);
	}
	.chip.danger:hover {
		border-color: var(--danger);
		color: var(--danger);
	}

	.attach {
		display: grid;
		gap: var(--space-1);
		justify-items: start;
		padding: var(--space-6);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		cursor: pointer;
		transition: border-color var(--dur) var(--ease);
	}
	.attach:hover,
	.attach:focus-within {
		border-color: var(--accent);
	}
	.attach-cta {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.preview {
		display: grid;
		gap: var(--space-5);
		justify-items: start;
	}
	.fx-row {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.send {
		display: flex;
		gap: var(--space-4);
	}
	.send .input {
		flex: 1;
	}

	/* Posts ------------------------------------------------------------------*/
	.feed {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-8);
	}
	.post {
		display: grid;
		gap: var(--space-5);
		padding: var(--space-8);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition: border-color var(--dur) var(--ease);
	}
	.post:hover {
		border-color: var(--border-strong);
	}

	.post-head {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}
	.who {
		flex: 1;
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}
	.name {
		font-weight: 600;
	}
	.fx-tag {
		flex: none;
		padding: 0.15rem var(--space-2);
		border: 1px solid var(--accent);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.del {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		min-height: 32px;
		padding: 0 var(--space-4);
		cursor: pointer;
		transition:
			color var(--dur-fast) ease,
			border-color var(--dur-fast) ease;
	}
	.del:hover {
		color: var(--danger);
		border-color: var(--danger);
	}

	.caption {
		color: var(--fg);
	}

	.track {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		width: 100%;
		padding: var(--space-4);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			background var(--dur) var(--ease),
			transform var(--dur) var(--ease);
	}
	.track:hover {
		background: var(--surface-alt);
		transform: translateY(-2px);
	}
	.track.playing {
		border-left: 2px solid var(--accent);
	}
	.track img {
		width: 3.5rem;
		height: 3.5rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.track-meta {
		flex: 1;
		display: grid;
		min-width: 0;
	}
	.t-title {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.playing .t-title {
		color: var(--accent);
	}
	.t-artist {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
	}
	.t-play {
		flex: none;
		width: 2.1rem;
		height: 2.1rem;
		display: grid;
		place-items: center;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
	.react {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 34px;
		padding: 0 var(--space-5);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		cursor: pointer;
		transition:
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease;
	}
	.react:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.react.on {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--surface-alt);
	}
	.react span {
		font-weight: 700;
	}

	.comments {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
		border-left: 1px solid var(--border);
		padding-left: var(--space-5);
	}
	.comments li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--space-4);
		align-items: baseline;
		font-size: var(--text-xs);
	}
	.c-name {
		font-family: var(--font-mono);
		color: var(--accent);
	}
	.c-text {
		color: var(--fg);
		font-size: var(--text-base);
	}

	.comment-form {
		display: flex;
		gap: var(--space-4);
	}
	.comment-form .input {
		flex: 1;
	}
</style>
