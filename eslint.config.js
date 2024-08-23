import config from '@antfu/eslint-config';

export default config(
	{
		type: 'lib',
		stylistic: {
			indent: 'tab',
			jsx: 'preserve',
			quotes: 'single',
			semi: true,
		},
		typescript: true,
		javascript: true,
		gitignore: true,
		markdown: true,
		jsonc: false,
		test: true,
		vue: true,
		ignores: ['vitepress'],
	},
	{
		files: ['**/*.ts'],
		rules: {
			'ts/consistent-type-definitions': 'off',
			'ts/explicit-function-return-type': 'off',
			'ts/naming-convention': [
				'error',
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
				{
					selector: 'typeAlias',
					format: ['PascalCase'],
					custom: {
						regex: '^T\\w{3,}$',
						match: true,
					},
				},
				{
					selector: 'interface',
					format: ['PascalCase'],
					custom: {
						regex: '^I\\w{3,}$',
						match: true,
					},
				},
				{
					selector: 'typeParameter',
					format: ['PascalCase'],
					custom: {
						regex: '^\\w+',
						match: true,
					},
				},
			],
		},
	},
	{
		files: ['**/*.{js,ts}'],
		rules: {
			'eslint-comments/no-unlimited-disable': 'off',
			'node/prefer-global/process': 'off',
			'jsdoc/check-param-names': 'off',
			'antfu/if-newline': 'off',
			'no-console': [
				'warn',
				{
					allow: [
						'warn',
						'dir',
						'time',
						'timeEnd',
						'timeLog',
						'trace',
						'assert',
						'clear',
						'count',
						'countReset',
						'group',
						'groupEnd',
						'table',
						'debug',
						'info',
						'dirxml',
						'error',
						'groupCollapsed',
						'Console',
						'profile',
						'profileEnd',
						'timeStamp',
						'context',
					],
				},
			],
		},
	},
);
