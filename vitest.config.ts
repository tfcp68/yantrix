import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: ['**/node_modules', '**/dist', '.idea', '.git', '.cache', '.yarn', '**/fixtures'],
		passWithNoTests: true,
		globals: true,
		coverage: {
			enabled: true,
			reportOnFailure: true,
			all: true,
			clean: true,
			reportsDirectory: './coverage',
			provider: 'istanbul',
			reporter: ['text', 'json-summary', 'json'],
		},
	},
});
