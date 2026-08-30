<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import NavItem from '$lib/components/NavItem.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import NowPlayingBar from '$lib/components/NowPlayingBar.svelte';
	import { setupPlayback, teardownPlayback, player } from '$lib/player.svelte.js';

	let { data, children } = $props();

	const nav = [
		{ href: '/dashboard', label: 'Overview', icon: 'home' },
		{ href: '/dashboard/library', label: 'Library', icon: 'library' },
		{ href: '/dashboard/playlists', label: 'Playlists', icon: 'playlists' },
		{ href: '/dashboard/feed', label: 'Feed', icon: 'feed' },
		{ href: '/dashboard/activity', label: 'Activity', icon: 'activity' },
		{ href: '/dashboard/profile', label: 'Profile', icon: 'profile' }
	];

	const path = $derived($page.url.pathname.replace(/\/$/, '') || '/dashboard');

	function isActive(href) {
		return href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);
	}

	onMount(() => {
		setupPlayback();
		return teardownPlayback;
	});

	async function logout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
		} catch {
			// leaving anyway
		}
		await goto('/', { invalidateAll: true });
	}
</script>

<div class="shell">
	<aside class="rail">
		<a class="brand" href="/">
			<span class="mark" aria-hidden="true">6A</span>
			<span class="brand-name">Studio 6A</span>
		</a>

		<nav aria-label="Dashboard">
			{#each nav as item (item.href)}
				<NavItem href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
			{/each}
		</nav>

		<div class="rail-foot">
			<p class="meta cap">{player.capability}</p>
			{#if !data.spotify.connected}
				<Button href="/auth/spotify" size="sm" block>Connect Spotify</Button>
			{:else}
				<Button href="/auth/spotify" variant="secondary" size="sm" block>Reconnect Spotify</Button>
			{/if}
			<div class="who">
				<Avatar name={data.user.displayName} size="sm" />
				<span class="who-name">{data.user.displayName}</span>
			</div>
			<Button variant="quiet" size="sm" block onclick={logout}>Log out</Button>
		</div>
	</aside>

	<main class="main">
		{@render children()}
	</main>
</div>

<NowPlayingBar />

<style>
	.shell {
		display: grid;
		grid-template-columns: var(--rail-w) minmax(0, 1fr);
		min-height: 100vh;
		padding-bottom: var(--player-h);
	}

	.rail {
		position: sticky;
		top: 0;
		align-self: start;
		height: 100vh;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-5);
		background: var(--surface);
		border-right: 1px solid var(--border);
		overflow-y: auto;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0 var(--space-5);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		flex: none;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--accent-fg);
		font-size: var(--text-xs);
	}

	nav {
		display: grid;
		gap: var(--space-0);
		align-content: start;
	}

	.rail-foot {
		display: grid;
		gap: var(--space-4);
	}
	.cap {
		padding: 0 var(--space-5);
		line-height: 1.4;
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		border-top: 1px solid var(--border);
	}
	.who-name {
		font-size: var(--text-base);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.main {
		min-width: 0;
	}

	@media (max-width: 900px) {
		.shell {
			grid-template-columns: 3.5rem minmax(0, 1fr);
		}
		.rail {
			padding: var(--space-6) var(--space-1);
			gap: var(--space-6);
		}
		.brand {
			justify-content: center;
			padding: 0;
		}
		.brand-name,
		.cap,
		.who-name {
			display: none;
		}
		.who {
			justify-content: center;
			padding: var(--space-4) 0;
		}
	}
</style>
