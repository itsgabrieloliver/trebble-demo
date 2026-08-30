<script>
	let { items = [], value = null, onchange = () => {} } = $props();
</script>

<div class="tabs" role="tablist">
	{#each items as item (item.value)}
		<button
			type="button"
			role="tab"
			aria-selected={value === item.value}
			class:active={value === item.value}
			onclick={() => onchange(item.value)}
		>
			{item.label}
			{#if item.count !== undefined}<span class="count">{item.count}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.tabs {
		display: inline-flex;
		gap: var(--space-0);
		padding: 4px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.tabs::-webkit-scrollbar {
		display: none;
	}
	button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 34px;
		padding: 0 var(--space-6);
		background: transparent;
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background var(--dur-fast) ease-out,
			color var(--dur-fast) ease-out;
	}
	button:hover:not(.active) {
		color: var(--fg);
	}
	.active {
		background: var(--fg);
		color: var(--bg);
	}
	.count {
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
		opacity: 0.7;
	}
</style>
