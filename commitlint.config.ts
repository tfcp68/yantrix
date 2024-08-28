import { UserConfig } from '@commitlint/types';

export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'chore',
				'build',
				'ci',
				'docs',
				'feat',
				'fix',
				'perf',
				'refactor',
				'revert',
				'style',
				'test',
				'types',
				'typings',
				'merge',
			],
		],
		'scope-case': [0],
	},
} satisfies UserConfig;
