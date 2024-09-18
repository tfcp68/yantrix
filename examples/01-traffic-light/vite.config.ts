import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		react(),
		nodePolyfills({
			protocolImports: true,
			include: ['process', 'path', 'url'],
		}),
	],
	build: {
		rollupOptions: {
			external: ['vite-plugin-node-polyfills/shims/process'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
