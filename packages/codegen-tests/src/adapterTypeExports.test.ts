import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

const connectorTypes = {
	'providers/IntervalTimerDataSource': ['TIntervalTimerDataSourceProps', 'TIntervalTimerDataSourceDataPacket'],
	'providers/HTTPRequestAdapter': ['THTTPRequestAdapterProps', 'THTTPRequestAdapterRequest', 'THTTPRequestAdapterInput', 'THTTPRequestAdapterOutput'],
	'storage/InMemoryStorageAdapter': ['TInMemoryStorageAdapterProps'],
	'storage/LocalStorageAdapter': ['TLocalStorageAdapterProps', 'IKeyValueStorage'],
	'storage/IndexedDBStorageAdapter': [
		'TIndexedDBStorageAdapterProps',
		'IIndexedDBFactoryLike',
		'IIndexedDBOpenRequestLike',
		'IIndexedDBDatabaseLike',
		'IIndexedDBTransactionLike',
		'IIndexedDBObjectStoreLike',
		'IIndexedDBRequestLike',
		'TIndexedDBEventHandler',
	],
};

it('exports concrete adapter types from their package and module, and agnostic contracts from Automata and Core', () => {
	const options = { module: ts.ModuleKind.NodeNext, noEmit: true, types: [] };
	const modules = ['core', 'automata', 'providers', 'storage', ...Object.keys(connectorTypes)];
	const entries = Object.fromEntries(modules.map((name) => {
		const owner = name.split('/')[0];
		const consumer = fileURLToPath(new URL(`../../${owner}/consumer.mts`, import.meta.url));
		const specifier = `@yantrix/${name}`;
		const result = ts.resolveModuleName(
			specifier,
			consumer,
			options,
			ts.sys,
			undefined,
			undefined,
			ts.ModuleKind.ESNext,
		);
		if (!result.resolvedModule) throw new Error(`Cannot resolve ${specifier}`);
		return [name, result.resolvedModule.resolvedFileName] as const;
	}));

	const program = ts.createProgram(Object.values(entries), options);
	const checker = program.getTypeChecker();
	const exports = Object.fromEntries(Object.entries(entries).map(([name, entry]) => {
		const file = program.getSourceFile(entry)!;
		const members = checker.getExportsOfModule(checker.getSymbolAtLocation(file)!);
		const exported = members
			.filter((symbol) => {
				const declared = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
				return declared.flags & ts.SymbolFlags.Type;
			})
			.map(symbol => symbol.getName());
		return [name, new Set(exported)] as const;
	}));
	for (const [name, types] of Object.entries(connectorTypes)) {
		const owner = name.split('/')[0]!;
		for (const type of types) {
			expect(exports[name], name).toContain(type);
			expect(exports[owner], owner).toContain(type);
			expect(exports.automata).not.toContain(type);
			expect(exports.core).not.toContain(type);
		}
	}
	for (const contract of ['IStorageAdapter', 'TStorageAdapterProps', 'TStorageBinding', 'IDataSource', 'IDataDestination']) {
		expect(exports.automata).toContain(contract);
		expect(exports.core).toContain(contract);
	}
});
