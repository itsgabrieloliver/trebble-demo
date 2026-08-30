<script>
	let { tone = 'neutral', children } = $props();
</script>

<span class="badge {tone}">{@render children?.()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-0);
		padding: 0.15rem var(--space-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		white-space: nowrap;
	}
	.accent {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--surface-alt);
	}
	.danger {
		border-color: var(--danger);
		color: var(--danger);
		background: var(--danger-soft);
	}
	.solid {
		background: var(--fg);
		border-color: var(--fg);
		color: var(--bg);
	}
</style>
