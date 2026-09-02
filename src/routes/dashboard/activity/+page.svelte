<script>
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	let { data, form } = $props();

	let filter = $state('all');
	let submitting = $state(false);

	const shown = $derived(filter === 'all' ? data.feed : data.feed.filter((i) => i.kind === filter));

	function timeAgo(iso) {
		const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function dayLabel(iso) {
		const d = new Date(iso);
		const today = new Date();
		const isToday = d.toDateString() === today.toDateString();
		if (isToday) return 'Today';
		const yesterday = new Date(today.getTime() - 86400000);
		if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head><title>Activity, Trebble</title></svelte:head>

<header class="page-head">
	<div class="head-row">
		<div>
			<h1>Activity</h1>
			<p class="meta">Recommendations and plays from everyone, as a timeline</p>
		</div>
		<Tabs
			items={[
				{ value: 'all', label: 'All', count: data.feed.length },
				{
					value: 'recommend',
					label: 'Recommended',
					count: data.feed.filter((i) => i.kind === 'recommend').length
				},
				{
					value: 'played',
					label: 'Played',
					count: data.feed.filter((i) => i.kind === 'played').length
				}
			]}
			value={filter}
			onchange={(v) => (filter = v)}
		/>
	</div>
</header>

<div class="body">
	<section class="composer">
		<h2>Recommend a track</h2>
		<p class="meta">It goes to the top of the timeline for everyone.</p>
		<form
			method="POST"
			action="?/recommend"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label class="field">
				<span>Track</span>
				<input
					name="title"
					type="text"
					required
					placeholder="Cold Little Heart"
					value={form?.title || ''}
				/>
			</label>
			<label class="field">
				<span>Artist</span>
				<input
					name="artist"
					type="text"
					required
					placeholder="Michael Kiwanuka"
					value={form?.artist || ''}
				/>
			</label>
			<label class="field wide">
				<span>Why</span>
				<input
					name="note"
					type="text"
					maxlength="280"
					placeholder="One line about why it belongs here"
				/>
			</label>
			<div class="submit">
				<Button type="submit" disabled={submitting}>{submitting ? 'Posting' : 'Post'}</Button>
			</div>
		</form>
		{#if form?.error}
			<p class="error-note" role="alert">{form.error}</p>
		{:else if form?.posted}
			<p class="ok-note" role="status">Posted {form.title} to the timeline.</p>
		{/if}
	</section>

	{#if shown.length}
		<ol class="timeline">
			{#each shown as item, i (item.createdAt + item.title + i)}
				<li>
					<div class="rail-col">
						<span class="dot" class:rec={item.kind === 'recommend'}></span>
						<span class="day meta">{dayLabel(item.createdAt)}</span>
					</div>
					<article class="entry" class:self={item.self}>
						<header>
							<Avatar name={item.name} src={item.avatar} size="sm" shape="circle" />
							<span class="who">{item.name}</span>
							<Badge tone={item.kind === 'recommend' ? 'accent' : 'neutral'}>
								{item.kind === 'recommend' ? 'recommended' : 'played'}
							</Badge>
							<span class="meta when">{timeAgo(item.createdAt)}</span>
						</header>
						<div class="track">
							<img src={item.art} alt="" loading="lazy" />
							<div>
								<p class="t-title">{item.title}</p>
								<p class="meta">{item.artist}</p>
							</div>
						</div>
						{#if item.note}
							<p class="note">{item.note}</p>
						{/if}
					</article>
				</li>
			{/each}
		</ol>
	{:else}
		<EmptyState
			title="Nothing in this view"
			description="No activity matches this filter yet. Post a recommendation above and it appears here immediately."
			icon="◷"
		>
			{#snippet action()}
				<Button size="sm" variant="secondary" onclick={() => (filter = 'all')}>Show everything</Button>
			{/snippet}
		</EmptyState>
	{/if}
</div>

<style>
	.head-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-6);
		flex-wrap: wrap;
	}
	.body {
		display: grid;
		gap: var(--space-10);
		padding: var(--space-10);
		max-width: 56rem;
	}
	@media (max-width: 768px) {
		.body {
			padding: var(--space-8) var(--space-6);
		}
	}

	.composer {
		padding: var(--space-8);
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius);
		display: grid;
		gap: var(--space-2);
	}
	.composer form {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-6);
		margin-top: var(--space-6);
		align-items: end;
	}
	.wide {
		grid-column: 1 / -1;
	}
	.submit {
		grid-column: 1 / -1;
	}
	@media (max-width: 640px) {
		.composer form {
			grid-template-columns: 1fr;
		}
	}

	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-8);
	}
	.timeline li {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		gap: var(--space-6);
	}
	.rail-col {
		display: grid;
		justify-items: end;
		align-content: start;
		gap: var(--space-2);
		padding-top: var(--space-5);
		border-right: 1px solid var(--border);
		padding-right: var(--space-5);
		position: relative;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--border-strong);
		position: absolute;
		right: -4.5px;
		top: var(--space-6);
	}
	.dot.rec {
		background: var(--accent);
	}
	.day {
		text-align: right;
	}

	.entry {
		display: grid;
		gap: var(--space-5);
		padding: var(--space-6);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition:
			background var(--dur) var(--ease),
			transform var(--dur) var(--ease);
	}
	.entry:hover {
		background: var(--surface-alt);
		transform: translateY(-2px);
	}
	.entry.self {
		border-color: var(--border-strong);
	}
	.entry header {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}
	.who {
		font-weight: 600;
	}
	.when {
		margin-left: auto;
	}

	.track {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
	.track img {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.t-title {
		font-weight: 600;
	}
	.note {
		color: var(--muted);
		border-left: 2px solid var(--border-strong);
		padding-left: var(--space-5);
	}

	@media (max-width: 640px) {
		.timeline li {
			grid-template-columns: 1fr;
		}
		.rail-col {
			display: none;
		}
	}
</style>
