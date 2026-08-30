<script>
	let {
		variant = 'primary',
		size = 'md',
		block = false,
		type = 'button',
		href = null,
		disabled = false,
		children,
		...rest
	} = $props();
</script>

{#if href}
	<a {href} class="btn {variant} {size}" class:block aria-disabled={disabled} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button {type} class="btn {variant} {size}" class:block {disabled} {...rest}>
		{@render children?.()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: 40px;
		padding: 0 var(--space-6);
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease;
	}

	.sm {
		min-height: 32px;
		padding: 0 var(--space-4);
		font-size: var(--text-xs);
	}
	.lg {
		min-height: 46px;
		padding: 0 var(--space-8);
		font-size: var(--text-base);
		letter-spacing: 0.04em;
	}
	.block {
		width: 100%;
	}

	.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-fg);
	}
	.primary:hover:not(:disabled) {
		background: transparent;
		color: var(--accent);
	}

	.secondary,
	.ghost {
		background: transparent;
		border-color: var(--border-strong);
		color: var(--fg);
	}
	.secondary:hover:not(:disabled),
	.ghost:hover:not(:disabled) {
		background: var(--surface-alt);
		border-color: var(--fg);
	}

	.quiet {
		background: transparent;
		border-color: transparent;
		color: var(--muted);
	}
	.quiet:hover:not(:disabled) {
		color: var(--fg);
		background: var(--surface-alt);
	}

	.danger {
		background: transparent;
		border-color: var(--danger);
		color: var(--danger);
	}
	.danger:hover:not(:disabled) {
		background: var(--danger-soft);
	}

	.btn:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px var(--accent-soft);
	}

	.btn:disabled,
	.btn[aria-disabled='true'] {
		background: var(--surface-alt);
		border-color: var(--border);
		color: var(--muted);
		cursor: default;
		pointer-events: none;
	}
</style>
