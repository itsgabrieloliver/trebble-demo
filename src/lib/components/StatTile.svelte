<script>
	let { label, value, hint = null } = $props();
</script>

<div class="tile">
	<span class="value">{value}</span>
	<span class="label">{label}</span>
	{#if hint}<span class="hint">{hint}</span>{/if}
</div>

<style>
	.tile {
		position: relative;
		display: grid;
		gap: var(--space-0);
		padding: var(--space-6);
		padding-left: var(--space-7);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		transition:
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.tile::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 3px;
		background: linear-gradient(180deg, var(--accent), var(--border-strong));
	}
	.tile:hover {
		background: var(--surface-alt);
		border-color: var(--border-strong);
	}
	.value {
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}
	.label {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.hint {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--accent);
	}
</style>
