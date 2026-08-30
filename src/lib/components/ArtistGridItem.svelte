<script>
	let { title, sub = '', art = null, href = null, tag = null, onclick = null, seed = '' } = $props();

	const cover = $derived(
		art || `https://picsum.photos/seed/${encodeURIComponent(seed || title || 'art')}/320/320`
	);
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	href={href ?? undefined}
	type={href ? undefined : 'button'}
	class="item"
	onclick={onclick ?? undefined}
>
	<span class="cover">
		<img src={cover} alt="" loading="lazy" />
		<span class="scrim"></span>
		<span class="play" aria-hidden="true">▶</span>
	</span>
	<span class="info">
		<span class="title">{title}</span>
		<span class="sub">
			{sub}{#if tag}<span class="tag">{tag}</span>{/if}
		</span>
	</span>
</svelte:element>

<style>
	.item {
		display: grid;
		gap: var(--space-4);
		padding: 0;
		background: none;
		border: 0;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.cover {
		position: relative;
		display: block;
		aspect-ratio: 1;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		overflow: hidden;
		background: var(--surface-raised);
		transition: transform var(--dur) var(--ease);
	}
	.item:hover .cover,
	.item:focus-visible .cover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.scrim {
		position: absolute;
		inset: 0;
		background: rgba(15, 15, 15, 0.35);
		opacity: 0;
		transition: opacity var(--dur) ease;
	}
	.play {
		position: absolute;
		inset: 0;
		margin: auto;
		width: 2.75rem;
		height: 2.75rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-fg);
		font-size: var(--text-sm);
		opacity: 0;
		transition: opacity var(--dur) ease;
	}
	.item:hover .scrim,
	.item:focus-visible .scrim,
	.item:hover .play,
	.item:focus-visible .play {
		opacity: 1;
	}

	.info {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}
	.title {
		font-size: var(--text-base);
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sub {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
	}
	.tag {
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0 0.3rem;
		color: var(--accent);
		border-color: var(--accent);
	}
</style>
