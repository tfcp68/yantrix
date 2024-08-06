import { defineConfig } from 'vitest/config';
import { VitestMarkdownReporter } from 'vitest-markdown-reporter';

export default defineConfig({
	test: {
		reporters: [
			'default',
			new VitestMarkdownReporter({
				title: 'Test Cases',
			}),
		],
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
			reporter: ['text', 'json-summary', 'json', 'html-spa'],
			exclude: [
				'vitepress',
				'*/fixtures',
				// All ts files that only contain types, due to ALL
				'/*.{interface,type,d}.ts',
				'/{interfaces,types}/*.ts',
				// All index files that *should* only contain exports from other files
				'/index.{js,ts}',
				// All exports files that make subpackages available as submodules
				'**/exports/*.{js,ts}',
			],
		},
	},
});
