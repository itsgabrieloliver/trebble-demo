<script>
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	const covers = [
		{ seed: 'midnightcity', title: 'Midnight City', artist: 'M83' },
		{ seed: 'nights', title: 'Nights', artist: 'Frank Ocean' },
		{ seed: 'spacesong', title: 'Space Song', artist: 'Beach House' },
		{ seed: 'silverspr', title: 'Silver Springs', artist: 'Fleetwood Mac' },
		{ seed: 'redbone', title: 'Redbone', artist: 'Childish Gambino' },
		{ seed: 'khruangbintime', title: 'Time (You and I)', artist: 'Khruangbin' }
	];
</script>

<svelte:head>
	<title>Studio 6A, listen together</title>
	<meta
		name="description"
		content="Connect Spotify, share the tracks you are actually playing, and compare listening with the people you trust for music."
	/>
</svelte:head>

<header class="top">
	<div class="container bar">
		<a class="brand" href="/">
			<span class="mark" aria-hidden="true">6A</span>
			<span>Studio 6A</span>
		</a>
		<nav class="links">
			<a href="#how">How it works</a>
			<a href="#feed">The feed</a>
			{#if data.user}
				<Button href="/dashboard" size="sm">Open dashboard</Button>
			{:else}
				<Button href="/login" size="sm">Sign in</Button>
			{/if}
		</nav>
	</div>
</header>

<main>
	<section class="hero">
		<div class="container hero-grid">
			<div class="hero-copy">
				<span class="eyebrow ui-label">Spotify connected</span>
				<h1>The people you trust for music, in one feed</h1>
				<p class="lede">
					Link your Spotify account, pull in your top tracks and playlists, then share what you are
					playing with friends who actually reply. Reactions and comments sit right under the track,
					not three screens away.
				</p>
				<div class="cta">
					{#if data.user}
						<Button href="/dashboard" size="lg">Open dashboard</Button>
					{:else}
						<Button href="/login" size="lg">Create an account</Button>
						<Button href="/login?mode=login" variant="secondary" size="lg">I already have one</Button>
					{/if}
				</div>
				<p class="meta note">Full playback for Spotify Premium, 30 second previews otherwise.</p>
			</div>

			<div class="art-wall" aria-hidden="true">
				{#each covers as cover (cover.seed)}
					<figure>
						<img src={`https://picsum.photos/seed/${cover.seed}/400/400`} alt="" loading="lazy" />
						<figcaption>
							<span class="c-title">{cover.title}</span>
							<span class="c-artist">{cover.artist}</span>
						</figcaption>
					</figure>
				{/each}
			</div>
		</div>
	</section>

	<section class="section container" id="how">
		<div class="section-head">
			<div>
				<h2>How it works</h2>
				<p>Three steps, then it runs on its own</p>
			</div>
		</div>
		<div class="steps">
			<article>
				<span class="step-n ui-label">01</span>
				<h3>Connect Spotify</h3>
				<p>
					One OAuth handshake pulls in your top tracks, your playlists and your subscription tier so
					playback picks the right mode.
				</p>
			</article>
			<article>
				<span class="step-n ui-label">02</span>
				<h3>Share a track</h3>
				<p>
					Hit share on any row in your library or a playlist, add a line about why it matters, and it
					lands in the feed with the album art attached.
				</p>
			</article>
			<article>
				<span class="step-n ui-label">03</span>
				<h3>Talk about it</h3>
				<p>
					Friends react and comment under the track itself, and every share stays playable straight
					from the feed.
				</p>
			</article>
		</div>
	</section>

	<section class="section container" id="feed">
		<div class="section-head">
			<div>
				<h2>Built around the listening, not the profile</h2>
				<p>What you get once you are in</p>
			</div>
		</div>
		<div class="features">
			<article>
				<h3>Your library, ranked</h3>
				<p>Top tracks straight from Spotify, playable in place with a persistent now playing bar.</p>
			</article>
			<article>
				<h3>Playlists you can open</h3>
				<p>
					Every playlist you own or follow, with its tracks one click deep. Spotify's own editorial
					playlists are labelled, so a blocked track list is never a mystery.
				</p>
			</article>
			<article>
				<h3>A feed with a memory</h3>
				<p>Shares, reactions and comments are stored, so the conversation is still there tomorrow.</p>
			</article>
			<article>
				<h3>Activity from everyone</h3>
				<p>Recommendations and recent plays in one timeline, newest first.</p>
			</article>
		</div>
	</section>

	<section class="closer">
		<div class="container closer-inner">
			<div>
				<h2>Start with the last thing you played</h2>
				<p class="muted">It takes about a minute to connect and share your first track.</p>
			</div>
			<Button href={data.user ? '/dashboard' : '/login'} size="lg">
				{data.user ? 'Open dashboard' : 'Get started'}
			</Button>
		</div>
	</section>
</main>

<footer class="foot">
	<div class="container foot-inner">
		<span class="meta">Studio 6A</span>
		<span class="meta">Spotify is a trademark of Spotify AB.</span>
	</div>
</footer>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 30;
		background: rgba(15, 15, 15, 0.82);
		backdrop-filter: blur(6px);
		border-bottom: 1px solid var(--border);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		height: 4rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.mark {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--accent-fg);
		font-size: var(--text-xs);
	}
	.links {
		display: flex;
		align-items: center;
		gap: var(--space-8);
	}
	.links a {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		transition: color var(--dur-fast) ease;
	}
	.links a:hover {
		color: var(--fg);
	}
	@media (max-width: 768px) {
		.links a[href^='#'] {
			display: none;
		}
	}

	.hero {
		padding-block: var(--space-12) var(--space-11);
		border-bottom: 1px solid var(--border);
		background:
			radial-gradient(60rem 30rem at 85% -10%, rgba(212, 165, 116, 0.12), transparent 60%),
			var(--bg);
	}
	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		gap: var(--space-12);
	}
	@media (max-width: 900px) {
		.hero-grid {
			grid-template-columns: 1fr;
			gap: var(--space-11);
		}
	}
	.eyebrow {
		color: var(--accent);
	}
	.hero-copy h1 {
		margin-top: var(--space-5);
		font-size: var(--text-hero);
		line-height: 1.1;
		max-width: 16ch;
	}
	@media (max-width: 600px) {
		.hero-copy h1 {
			font-size: 2rem;
		}
	}
	.lede {
		margin-top: var(--space-7);
		max-width: 62ch;
		color: var(--muted);
		font-size: var(--text-md);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin-top: var(--space-10);
	}
	.note {
		margin-top: var(--space-6);
	}

	.art-wall {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-5);
	}
	.art-wall figure {
		margin: 0;
		position: relative;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		overflow: hidden;
	}
	.art-wall figure:nth-child(2) {
		transform: translateY(var(--space-8));
	}
	.art-wall figure:nth-child(5) {
		transform: translateY(var(--space-8));
	}
	.art-wall img {
		aspect-ratio: 1;
		width: 100%;
		object-fit: cover;
	}
	.art-wall figcaption {
		position: absolute;
		inset: auto 0 0 0;
		display: grid;
		gap: 0.1rem;
		padding: var(--space-5) var(--space-4) var(--space-4);
		background: linear-gradient(180deg, rgba(15, 15, 15, 0) 0%, rgba(15, 15, 15, 0.7) 100%);
	}
	.c-title {
		font-size: var(--text-xs);
		font-weight: 700;
	}
	.c-artist {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		color: var(--muted);
	}
	@media (max-width: 600px) {
		.art-wall figure:nth-child(n + 5) {
			display: none;
		}
		.art-wall figure {
			transform: none !important;
		}
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--space-8);
	}
	.steps article {
		padding: var(--space-8);
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius);
	}
	.step-n {
		color: var(--accent);
	}
	.steps h3 {
		margin: var(--space-4) 0 var(--space-2);
	}
	.steps p,
	.features p {
		color: var(--muted);
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--space-8);
	}
	.features article {
		padding: var(--space-8);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition:
			background var(--dur) var(--ease),
			transform var(--dur) var(--ease);
	}
	.features article:hover {
		background: var(--surface-alt);
		transform: translateY(-2px);
	}
	.features h3 {
		margin-bottom: var(--space-2);
	}

	.closer {
		border-top: 1px solid var(--border);
		background: var(--surface);
	}
	.closer-inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-8);
		padding-block: var(--space-11);
	}

	.foot {
		border-top: 1px solid var(--border);
	}
	.foot-inner {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-5);
		padding-block: var(--space-8);
	}
</style>
