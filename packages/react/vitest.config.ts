import { defineConfig } from 'vitest/config';
import { VitestMarkdownReporter } from 'vitest-markdown-reporter';

export default defineConfig({
	test: {
		reporters: [
			'default',
			new VitestMarkdownReporter({ title: 'Test Cases' }),
		],
		exclude: ['**/node_modules', '**/dist'],
		environment: 'jsdom',
		passWithNoTests: true,
	},
});
