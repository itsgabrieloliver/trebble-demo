<script>
	import {
		player,
		currentTrack,
		formatTime,
		togglePlay,
		skip,
		seekRatio
	} from '$lib/player.svelte.js';

	const track = $derived(currentTrack());
	const pct = $derived(player.duration ? (player.position / player.duration) * 100 : 0);

	function onScrub(event) {
		const rect = event.currentTarget.getBoundingClientRect();
		seekRatio((event.clientX - rect.left) / rect.width);
	}
</script>

<footer class="np">
	<div class="meta">
		{#if track?.art}
			<img src={track.art} alt="" />
		{:else}
			<span class="art-fallback" aria-hidden="true">♪</span>
		{/if}
		<div class="text">
			<span class="title">{track ? track.title : 'No track loaded'}</span>
			<span class="artist">{track ? track.artist : 'Pick a track to start playback'}</span>
		</div>
		{#if player.badge}
			<span class="badge">{player.badge}</span>
		{/if}
	</div>

	<div class="controls">
		<button type="button" class="np-btn" onclick={() => skip(-1)} aria-label="Previous track">‹‹</button>
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

	<div class="progress">
		<span class="time">{formatTime(player.position)}</span>
		<button type="button" class="bar" onclick={onScrub} aria-label="Seek within track">
			<span class="fill" style={`width:${pct}%`}></span>
		</button>
		<span class="time">{formatTime(player.duration)}</span>
	</div>
</footer>

<style>
	.np {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: var(--space-8);
		height: var(--player-h);
		padding: 0 var(--space-8);
		background: var(--surface);
		border-top: 1px solid var(--border);
		box-shadow: var(--shadow-md);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		min-width: 0;
	}
	.meta img,
	.art-fallback {
		width: 2.75rem;
		height: 2.75rem;
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
		font-size: var(--text-base);
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
	.badge {
		flex: none;
		padding: 0.15rem var(--space-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-4);
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
		width: 2.4rem;
		height: 2.4rem;
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-fg);
	}
	.main:hover {
		background: transparent;
		color: var(--accent);
		border-color: var(--accent);
	}

	.progress {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}
	.time {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.bar {
		position: relative;
		flex: 1;
		height: 12px;
		display: flex;
		align-items: center;
		padding: 0;
		background: none;
		border: 0;
		cursor: pointer;
	}
	.bar::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--border);
		border-radius: 2px;
		z-index: -1;
	}
	.fill {
		display: block;
		height: 2px;
		background: var(--accent);
		border-radius: 2px;
	}

	@media (max-width: 768px) {
		.np {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto;
			height: auto;
			gap: var(--space-2);
			padding: var(--space-4) var(--space-6);
			justify-items: center;
		}
		.meta {
			display: none;
		}
		.progress {
			width: 100%;
		}
	}
</style>
