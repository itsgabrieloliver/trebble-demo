<script>
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';

	const title = $derived($page.status === 404 ? 'That page is not here' : 'Something went wrong');
	const detail = $derived(
		$page.status === 404
			? 'The link may be old, or the playlist or share was removed.'
			: $page.error?.message || 'The server hit an unexpected error loading this page.'
	);
</script>

<svelte:head>
	<title>{$page.status} · Studio 6A</title>
</svelte:head>

<main class="wrap">
	<div class="panel">
		<span class="code ui-label">Error {$page.status}</span>
		<h1>{title}</h1>
		<p class="muted">{detail}</p>
		<div class="actions">
			<Button href="/dashboard">Back to dashboard</Button>
			<Button href="/" variant="secondary">Go to the home page</Button>
		</div>
	</div>
</main>

<style>
	.wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: var(--space-10);
	}
	.panel {
		width: 100%;
		max-width: 34rem;
		padding: var(--space-12);
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		border-radius: var(--radius);
	}
	.code {
		color: var(--accent);
	}
	h1 {
		margin: var(--space-5) 0 var(--space-4);
		font-size: var(--text-display);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin-top: var(--space-10);
	}
</style>
