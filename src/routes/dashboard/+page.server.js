import { redirect } from '@sveltejs/kit';

// The feed is the home surface. /dashboard forwards there, keeping any query
// params (the Spotify OAuth callback lands on /dashboard?spotify=...).
export function load({ url }) {
	redirect(302, `/dashboard/feed${url.search}`);
}
