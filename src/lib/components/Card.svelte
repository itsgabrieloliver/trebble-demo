<script>
	let {
		title = null,
		sub = null,
		tone = 'plain',
		padded = true,
		hoverable = false,
		actions,
		children
	} = $props();
</script>

<section class="card {tone}" class:padded class:hoverable>
	{#if title || actions}
		<header class="card-head">
			<div>
				{#if title}<h2>{title}</h2>{/if}
				{#if sub}<p class="meta">{sub}</p>{/if}
			</div>
			{#if actions}
				<div class="card-actions">{@render actions()}</div>
			{/if}
		</header>
	{/if}
	{@render children?.()}
</section>

<style>
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition:
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease),
			transform var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);
	}
	.padded {
		padding: var(--space-8);
	}
	.hoverable:hover {
		background: var(--surface-alt);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}
	.accent {
		border-left: 3px solid var(--accent);
	}
	.raised {
		background: var(--surface-raised);
		border-color: var(--border-strong);
	}

	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-6);
		flex-wrap: wrap;
	}
	.card-head h2 {
		font-size: var(--text-lg);
	}
	.card-head p {
		margin-top: var(--space-0);
	}
	.card-actions {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
</style>
