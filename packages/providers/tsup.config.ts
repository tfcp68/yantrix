import { createTsupConfig } from '../../tsup.config.js';

export default createTsupConfig({
	entry: [
		'src/index.ts',
		'src/HTTPRequestAdapter.ts',
		'src/IntervalTimerDataSource.ts',
	],
	splitting: true,
});
