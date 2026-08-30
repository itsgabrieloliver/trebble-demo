<script>
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import { api, player, playFromQueue, markUserGesture } from '$lib/player.svelte.js';

	let { data } = $props();

	let shares = $state([...data.shares]);
	let refreshing = $state(false);
	let notice = $state(null);
	let commentDrafts = $state({});

	$effect(() => {
		shares = [...data.shares];
	});

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
			notice = err.message || 'Could not react to that share.';
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
			notice = err.message || 'Could not delete that share.';
		}
	}
</script>

<svelte:head><title>Feed, Studio 6A</title></svelte:head>

<header class="page-head">
	<div class="head-row">
		<div>
			<h1>Feed</h1>
			<p class="meta">Tracks people here shared, newest first</p>
		</div>
		<Button variant="secondary" size="sm" disabled={refreshing} onclick={refresh}>
			{refreshing ? 'Refreshing' : 'Refresh'}
		</Button>
	</div>
</header>

<div class="body">
	{#if data.error}
		<p class="error-note" role="alert">{data.error}</p>
	{/if}
	{#if notice}
		<p class="error-note" role="alert">{notice}</p>
	{/if}

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
						{#if share.canDelete}
							<button type="button" class="del" onclick={() => remove(share)}>Delete</button>
						{/if}
					</header>

					{#if share.caption}
						<p class="caption">{share.caption}</p>
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
			title="No shares yet"
			description="Share a track from your library or any playlist and it lands here, ready for reactions and comments."
			icon="◎"
		>
			{#snippet action()}
				<Button href="/dashboard/library" size="sm">Go to library</Button>
			{/snippet}
		</EmptyState>
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
		padding: var(--space-10);
		max-width: 44rem;
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
			max-width: none;
		}
	}

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
