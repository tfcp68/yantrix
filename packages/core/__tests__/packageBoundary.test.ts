import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
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
		const [core, automata, sources, destinations, promises, storage, base, types] = await Promise.all([
			'@yantrix/core',
			'@yantrix/automata',
			'@yantrix/automata/DataSource',
			'@yantrix/automata/DataDestination',
			'@yantrix/automata/IOPromiseAdapter',
			'@yantrix/automata/Storage',
			'@yantrix/automata/mixins/BaseClass',
			'@yantrix/automata/types',
		].map(specifier => load(specifier)));
		const shared = {
			AbstractAgnosticDataSource: sources.AbstractAgnosticDataSource,
			createDataSourceAdapter: sources.createDataSourceAdapter,
			AbstractAgnosticDataDestination: destinations.AbstractAgnosticDataDestination,
			createDataDestinationAdapter: destinations.createDataDestinationAdapter,
			createPromiseDataAdapter: promises.createPromiseDataAdapter,
			AbstractAgnosticStorageAdapter: storage.AbstractAgnosticStorageAdapter,
			createStorageAdapter: storage.createStorageAdapter,
			AbstractBaseClass: base.AbstractBaseClass,
			WILDCARD_EVENT: types.WILDCARD_EVENT,
		};
		for (const [name, value] of Object.entries(shared)) {
			expect(value, name).toBeDefined();
			expect(automata[name], name).toBe(value);
			expect(core[name], name).toBe(value);
		}
	});

	it('exports the public mixin factories from their paths and the package roots', async () => {
		const [core, automata] = await Promise.all([load('@yantrix/core'), load('@yantrix/automata')]);
		const names = [
			'BasicActionContainer',
			'BasicEventContainer',
			'BasicStateContainer',
			'BasicValidatorContainer',
			'DictionaryContainer',
			'ExtendedActionContainer',
			'ExtendedEventContainer',
			'ExtendedStateContainer',
			'ExtendedValidatorContainer',
		];
		for (const name of names) {
			const mixin = await load(`@yantrix/automata/mixins/${name}`);
			expect(typeof mixin[name], name).toBe('function');
			expect(automata[name], name).toBe(mixin[name]);
			expect(core[name], name).toBe(mixin[name]);
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

it('rejects private Automata paths in native ESM and CommonJS', () => {
	execFileSync(process.execPath, [
		'--input-type=module',
		'--eval',
		`
			import assert from 'node:assert/strict';
			import { createRequire } from 'node:module';
			const require = createRequire(import.meta.url);
			for (const name of process.argv.slice(1)) {
				const expected = { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' };
				await assert.rejects(import(name), expected);
				assert.throws(() => require(name), expected);
			}
		`,
		'@yantrix/automata/types/internalsContext',
		'@yantrix/automata/dist/DataSource.js',
	], { cwd: fileURLToPath(new URL('..', import.meta.url)) });
});
