import { defineConfig } from 'vitest/config';
import { VitestMarkdownReporter } from 'vitest-markdown-reporter';

export default defineConfig({
	test: {
		reporters: [
			'default',
			new VitestMarkdownReporter({ title: 'Test Cases' }),
		],
		exclude: ['**/node_modules', '**/dist', '.idea', '.git', '.cache'],
		passWithNoTests: true,
		coverage: {
			enabled: false,
			reportOnFailure: true,
			all: true,
			clean: true,
			reportsDirectory: './coverage',
			provider: 'istanbul',
			reporter: ['text', 'json-summary', 'json', 'html-spa'],
			exclude: [
				'vitepress',
				'*/fixtures',
				'/*.{interface,type,d}.ts',
				'/{interfaces,types}/*.ts',
				'/index.{js,ts}',
				'**/exports/*.{js,ts}',
			],
		},
	},
});
