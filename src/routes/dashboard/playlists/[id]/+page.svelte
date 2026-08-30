<script>
	import { page } from '$app/stores';
	import TrackRow from '$lib/components/TrackRow.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { api, player, playFromQueue, markUserGesture } from '$lib/player.svelte.js';

	let { data } = $props();

	const queueId = $derived(`playlist:${$page.params.id}`);
	const cover = $derived(
		data.playlist?.art || `https://picsum.photos/seed/${$page.params.id}/600/600`
	);
	const totalMs = $derived(data.tracks.reduce((n, t) => n + (t.durationMs || 0), 0));
	const runtime = $derived(
		totalMs ? `${Math.round(totalMs / 60000)} min` : `${data.tracks.length} tracks`
	);

	let shareTarget = $state(null);
	let caption = $state('');
	let posting = $state(false);
	let notice = $state(null);
	let noticeTone = $state('ok');

	function play(index) {
		markUserGesture();
		playFromQueue(data.tracks, index, queueId);
	}

	async function postShare() {
		if (!shareTarget) return;
		posting = true;
		try {
			await api('/api/shares', {
				method: 'POST',
				body: JSON.stringify({
					uri: shareTarget.uri,
					title: shareTarget.title,
					artist: shareTarget.artist,
					art: shareTarget.art,
					caption
				})
			});
			notice = `Shared ${shareTarget.title} to the feed.`;
			noticeTone = 'ok';
			shareTarget = null;
			caption = '';
		} catch (err) {
			notice = err.message || 'Could not post that share.';
			noticeTone = 'error';
		} finally {
			posting = false;
		}
	}
</script>

<svelte:head><title>{data.playlist?.name || 'Playlist'}, Studio 6A</title></svelte:head>

<section class="hero" style={`--hero-art: url('${cover}')`}>
	<div class="hero-inner">
		<a class="back" href="/dashboard/playlists">← All playlists</a>
		<div class="hero-grid">
			<img class="cover" src={cover} alt="" />
			<div class="copy">
				<span class="ui-label accent">Playlist</span>
				<h1>{data.playlist?.name || 'Playlist'}</h1>
				<p class="sub">
					{data.playlist?.ownerName ? `${data.playlist.ownerName} · ` : ''}{data.tracks.length} tracks
					· {runtime}
				</p>
				{#if data.playlist?.isSpotifyOwned}
					<Badge>Spotify editorial</Badge>
				{/if}
				{#if data.tracks.length}
					<Button onclick={() => play(0)}>Play from the top</Button>
				{/if}
			</div>
		</div>
	</div>
</section>

<div class="body">
	{#if notice}
		<p class={noticeTone === 'ok' ? 'ok-note' : 'error-note'} role="status">{notice}</p>
	{/if}
	{#if data.error}
		<p class="error-note" role="alert">{data.error}</p>
	{/if}

	{#if shareTarget}
		<div class="composer">
			<img src={shareTarget.art} alt="" />
			<div class="composer-body">
				<p class="composer-title">Share {shareTarget.title}</p>
				<span class="meta">{shareTarget.artist}</span>
				<input
					class="input"
					type="text"
					maxlength="280"
					bind:value={caption}
					placeholder="Say something about this track (optional)"
					onkeydown={(e) => e.key === 'Enter' && postShare()}
				/>
			</div>
			<div class="composer-actions">
				<Button size="sm" disabled={posting} onclick={postShare}>
					{posting ? 'Posting' : 'Share'}
				</Button>
				<Button size="sm" variant="quiet" onclick={() => (shareTarget = null)}>Cancel</Button>
			</div>
		</div>
	{/if}

	{#if data.tracks.length}
		<ol class="track-list">
			{#each data.tracks as track, i (track.uri || track.title + i)}
				<TrackRow
					{track}
					index={i}
					playing={player.queueId === queueId && player.index === i}
					onplay={play}
					onshare={(t) => {
						shareTarget = t;
						caption = '';
						notice = null;
					}}
				/>
			{/each}
		</ol>
	{:else if !data.error}
		<EmptyState
			title="This playlist is empty"
			description="Spotify returned no tracks for this playlist. Add something to it in Spotify and reload this page."
			icon="♪"
		>
			{#snippet action()}
				<Button href="/dashboard/playlists" size="sm" variant="secondary">Back to playlists</Button>
			{/snippet}
		</EmptyState>
	{/if}
</div>

<style>
	.hero {
		position: relative;
		padding: var(--space-8) var(--space-10) var(--space-12);
		border-bottom: 1px solid var(--border);
		overflow: hidden;
	}
	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: var(--hero-art);
		background-size: cover;
		background-position: center;
		filter: blur(30px) saturate(1.1);
		transform: scale(1.15);
		opacity: 0.4;
	}
	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(15, 15, 15, 0.4) 0%, rgba(15, 15, 15, 0.93) 100%);
	}
	.hero-inner {
		position: relative;
		z-index: 1;
		max-width: var(--container);
		margin: 0 auto;
		display: grid;
		gap: var(--space-10);
	}
	.back {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.back:hover {
		color: var(--accent);
	}
	.hero-grid {
		display: flex;
		align-items: flex-end;
		gap: var(--space-10);
	}
	.cover {
		width: 220px;
		height: 220px;
		flex: none;
		object-fit: cover;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
	}
	.copy {
		display: grid;
		gap: var(--space-4);
		justify-items: start;
	}
	.copy h1 {
		font-size: var(--text-hero);
		line-height: 1.1;
	}
	.sub {
		font-family: var(--font-mono);
		font-size: var(--text-base);
		color: var(--muted);
	}
	@media (max-width: 768px) {
		.hero {
			padding: var(--space-6) var(--space-6) var(--space-10);
		}
		.hero-grid {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-6);
		}
		.cover {
			width: 140px;
			height: 140px;
		}
		.copy h1 {
			font-size: 1.8rem;
		}
	}

	.body {
		display: grid;
		gap: var(--space-8);
		padding: var(--space-10);
		max-width: 68rem;
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
		}
	}
	.track-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
	}

	.composer {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-6);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius);
		flex-wrap: wrap;
	}
	.composer img {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.composer-body {
		flex: 1;
		min-width: 14rem;
		display: grid;
		gap: var(--space-2);
	}
	.composer-title {
		font-weight: 600;
	}
	.composer-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
