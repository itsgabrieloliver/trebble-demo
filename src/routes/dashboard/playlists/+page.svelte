<script>
	import ArtistGridItem from '$lib/components/ArtistGridItem.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Button from '$lib/components/Button.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	let { data } = $props();

	let filter = $state('all');

	const mine = $derived(data.playlists.filter((p) => !p.isSpotifyOwned));
	const editorial = $derived(data.playlists.filter((p) => p.isSpotifyOwned));
	const shown = $derived(
		filter === 'mine' ? mine : filter === 'spotify' ? editorial : data.playlists
	);
	const feature = $derived(mine[0] || data.playlists[0] || null);
	const totalTracks = $derived(data.playlists.reduce((n, p) => n + (p.trackCount || 0), 0));
</script>

<svelte:head><title>Playlists, Trebble</title></svelte:head>

{#if feature}
	<section
		class="hero"
		style={`--hero-art: url('${feature.art || `https://picsum.photos/seed/${feature.id}/600/600`}')`}
	>
		<div class="hero-inner">
			<img
				class="hero-cover"
				src={feature.art || `https://picsum.photos/seed/${feature.id}/600/600`}
				alt=""
			/>
			<div class="hero-copy">
				<span class="ui-label accent">Playlist</span>
				<h1>{feature.name}</h1>
				<p class="hero-sub">
					{feature.trackCount} tracks{feature.ownerName ? ` · ${feature.ownerName}` : ''}
				</p>
				<Button href={`/dashboard/playlists/${feature.id}`}>Open playlist</Button>
			</div>
		</div>
	</section>
{:else}
	<header class="page-head">
		<h1>Playlists</h1>
		<p class="meta">Your Spotify playlists appear here once you connect.</p>
	</header>
{/if}

<div class="body">
	{#if data.error}
		<p class="error-note" role="alert">{data.error}</p>
	{/if}

	<div class="bar">
		<div>
			<h2>Everything in your library</h2>
			<p class="meta">{data.playlists.length} playlists · {totalTracks} tracks total</p>
		</div>
		<Tabs
			items={[
				{ value: 'all', label: 'All', count: data.playlists.length },
				{ value: 'mine', label: 'Yours', count: mine.length },
				{ value: 'spotify', label: 'Editorial', count: editorial.length }
			]}
			value={filter}
			onchange={(v) => (filter = v)}
		/>
	</div>

	{#if shown.length}
		<div class="grid-media">
			{#each shown as pl (pl.id)}
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
	{:else if data.connected}
		<EmptyState
			title="No playlists in this view"
			description="Switch the filter above, or make a playlist in Spotify and it shows up here after a reload."
			icon="▤"
		>
			{#snippet action()}
				<Button size="sm" variant="secondary" onclick={() => (filter = 'all')}>Show all</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<EmptyState
			title="Connect Spotify to see your playlists"
			description="Trebble reads your playlists with your permission and never changes them."
			icon="▤"
		>
			{#snippet action()}
				<Button href="/auth/spotify" size="sm">Connect Spotify</Button>
			{/snippet}
		</EmptyState>
	{/if}

	<p class="meta foot-note">
		Spotify blocks third-party apps from reading tracks inside its own editorial playlists such as
		Discover Weekly and Release Radar. Those are tagged so an empty track list is never a surprise.
	</p>
</div>

<style>
	.hero {
		position: relative;
		padding: var(--space-12) var(--space-10);
		border-bottom: 1px solid var(--border);
		overflow: hidden;
		min-height: 20rem;
		display: flex;
		align-items: flex-end;
	}
	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: var(--hero-art);
		background-size: cover;
		background-position: center;
		filter: blur(28px) saturate(1.1);
		transform: scale(1.15);
		opacity: 0.45;
	}
	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(15, 15, 15, 0.35) 0%, rgba(15, 15, 15, 0.92) 100%);
	}
	.hero-inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		gap: var(--space-10);
		width: 100%;
		max-width: var(--container);
		margin: 0 auto;
	}
	.hero-cover {
		width: 200px;
		height: 200px;
		flex: none;
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
	.hero-copy h1 {
		font-size: var(--text-hero);
		line-height: 1.1;
	}
	.hero-sub {
		font-family: var(--font-mono);
		font-size: var(--text-base);
		color: var(--muted);
	}
	@media (max-width: 768px) {
		.hero {
			padding: var(--space-10) var(--space-6);
			min-height: 0;
		}
		.hero-inner {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-6);
		}
		.hero-cover {
			width: 130px;
			height: 130px;
		}
		.hero-copy h1 {
			font-size: 1.8rem;
		}
	}

	.body {
		display: grid;
		gap: var(--space-9);
		padding: var(--space-11) var(--space-10);
		max-width: var(--container);
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
		}
	}

	.bar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-6);
		flex-wrap: wrap;
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--border);
	}
	.foot-note {
		max-width: 70ch;
		line-height: 1.6;
	}
</style>
