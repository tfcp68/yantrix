import { mergeConfig } from 'vite';
import { VitestMarkdownReporter } from 'vitest-markdown-reporter';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
	test: {
		reporters: [
			'default',
			new VitestMarkdownReporter({
				title: 'Feedback Machine — Yantrix',
				outputPath: '../../../test_reports/yantrix-feedback-machine.md',
			}),
		],
	},
}));
