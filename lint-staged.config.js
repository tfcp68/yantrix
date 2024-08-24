export default {
	'*': 'eslint --fix',
	'src/**.ts': 'vitest related --run --config ../../vitest.config.ts',
};
