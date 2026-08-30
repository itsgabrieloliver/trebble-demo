<script>
	let { href, label, active = false, icon = null } = $props();
</script>

<a {href} class="nav-item" class:active aria-current={active ? 'page' : undefined} title={label}>
	<span class="icon" aria-hidden="true">
		{#if icon === 'home'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3z" /><path d="M9 21v-6h6v6" /></svg>
		{:else if icon === 'library'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
		{:else if icon === 'playlists'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
		{:else if icon === 'feed'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-11.87 7.82L3 21l1.68-6.13A8.5 8.5 0 1 1 21 11.5Z" /></svg>
		{:else if icon === 'activity'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4" /></svg>
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
		{/if}
	</span>
	<span class="label">{label}</span>
</a>

<style>
	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		min-height: 42px;
		padding: 0 var(--space-5);
		border-left: 2px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		transition:
			background var(--dur) var(--ease),
			color var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.nav-item:hover {
		background: var(--surface-alt);
		color: var(--fg);
	}
	.active {
		border-left-color: var(--accent);
		background: var(--surface-alt);
		color: var(--accent);
	}
	.icon {
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
	}
	.icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	@media (max-width: 900px) {
		.nav-item {
			justify-content: center;
			padding: 0;
		}
		.label {
			display: none;
		}
	}
</style>
