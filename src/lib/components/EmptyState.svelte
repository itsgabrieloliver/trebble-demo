<script>
	let { title, description = '', icon = '♪', action } = $props();
</script>

<div class="empty">
	<span class="icon" aria-hidden="true">{icon}</span>
	<h3>{title}</h3>
	{#if description}<p>{description}</p>{/if}
	{#if action}
		<div class="action">{@render action()}</div>
	{/if}
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: var(--space-2);
		padding: var(--space-10) var(--space-8);
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--muted);
	}
	.icon {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-alt);
		color: var(--accent);
		font-size: var(--text-lg);
		margin-bottom: var(--space-2);
	}
	h3 {
		font-family: var(--font-mono);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--fg);
	}
	p {
		max-width: 48ch;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: 1.6;
	}
	.action {
		margin-top: var(--space-4);
	}
</style>
