import { VitestMarkdownReporter } from 'vitest-markdown-reporter';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		reporters: [
			'dot',
			new VitestMarkdownReporter({ title: 'Test Cases' }),
		],
		exclude: ['**/node_modules', '**/dist'],
		environment: 'jsdom',
		setupFiles: ['__tests__/setup.ts'],
		passWithNoTests: true,
	},
});
