<script>
	// Compact playback affordance. The feed is the product, so this only
	// appears once a track has actually been started from a post or a row,
	// and it stays a small docked pill instead of a full-width player bar.
	import { player, currentTrack, formatTime, togglePlay, skip } from '$lib/player.svelte.js';

	const track = $derived(currentTrack());
	const pct = $derived(player.duration ? (player.position / player.duration) * 100 : 0);
</script>

{#if track}
	<aside class="np" aria-label="Now playing">
		<span class="fill" style={`width:${pct}%`} aria-hidden="true"></span>
		{#if track.art}
			<img src={track.art} alt="" />
		{:else}
			<span class="art-fallback" aria-hidden="true">♪</span>
		{/if}
		<div class="text">
			<span class="title">{track.title}</span>
			<span class="artist">
				{track.artist}{player.badge ? ` · ${player.badge}` : ''}
			</span>
		</div>
		<span class="time">{formatTime(player.position)}</span>
		<div class="controls">
			<button type="button" class="np-btn" onclick={() => skip(-1)} aria-label="Previous track">
				‹‹
			</button>
			<button
				type="button"
				class="np-btn main"
				onclick={togglePlay}
				aria-label={player.isPlaying ? 'Pause' : 'Play'}
			>
				{player.isPlaying ? '❚❚' : '▶'}
			</button>
			<button type="button" class="np-btn" onclick={() => skip(1)} aria-label="Next track">››</button>
		</div>
	</aside>
{/if}

<style>
	.np {
		position: fixed;
		right: var(--space-8);
		bottom: var(--space-8);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: var(--space-5);
		max-width: 24rem;
		padding: var(--space-4) var(--space-5);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	.fill {
		position: absolute;
		left: 0;
		bottom: 0;
		height: 2px;
		background: var(--accent);
		transition: width 0.4s linear;
	}

	img,
	.art-fallback {
		width: 2.4rem;
		height: 2.4rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--surface-raised);
	}
	.art-fallback {
		display: grid;
		place-items: center;
		color: var(--muted);
	}

	.text {
		display: grid;
		min-width: 0;
	}
	.title {
		font-size: var(--text-sm);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.artist {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.time {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		flex: none;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: none;
	}
	.np-btn {
		width: 2.1rem;
		height: 2.1rem;
		display: grid;
		place-items: center;
		background: transparent;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		color: var(--fg);
		font-size: var(--text-xs);
		cursor: pointer;
		transition:
			background var(--dur-fast) ease,
			border-color var(--dur-fast) ease;
	}
	.np-btn:hover {
		border-color: var(--fg);
		background: var(--surface-raised);
	}
	.main {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-fg);
	}
	.main:hover {
		background: transparent;
		color: var(--accent);
		border-color: var(--accent);
	}

	@media (max-width: 768px) {
		.np {
			left: var(--space-6);
			right: var(--space-6);
			bottom: var(--space-6);
			max-width: none;
		}
		.time {
			display: none;
		}
	}
</style>
