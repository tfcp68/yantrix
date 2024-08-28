export default {
	'**/*.{mjs,js,cjs,ts,tsx,json}': 'eslint --fix',
	'src/**.ts': 'vitest related --run --config ../../vitest.config.ts',
};
