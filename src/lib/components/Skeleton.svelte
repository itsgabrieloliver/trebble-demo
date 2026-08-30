<script>
	let { rows = 3, variant = 'row' } = $props();
</script>

<div class="wrap {variant}" aria-hidden="true">
	{#each Array(rows) as _, i (i)}
		{#if variant === 'card'}
			<div class="card">
				<div class="skeleton art"></div>
				<div class="skeleton line"></div>
				<div class="skeleton line short"></div>
			</div>
		{:else}
			<div class="row">
				<div class="skeleton thumb"></div>
				<div class="lines">
					<div class="skeleton line"></div>
					<div class="skeleton line short"></div>
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.wrap.row {
		display: grid;
		gap: var(--space-2);
	}
	.wrap.card {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: var(--space-9);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-2) var(--space-5);
	}
	.thumb {
		width: 56px;
		height: 56px;
		flex: none;
		border-radius: var(--radius-sm);
	}
	.art {
		aspect-ratio: 1;
		border-radius: var(--radius-lg);
	}
	.lines,
	.card {
		display: grid;
		gap: var(--space-2);
		flex: 1;
	}
	.line {
		height: 0.7rem;
		width: 100%;
	}
	.short {
		width: 45%;
	}
</style>
