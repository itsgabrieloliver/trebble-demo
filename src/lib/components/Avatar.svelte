<script>
	let { name = '', src = null, size = 'md', shape = 'square' } = $props();

	const initials = $derived(
		String(name || '?')
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((p) => p[0] || '')
			.join('')
			.toUpperCase() || '?'
	);
</script>

{#if src}
	<img
		class="avatar {size} {shape}"
		{src}
		alt={name ? `${name}, profile picture` : ''}
		loading="lazy"
	/>
{:else}
	<span class="avatar fallback {size} {shape}" aria-hidden="true">{initials}</span>
{/if}

<style>
	.avatar {
		flex: none;
		object-fit: cover;
		border: 1px solid var(--border);
		background: var(--surface-raised);
	}
	.square {
		border-radius: var(--radius-sm);
	}
	.circle {
		border-radius: 50%;
	}
	.sm {
		width: 1.75rem;
		height: 1.75rem;
		font-size: 0.6rem;
	}
	.md {
		width: 2.25rem;
		height: 2.25rem;
		font-size: var(--text-xs);
	}
	.lg {
		width: 3rem;
		height: 3rem;
		font-size: var(--text-base);
	}
	.xl {
		width: 120px;
		height: 120px;
		font-size: var(--text-display);
	}
	.fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--accent-fg);
		background: linear-gradient(135deg, var(--accent), var(--border-strong));
	}
</style>
