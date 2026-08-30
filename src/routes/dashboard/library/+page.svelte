<script>
	import TrackRow from '$lib/components/TrackRow.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Button from '$lib/components/Button.svelte';
	import Tabs from '$lib/components/Tabs.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { api, player, playFromQueue, markUserGesture } from '$lib/player.svelte.js';

	let { data } = $props();

	const QUEUE_ID = 'library';

	let filter = $state('all');
	let query = $state('');
	let shareTarget = $state(null);
	let caption = $state('');
	let posting = $state(false);
	let notice = $state(null);
	let noticeTone = $state('ok');

	const filtered = $derived(
		data.tracks.filter((t) => {
			if (filter === 'playable' && !t.uri) return false;
			if (filter === 'preview' && !t.previewUrl) return false;
			if (!query.trim()) return true;
			const q = query.trim().toLowerCase();
			return (
				String(t.title || '')
					.toLowerCase()
					.includes(q) ||
				String(t.artist || '')
					.toLowerCase()
					.includes(q)
			);
		})
	);

	function play(index) {
		markUserGesture();
		playFromQueue(filtered, index, QUEUE_ID);
	}

	function openShare(track) {
		shareTarget = track;
		caption = '';
		notice = null;
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

<svelte:head><title>Library, Studio 6A</title></svelte:head>

<header class="page-head">
	<div class="head-row">
		<div>
			<h1>Library</h1>
			<p class="meta">
				{data.connected
					? data.usingLiveData
						? 'Your top tracks, straight from Spotify'
						: 'Connected, showing sample picks while Spotify is unavailable'
					: 'Sample picks. Connect Spotify to load your own top tracks.'}
			</p>
		</div>
		<div class="head-actions">
			<Button href="/auth/spotify" variant={data.connected ? 'secondary' : 'primary'}>
				{data.connected ? 'Reconnect Spotify' : 'Connect Spotify'}
			</Button>
		</div>
	</div>
</header>

<div class="body">
	{#if data.error}
		<p class="error-note" role="alert">{data.error}</p>
	{/if}
	{#if notice}
		<p class={noticeTone === 'ok' ? 'ok-note' : 'error-note'} role="status">{notice}</p>
	{/if}

	<div class="toolbar">
		<Tabs
			items={[
				{ value: 'all', label: 'All', count: data.tracks.length },
				{ value: 'playable', label: 'Full track', count: data.tracks.filter((t) => t.uri).length },
				{ value: 'preview', label: 'Preview', count: data.tracks.filter((t) => t.previewUrl).length }
			]}
			value={filter}
			onchange={(v) => (filter = v)}
		/>
		<label class="search">
			<span class="visually-hidden">Search your library</span>
			<input class="input" type="search" bind:value={query} placeholder="Search title or artist" />
		</label>
	</div>

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

	{#if filtered.length}
		<ol class="track-list">
			{#each filtered as track, i (track.uri || track.title + i)}
				<TrackRow
					{track}
					index={i}
					playing={player.queueId === QUEUE_ID && player.index === i}
					playable={Boolean(track.uri || track.previewUrl) || !data.connected}
					onplay={play}
					onshare={openShare}
				/>
			{/each}
		</ol>
		<p class="meta count">{filtered.length} of {data.tracks.length} tracks</p>
	{:else}
		<EmptyState
			title="Nothing matches that"
			description="No track in your library matches this filter and search. Clear the search box or switch back to all tracks."
			icon="⌕"
		>
			{#snippet action()}
				<Button
					size="sm"
					variant="secondary"
					onclick={() => {
						query = '';
						filter = 'all';
					}}
				>
					Reset filters
				</Button>
			{/snippet}
		</EmptyState>
	{/if}

	<aside class="hint">
		<Badge tone="accent">Playback</Badge>
		<p class="meta">{player.capability}</p>
	</aside>
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
		max-width: 68rem;
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		flex-wrap: wrap;
	}
	.search {
		flex: 1;
		min-width: 14rem;
		max-width: 22rem;
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

	.track-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
	}
	.count {
		text-align: right;
	}

	.hint {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-5) var(--space-6);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
</style>
