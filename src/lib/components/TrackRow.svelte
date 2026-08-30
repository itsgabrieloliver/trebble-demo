<script>
	import Badge from './Badge.svelte';

	let {
		track,
		index = 0,
		playing = false,
		playable = true,
		onplay = () => {},
		onshare = null
	} = $props();

	const duration = $derived(
		track.durationMs
			? `${Math.floor(track.durationMs / 60000)}:${String(
					Math.floor((track.durationMs % 60000) / 1000)
				).padStart(2, '0')}`
			: null
	);
	const cover = $derived(
		track.art || `https://picsum.photos/seed/${encodeURIComponent(track.title || 'track')}/120/120`
	);
</script>

<li class="row" class:playing class:disabled={!playable}>
	<button
		type="button"
		class="hit"
		disabled={!playable}
		onclick={() => onplay(index)}
		aria-label={`Play ${track.title} by ${track.artist}`}
	>
		<span class="num" aria-hidden="true">
			{#if playing}
				<span class="bars"><i></i><i></i><i></i></span>
			{:else}
				{String(index + 1).padStart(2, '0')}
			{/if}
		</span>
		<img src={cover} alt="" loading="lazy" />
		<span class="info">
			<span class="title">{track.title}</span>
			<span class="artist">{track.artist}</span>
		</span>
	</button>

	<div class="tail">
		{#if !track.uri && track.previewUrl}
			<Badge>30s preview</Badge>
		{/if}
		{#if duration}<span class="dur">{duration}</span>{/if}
		{#if onshare && track.uri}
			<button type="button" class="share" onclick={() => onshare(track)}>Share</button>
		{/if}
	</div>
</li>

<style>
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-2) var(--space-5);
		border-left: 2px solid transparent;
		border-radius: var(--radius);
		transition:
			background var(--dur) var(--ease),
			transform var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.row:hover:not(.disabled) {
		background: var(--surface-alt);
		transform: translateY(-2px);
		border-left-color: var(--accent);
	}
	.playing {
		border-left-color: var(--accent);
		background: var(--surface-alt);
	}
	.disabled {
		opacity: 0.5;
	}
	.disabled .hit {
		cursor: not-allowed;
	}

	.hit {
		display: grid;
		grid-template-columns: 1.75rem 56px 1fr;
		align-items: center;
		gap: var(--space-6);
		min-width: 0;
		min-height: 44px;
		padding: var(--space-1) 0;
		background: none;
		border: 0;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.num {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
	}
	.playing .num {
		color: var(--accent);
	}

	img {
		width: 56px;
		height: 56px;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--surface-raised);
	}

	.info {
		display: grid;
		min-width: 0;
	}
	.title {
		font-size: var(--text-base);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.playing .title {
		color: var(--accent);
	}
	.artist {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tail {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}
	.dur {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.share {
		min-height: 32px;
		padding: 0 var(--space-4);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		transition:
			border-color var(--dur-fast) ease,
			color var(--dur-fast) ease;
	}
	.share:hover,
	.share:focus-visible {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--surface-alt);
	}

	@media (max-width: 768px) {
		.hit {
			grid-template-columns: 44px 1fr;
			gap: var(--space-4);
		}
		.num {
			display: none;
		}
		img {
			width: 44px;
			height: 44px;
		}
		.dur {
			display: none;
		}
	}

	.bars {
		display: inline-flex;
		align-items: flex-end;
		gap: 2px;
		height: 0.8rem;
	}
	.bars i {
		width: 3px;
		background: var(--accent);
		border-radius: 1px;
		animation: eq 900ms var(--ease) infinite alternate;
	}
	.bars i:nth-child(1) {
		height: 40%;
	}
	.bars i:nth-child(2) {
		height: 100%;
		animation-delay: 150ms;
	}
	.bars i:nth-child(3) {
		height: 65%;
		animation-delay: 300ms;
	}
	@keyframes eq {
		from {
			transform: scaleY(0.4);
		}
		to {
			transform: scaleY(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bars i {
			animation: none;
		}
	}
</style>
