import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const loaders = [
	{ format: 'ES modules', load: (specifier: string) => import(specifier) },
	{ format: 'CommonJS', load: createRequire(import.meta.url) },
];

const concreteExports = [
	'IntervalTimerDataSource',
	'createHTTPRequestAdapter',
	'InMemoryStorageAdapter',
	'createInMemoryStorageAdapter',
	'LocalStorageAdapter',
	'createLocalStorageAdapter',
	'IndexedDBStorageAdapter',
	'createIndexedDBStorageAdapter',
];

describe.each(loaders)('published package exports in $format', ({ load }) => {
	it('shares agnostic classes, factories and symbols across entry points', async () => {
		const [core, automata, sources, storage, base, actions, types] = await Promise.all([
			'@yantrix/core',
			'@yantrix/automata',
			'@yantrix/automata/DataSource',
			'@yantrix/automata/Storage',
			'@yantrix/automata/mixins/BaseClass',
			'@yantrix/automata/mixins/BasicActionContainer',
			'@yantrix/automata/types',
		].map(specifier => load(specifier)));
		const shared = {
			AbstractAgnosticDataSource: sources.AbstractAgnosticDataSource,
			createDataSourceAdapter: sources.createDataSourceAdapter,
			AbstractAgnosticStorageAdapter: storage.AbstractAgnosticStorageAdapter,
			createStorageAdapter: storage.createStorageAdapter,
			AbstractBaseClass: base.AbstractBaseClass,
			BasicActionContainer: actions.BasicActionContainer,
			WILDCARD_EVENT: types.WILDCARD_EVENT,
		};
		for (const [name, value] of Object.entries(shared)) {
			expect(value, name).toBeDefined();
			expect(automata[name], name).toBe(value);
			expect(core[name], name).toBe(value);
		}
	});

	it('keeps concrete providers and storage connectors out of both roots', async () => {
		const roots = await Promise.all([load('@yantrix/core'), load('@yantrix/automata')]);
		for (const root of roots) {
			for (const name of concreteExports)
				expect(root).not.toHaveProperty(name);
		}
	});
});
