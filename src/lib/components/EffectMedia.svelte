<script>
	// Renders an image or video with one of the effect presets applied.
	// Used by the feed (stored posts) and the composer (live preview),
	// so the preview is exactly what the feed will show.
	import { normalizeEffect } from '$lib/effects.js';

	let { src, type = 'image', effect = 'none', alt = '', onmeta = null } = $props();

	const fx = $derived(normalizeEffect(effect));
</script>

<figure class={`fx fx-${fx}`}>
	{#if type === 'video'}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			{src}
			controls
			playsinline
			preload="metadata"
			aria-label={alt}
			onloadedmetadata={onmeta}
		></video>
	{:else}
		<img {src} {alt} loading="lazy" onload={onmeta} />
	{/if}
	<span class="overlay" aria-hidden="true"></span>
</figure>

<style>
	.fx {
		position: relative;
		margin: 0;
		width: 100%;
		max-height: 30rem;
		overflow: hidden;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		background: var(--bg);
		isolation: isolate;
	}
	img,
	video {
		display: block;
		width: 100%;
		max-height: 30rem;
		object-fit: contain;
		background: var(--bg);
	}
	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	/* none: no treatment ------------------------------------------------------*/
	.fx-none .overlay {
		display: none;
	}

	/* grain: warmth + repeating noise-ish dot field ---------------------------*/
	.fx-grain img,
	.fx-grain video {
		filter: contrast(1.06) sepia(0.18) brightness(0.98);
	}
	.fx-grain .overlay {
		opacity: 0.16;
		mix-blend-mode: overlay;
		background-image:
			radial-gradient(rgba(240, 240, 240, 0.55) 1px, transparent 1.4px),
			radial-gradient(rgba(15, 15, 15, 0.5) 1px, transparent 1.2px);
		background-size:
			3px 3px,
			5px 5px;
		background-position:
			0 0,
			2px 3px;
	}

	/* vhs: soft tape look, chroma-shifted edges, scanlines --------------------*/
	.fx-vhs img,
	.fx-vhs video {
		filter: saturate(1.35) contrast(1.12) blur(0.4px) hue-rotate(-6deg);
	}
	.fx-vhs .overlay {
		background:
			repeating-linear-gradient(
				180deg,
				rgba(15, 15, 15, 0.22) 0px,
				rgba(15, 15, 15, 0.22) 1px,
				transparent 1px,
				transparent 3px
			),
			linear-gradient(90deg, rgba(232, 69, 69, 0.08), transparent 12%, transparent 88%, rgba(69, 132, 232, 0.08));
	}

	/* duotone: shadows to base black, highlights toward the gold accent -------*/
	.fx-duotone img,
	.fx-duotone video {
		filter: grayscale(1) contrast(1.15) brightness(1.02);
	}
	.fx-duotone .overlay {
		background: linear-gradient(160deg, rgba(212, 165, 116, 0.55), rgba(15, 15, 15, 0.55));
		mix-blend-mode: overlay;
	}
	.fx-duotone .overlay::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(212, 165, 116, 0.16);
		mix-blend-mode: color;
	}

	/* glow: lifted, blooming highlights ---------------------------------------*/
	.fx-glow img,
	.fx-glow video {
		filter: brightness(1.1) saturate(1.15) contrast(0.96)
			drop-shadow(0 0 18px rgba(212, 165, 116, 0.35));
	}
	.fx-glow .overlay {
		background: radial-gradient(
			120% 90% at 50% 35%,
			rgba(212, 165, 116, 0.14),
			transparent 65%
		);
	}

	/* blur-frame: sharp media, heavy vignette blur toward the edges -----------*/
	.fx-blur-frame .overlay {
		backdrop-filter: blur(7px);
		-webkit-mask-image: radial-gradient(
			78% 78% at 50% 50%,
			transparent 52%,
			#000 88%
		);
		mask-image: radial-gradient(78% 78% at 50% 50%, transparent 52%, #000 88%);
	}

	/* beat-pulse: subtle scale + brightness pulse, roughly 120bpm halved ------*/
	@keyframes fx-beat {
		0%,
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
		50% {
			transform: scale(1.015);
			filter: brightness(1.08) saturate(1.08);
		}
	}
	.fx-beat-pulse img,
	.fx-beat-pulse video {
		animation: fx-beat 1s ease-in-out infinite;
	}
	.fx-beat-pulse .overlay {
		background: radial-gradient(
			100% 80% at 50% 100%,
			rgba(212, 165, 116, 0.12),
			transparent 60%
		);
	}

	@media (prefers-reduced-motion: reduce) {
		.fx-beat-pulse img,
		.fx-beat-pulse video {
			animation: none;
		}
	}
</style>
