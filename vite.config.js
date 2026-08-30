import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 3000;

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port,
		strictPort: true
	},
	preview: {
		host: '0.0.0.0',
		port,
		strictPort: true
	}
});
