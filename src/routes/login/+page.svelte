<script>
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	let { data, form } = $props();

	let mode = $state(form?.mode || data.mode);
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in, Studio 6A</title>
</svelte:head>

<main class="wrap">
	<div class="panel">
		<a class="brand" href="/">
			<span class="mark" aria-hidden="true">6A</span>
			<span>Studio 6A</span>
		</a>

		<h1>{mode === 'login' ? 'Welcome back' : 'Set up your account'}</h1>
		<p class="sub">
			{mode === 'login'
				? 'Sign in to pick up your library, playlists and feed.'
				: 'An account keeps your shares, reactions and comments across devices.'}
		</p>

		<Tabs
			items={[
				{ value: 'signup', label: 'Sign up' },
				{ value: 'login', label: 'Log in' }
			]}
			value={mode}
			onchange={(v) => (mode = v)}
		/>

		<form
			method="POST"
			action={`?/${mode}`}
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			{#if mode === 'signup'}
				<label class="field">
					<span>Display name</span>
					<input name="displayName" type="text" autocomplete="nickname" placeholder="Gabriel" />
				</label>
			{/if}

			<label class="field">
				<span>Email</span>
				<input
					name="email"
					type="email"
					required
					autocomplete="email"
					value={form?.email || ''}
					placeholder="you@example.com"
				/>
			</label>

			<label class="field">
				<span>Password</span>
				<input
					name="password"
					type="password"
					required
					minlength={mode === 'signup' ? 8 : undefined}
					autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
					placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
				/>
			</label>

			{#if form?.error}
				<p class="error-note" role="alert">{form.error}</p>
			{/if}

			<Button type="submit" block size="lg" disabled={submitting}>
				{submitting ? 'Working' : mode === 'login' ? 'Log in' : 'Create account'}
			</Button>
		</form>

		<p class="meta foot">You can connect Spotify once you are inside.</p>
	</div>
</main>

<style>
	.wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: var(--space-10) var(--space-6);
		background:
			radial-gradient(50rem 26rem at 50% -10%, rgba(212, 165, 116, 0.12), transparent 60%),
			var(--bg);
	}
	.panel {
		width: 100%;
		max-width: 26rem;
		display: grid;
		gap: var(--space-6);
		padding: var(--space-11);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
	}
	@media (max-width: 480px) {
		.panel {
			padding: var(--space-8);
		}
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
	.sub {
		color: var(--muted);
		margin-top: calc(var(--space-4) * -1);
	}
	form {
		display: grid;
		gap: var(--space-6);
		margin-top: var(--space-2);
	}
	.foot {
		text-align: center;
	}
</style>
