export default {
	'{src/**,__tests__/**}.{mjs,js,cjs,ts,tsx}': 'eslint --fix',
	'src/**.ts': 'vitest related --run --config ../../vitest.config.ts',
};
