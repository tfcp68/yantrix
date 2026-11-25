import { createTsupConfig } from '../../tsup.config.js';

export default createTsupConfig({
	entry: [
		'src/index.ts',
		'src/InMemoryStorageAdapter.ts',
		'src/IndexedDBStorageAdapter.ts',
		'src/LocalStorageAdapter.ts',
	],
	splitting: true,
});
