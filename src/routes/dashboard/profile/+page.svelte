<script>
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import StatTile from '$lib/components/StatTile.svelte';
	import ArtistGridItem from '$lib/components/ArtistGridItem.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	let { data } = $props();

	let tab = $state('artists');

	function formatDate(iso) {
		if (!iso) return 'unknown';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head><title>Profile, Trebble</title></svelte:head>

<section class="cover">
	<div class="cover-inner">
		<Avatar name={data.user?.displayName ?? ''} size="xl" shape="circle" />
		<div class="who">
			<span class="ui-label accent">Your profile</span>
			<h1>{data.user?.displayName}</h1>
			<p class="meta">{data.user?.email}</p>
			<div class="chips">
				<Badge tone={data.connected ? 'accent' : 'neutral'}>
					{data.connected ? 'Spotify connected' : 'Spotify not connected'}
				</Badge>
				{#if data.spotifyProduct}
					<Badge>{data.spotifyProduct}</Badge>
				{/if}
				<Badge>{data.storage}</Badge>
			</div>
		</div>
		<div class="cover-actions">
			<Button href="/auth/spotify" variant={data.connected ? 'secondary' : 'primary'}>
				{data.connected ? 'Reconnect Spotify' : 'Connect Spotify'}
			</Button>
		</div>
	</div>
</section>

<div class="body">
	<section class="stat-grid">
		<StatTile label="Tracks shared" value={data.stats.shares} />
		<StatTile label="Recommendations" value={data.stats.recommendations} />
		<StatTile label="Reactions received" value={data.stats.reactions} />
		<StatTile label="Playlists" value={data.playlistCount} />
	</section>

	<hr class="divider" />

	<div class="tabbar">
		<Tabs
			items={[
				{ value: 'artists', label: 'Top artists', count: data.topArtists.length },
				{ value: 'shares', label: 'Your shares', count: data.stats.shares },
				{ value: 'about', label: 'Account' }
			]}
			value={tab}
			onchange={(v) => (tab = v)}
		/>
	</div>

	{#if tab === 'artists'}
		{#if data.topArtists.length}
			<div class="grid-media">
				{#each data.topArtists as artist (artist.name)}
					<ArtistGridItem
						title={artist.name}
						sub={`${artist.plays} in your top tracks`}
						art={artist.art}
						seed={artist.name}
						href="/dashboard/library"
					/>
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No artists yet"
				description="Connect Spotify and your most played artists are worked out from your top tracks."
				icon="◐"
			>
				{#snippet action()}
					<Button href="/auth/spotify" size="sm">Connect Spotify</Button>
				{/snippet}
			</EmptyState>
		{/if}
	{:else if tab === 'shares'}
		{#if data.myShares.length}
			<ul class="shares">
				{#each data.myShares as share (share.id)}
					<li>
						<img src={share.track.art || `https://picsum.photos/seed/${share.id}/200/200`} alt="" />
						<div class="s-copy">
							<span class="s-title">{share.track.title}</span>
							<span class="meta">{share.track.artist}</span>
							{#if share.caption}<p class="s-caption">{share.caption}</p>{/if}
						</div>
						<span class="meta s-count">
							{share.reactionCount} reactions · {share.comments.length} comments
						</span>
					</li>
				{/each}
			</ul>
			<a class="more" href="/dashboard/feed">See everything in the feed</a>
		{:else}
			<EmptyState
				title="You have not shared a track yet"
				description="Anything you share from your library or a playlist shows up here with its reactions and comments."
				icon="◎"
			>
				{#snippet action()}
					<Button href="/dashboard/library" size="sm">Go to library</Button>
				{/snippet}
			</EmptyState>
		{/if}
	{:else}
		<dl class="about">
			<div><dt>Display name</dt><dd>{data.user?.displayName}</dd></div>
			<div><dt>Email</dt><dd>{data.user?.email}</dd></div>
			<div><dt>Account created</dt><dd>{formatDate(data.createdAt)}</dd></div>
			<div>
				<dt>Spotify</dt>
				<dd>{data.connected ? `Connected ${formatDate(data.connectedAt)}` : 'Not connected'}</dd>
			</div>
			<div><dt>Spotify user id</dt><dd>{data.spotifyUserId || 'unknown'}</dd></div>
			<div><dt>Subscription tier</dt><dd>{data.spotifyProduct || 'unknown'}</dd></div>
			<div><dt>Storage</dt><dd>{data.storage}</dd></div>
			<div><dt>Comments on your shares</dt><dd>{data.stats.comments}</dd></div>
		</dl>
	{/if}
</div>

<style>
	.cover {
		padding: var(--space-12) var(--space-10) var(--space-10);
		border-bottom: 1px solid var(--border);
		background:
			radial-gradient(40rem 20rem at 20% 0%, rgba(212, 165, 116, 0.16), transparent 65%),
			var(--surface);
	}
	.cover-inner {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		max-width: var(--container);
		margin: 0 auto;
		flex-wrap: wrap;
	}
	.who {
		display: grid;
		gap: var(--space-2);
		flex: 1;
		min-width: 12rem;
	}
	.who h1 {
		font-size: var(--text-hero);
		line-height: 1.1;
	}
	.chips {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-top: var(--space-2);
	}
	@media (max-width: 768px) {
		.cover {
			padding: var(--space-10) var(--space-6) var(--space-8);
		}
		.who h1 {
			font-size: 1.8rem;
		}
	}

	.body {
		display: grid;
		gap: var(--space-8);
		padding: var(--space-10);
		max-width: var(--container);
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
		}
	}

	.tabbar {
		display: flex;
	}

	.shares {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}
	.shares li {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-5);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.shares img {
		width: 3rem;
		height: 3rem;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.s-copy {
		flex: 1;
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}
	.s-title {
		font-weight: 600;
	}
	.s-caption {
		color: var(--muted);
		font-size: var(--text-xs);
	}
	.s-count {
		white-space: nowrap;
	}
	.more {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.more:hover {
		color: var(--accent);
	}

	.about {
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-6);
	}
	.about > div {
		padding: var(--space-6);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	dt {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
	dd {
		margin: var(--space-1) 0 0;
		font-size: var(--text-base);
		word-break: break-word;
	}
</style>
