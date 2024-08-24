import config from '@antfu/eslint-config';

const allowedConsoleMethods = [
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
];

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
		jsonc: true,
		test: true,
		yaml: true,
		vue: true,
		ignores: ['**/*_generated.*'],
	},
	{
		files: ['**/*.{ts,md,mdx}'],
		rules: {
			'ts/explicit-function-return-type': 'off',
			'ts/consistent-type-definitions': 'off',
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
		files: ['**/*.{js,ts,md,mdx}'],
		rules: {
			'no-console': ['warn', { allow: allowedConsoleMethods }],
			'node/prefer-global/process': 'off',
			'jsdoc/check-param-names': 'off',
			'antfu/if-newline': 'off',
		},
	},
	{
		files: ['**/*_generated.*', '**/yantrixParser.ts'],
		rules: {
			'eslint-comments/no-unlimited-disable': 'off',
		},
	},
);
