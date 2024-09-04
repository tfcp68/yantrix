import config from '@antfu/eslint-config';

const consoleAllowedMethods = [
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
			jsx: true,
			quotes: 'single',
			semi: true,
		},
		gitignore: true,
		markdown: true,
		jsonc: true,
		test: true,
		yaml: true,
		vue: true,
		ignores: ['**/*_generated.*'],
		typescript: {
			overrides: {
				'ts/consistent-type-imports': ['error', { prefer: 'no-type-imports' }],
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
	},
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		rules: {
			'eslint-comments/no-unlimited-disable': 'off',
			'unicorn/consistent-function-scoping': 'off',
			'style/newline-per-chained-call': 'warn',
			'node/prefer-global/process': 'off',
			'antfu/top-level-function': 'off',
			'jsdoc/check-param-names': 'off',
			'antfu/if-newline': 'off',
			'style/brace-style': ['error', '1tbs', {
				allowSingleLine: true,
			}],
			'no-console': ['warn', {
				allow: consoleAllowedMethods,
			}],
			'style/max-len': ['warn', {
				code: 80,
				ignoreTrailingComments: true,
				ignoreTemplateLiterals: true,
				ignoreRegExpLiterals: true,
				ignoreComments: true,
				ignoreStrings: true,
				ignoreUrls: true,
				tabWidth: 4,
			}],
		},
	},
);
