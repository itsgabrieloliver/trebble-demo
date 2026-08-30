# Studio 6A

A music social app: connect Spotify, browse your top tracks and playlists, share
tracks with other listeners, and react and comment on what they share.

## Stack

- SvelteKit (Svelte 5) with `@sveltejs/adapter-node`
- MongoDB via the `mongodb` driver (`users`, `recommendations`, `shares`)
- Spotify Web API + Web Playback SDK

## Environment variables

All secrets are read from the environment; nothing is hardcoded.

| Variable                | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`          | MongoDB connection string. Unset falls back to in-memory dev storage. |
| `SPOTIFY_CLIENT_ID`     | Spotify application client id                                       |
| `SPOTIFY_CLIENT_SECRET` | Spotify application client secret                                   |
| `SPOTIFY_REDIRECT_URI`  | Must match `https://<host>/auth/spotify/callback` in the Spotify dashboard |
| `PORT`                  | Read by the adapter-node server, defaults to 3000                   |

## Scripts

```
npm install
npm run dev      # vite dev
npm run build    # vite build
npm start        # node build
```
