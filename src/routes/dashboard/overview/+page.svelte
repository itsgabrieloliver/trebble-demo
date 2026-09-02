<script>
	import StatTile from '$lib/components/StatTile.svelte';
	import ArtistGridItem from '$lib/components/ArtistGridItem.svelte';
	import TrackRow from '$lib/components/TrackRow.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { player, playFromQueue, markUserGesture } from '$lib/player.svelte.js';

	let { data } = $props();

	const QUEUE_ID = 'overview-top';
	const hero = $derived(data.tracks[0] || null);

	function play(index) {
		markUserGesture();
		playFromQueue(data.tracks, index, QUEUE_ID);
	}

	function timeAgo(iso) {
		const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}
</script>

<svelte:head><title>Listening, Trebble</title></svelte:head>

<header class="page-head">
	<div class="head-row">
		<div>
			<h1>Listening</h1>
			<p class="meta">
				{data.connected
					? data.usingLiveData
						? 'Spotify connected, showing your live listening'
						: 'Spotify connected, live data unavailable right now'
					: 'Not connected yet, showing sample picks'}
			</p>
		</div>
		{#if !data.connected}
			<Button href="/auth/spotify">Connect Spotify</Button>
		{/if}
	</div>
</header>

<div class="body">
	{#if data.loadError}
		<p class="error-note" role="alert">{data.loadError}</p>
	{/if}

	{#if hero}
		<section class="hero">
			<img class="hero-art" src={hero.art} alt="" />
			<div class="hero-copy">
				<Badge tone="accent">Your number one</Badge>
				<h2>{hero.title}</h2>
				<p class="hero-artist">{hero.artist}</p>
				<p class="meta hero-note">
					Pulled from your Spotify top tracks. Post it to the feed with a photo or a clip and let
					people react.
				</p>
				<div class="hero-actions">
					<Button href="/dashboard/feed">Post to feed</Button>
					<Button variant="secondary" onclick={() => play(0)}>Play</Button>
				</div>
			</div>
		</section>
	{/if}

	<section class="stats">
		<StatTile label="Tracks in rotation" value={data.tracks.length} />
		<StatTile
			label="Playlists"
			value={data.playlistTotal}
			hint={data.connected ? null : 'Connect Spotify'}
		/>
		<StatTile label="Posts on the feed" value={data.shareTotal} />
		<StatTile label="Reactions received" value={data.reactionTotal} />
	</section>

	<section class="section">
		<div class="section-head">
			<div>
				<h2>Your vibe right now</h2>
				<p>Top tracks, newest ranking from Spotify</p>
			</div>
			<a class="more" href="/dashboard/library">Open library</a>
		</div>
		<ol class="track-list">
			{#each data.tracks as track, i (track.uri || track.title + i)}
				<TrackRow
					{track}
					index={i}
					playing={player.queueId === QUEUE_ID && player.index === i}
					onplay={play}
				/>
			{/each}
		</ol>
	</section>

	<section class="section">
		<div class="section-head">
			<div>
				<h2>Your playlists</h2>
				<p>{data.playlistTotal} in your Spotify library</p>
			</div>
			<a class="more" href="/dashboard/playlists">See all</a>
		</div>
		{#if data.playlists.length}
			<div class="grid-media">
				{#each data.playlists as pl (pl.id)}
					<ArtistGridItem
						title={pl.name}
						sub={`${pl.trackCount} tracks`}
						art={pl.art}
						seed={pl.id}
						href={`/dashboard/playlists/${pl.id}`}
						tag={pl.isSpotifyOwned ? 'spotify' : null}
					/>
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No playlists loaded"
				description="Connect your Spotify account and your own playlists appear here with cover art and track counts."
				icon="▤"
			>
				{#snippet action()}
					<Button href="/auth/spotify" size="sm">Connect Spotify</Button>
				{/snippet}
			</EmptyState>
		{/if}
	</section>

	<section class="section">
		<div class="section-head">
			<div>
				<h2>Recent posts</h2>
				<p>The latest moments from everyone here</p>
			</div>
			<a class="more" href="/dashboard/feed">Open feed</a>
		</div>
		{#if data.recentShares.length}
			<ul class="recent">
				{#each data.recentShares as share (share.id)}
					<li>
						<Avatar name={share.displayName} src={share.avatar} size="md" />
						<div class="recent-copy">
							<p class="recent-line">
								<strong>{share.displayName}</strong> posted
								<span class="accent">{share.track.title}</span>
								by {share.track.artist}
							</p>
							<span class="meta">{timeAgo(share.createdAt)} · {share.reactionCount} reactions</span>
						</div>
						{#if share.track.art}
							<img class="recent-art" src={share.track.art} alt="" />
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<EmptyState
				title="Nothing posted yet"
				description="Post a track from the feed with a photo or a clip and it shows up here for everyone."
				icon="◎"
			>
				{#snippet action()}
					<Button href="/dashboard/feed" size="sm">Open feed</Button>
				{/snippet}
			</EmptyState>
		{/if}
	</section>
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
		gap: var(--space-10);
		padding: var(--space-10);
		max-width: var(--container);
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
		}
	}

	.hero {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr);
		gap: var(--space-10);
		align-items: center;
		padding: var(--space-10);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background:
			radial-gradient(40rem 20rem at 100% 0%, rgba(212, 165, 116, 0.14), transparent 60%),
			var(--surface);
	}
	@media (max-width: 768px) {
		.hero {
			grid-template-columns: 1fr;
			gap: var(--space-8);
			padding: var(--space-8);
		}
	}
	.hero-art {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
	}
	.hero-copy {
		display: grid;
		gap: var(--space-4);
		justify-items: start;
	}
	.hero-copy h2 {
		font-size: var(--text-display);
		font-weight: 700;
	}
	.hero-artist {
		font-family: var(--font-mono);
		color: var(--muted);
	}
	.hero-note {
		max-width: 60ch;
	}
	.hero-actions {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: var(--space-6);
	}

	.section {
		padding: 0;
	}
	.more {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}
	.more:hover {
		color: var(--accent);
	}

	.track-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
	}

	.recent {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}
	.recent li {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-5);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition: background var(--dur) var(--ease);
	}
	.recent li:hover {
		background: var(--surface-alt);
	}
	.recent-copy {
		flex: 1;
		min-width: 0;
		display: grid;
		gap: 0.1rem;
	}
	.recent-line {
		font-size: var(--text-base);
	}
	.recent-art {
		width: 2.75rem;
		height: 2.75rem;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
</style>
