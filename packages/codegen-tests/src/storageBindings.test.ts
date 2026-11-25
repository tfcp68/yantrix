import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateStorageBindings, ModuleNames } from '@yantrix/codegen';
import { hydrateModel, ModelStore, StorageSyncLoop } from '@yantrix/core';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const fixtures = fileURLToPath(new URL('./fixtures/storage/', import.meta.url));
const directory = mkdtempSync(path.join(fixtures, 'generated-'));
const compilerOptions = {
	module: ts.ModuleKind.NodeNext,
	target: ts.ScriptTarget.ES2022,
	strict: true,
	skipLibCheck: true,
};

beforeAll(() => {
	const sources = ['preferences.ts', 'memory.ts', 'file.ts'].map(file => path.join(fixtures, file));
	const program = ts.createProgram(sources, { ...compilerOptions, declaration: true, outDir: directory });
	const diagnostics = ts.getPreEmitDiagnostics(program);
	expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([]);
	program.emit();
});
afterAll(() => rmSync(directory, { recursive: true, force: true }));

function preferences(connector: string) {
	return {
		name: 'user-preferences',
		connector: { module: `./${connector}.js`, exportName: 'connect' },
		mapper: { module: './preferences.js', exportName: 'preferencesMapper' },
	};
}

describe('programmatic storage bindings', () => {
	it.each([ModuleNames.JavaScript, ModuleNames.TypeScript])('round-trips the same projection across connectors in %s', async (outLang) => {
		const initial = { theme: 'light', dialogOpen: false };
		const filename = path.join(directory, `saved-${outLang}.txt`);

		for (const driver of ['memory', 'file']) {
			const output = generateStorageBindings({ outLang, bindings: [preferences(driver)] });
			expect(output).toContain(`./${driver}.js`);
			expect(output).not.toContain(driver === 'memory' ? './file.js' : './memory.js');

			const extension = outLang === ModuleNames.JavaScript ? 'js' : 'ts';
			const entry = path.join(directory, `${driver}-${outLang}.${extension}`);
			writeFileSync(entry, output);
			const { createStorageBindings } = await import(entry);
			const bindings = createStorageBindings({ 'user-preferences': [filename] });
			const store = new ModelStore(initial);
			const loop = new StorageSyncLoop({ store, bindings, session: null }).start();
			store.commit({ theme: 'dark', dialogOpen: true });
			await loop.stop(true);

			expect(loop.getFailures()).toEqual([]);
			const restored = await hydrateModel(initial, bindings);
			expect(restored.failures).toEqual([]);
			expect(restored.loadedStorageIds).toEqual([filename]);
			expect(restored.model).toEqual({ theme: 'dark', dialogOpen: false });
		}
		expect(readFileSync(filename, 'utf8')).toBe('dark');
	});

	it('checks connector arguments and snapshot compatibility in the generated TypeScript module', () => {
		const memory = preferences('memory');
		const file = { ...preferences('file'), name: 'archive' };
		const typed = path.join(directory, 'typed.ts');
		writeFileSync(typed, generateStorageBindings({ bindings: [memory, file] }));
		const consumer = path.join(directory, 'consumer.ts');
		writeFileSync(consumer, `
			import { createStorageBindings } from './typed.js';
			import { hydrateModel } from '@yantrix/core';

			const bindings = createStorageBindings({ 'user-preferences': ['user'], archive: ['db', 'utf8'] });
			hydrateModel({ theme: 'light', dialogOpen: false }, bindings);
			// @ts-expect-error the memory connector requires a string id
			createStorageBindings({ 'user-preferences': [123], archive: ['db'] });
			// @ts-expect-error the file connector requires a valid encoding
			createStorageBindings({ 'user-preferences': ['user'], archive: ['db', 'invalid'] });
		`);
		const incompatible = path.join(directory, 'incompatible.ts');
		writeFileSync(incompatible, generateStorageBindings({
			bindings: [{ ...memory, connector: { ...memory.connector, exportName: 'connectNumbers' } }],
		}));

		const program = ts.createProgram([typed, incompatible], {
			...compilerOptions,
			declaration: true,
			emitDeclarationOnly: true,
		});
		const diagnostics = ts.getPreEmitDiagnostics(program);
		const unexpected = diagnostics.filter(diagnostic => diagnostic.file?.fileName !== incompatible);
		expect(unexpected.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([]);
		expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'))
			.toMatch(/number.*string|string.*number/s);
		expect(program.emit(program.getSourceFile(typed)).diagnostics).toEqual([]);
		// Resolve the consumer against the emitted .d.ts with the mapper's private model type.
		rmSync(typed);
		const consumerDiagnostics = ts.getPreEmitDiagnostics(ts.createProgram([consumer], compilerOptions));
		expect(consumerDiagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([]);
	}, 20000);

	it('emits a factory that needs no arguments or imports for an empty application', async () => {
		const output = generateStorageBindings({ bindings: [], outLang: ModuleNames.JavaScript });
		expect(output).not.toMatch(/\bimport\b/);
		const entry = path.join(directory, 'empty.js');
		writeFileSync(entry, output);
		const { createStorageBindings } = await import(entry);
		expect(createStorageBindings()).toEqual([]);
	});

	it('rejects duplicate binding names and malformed module references during generation', () => {
		const binding = preferences('memory');
		expect(() => generateStorageBindings({ bindings: [binding, binding] })).toThrow(/duplicate.*user-preferences/i);
		expect(() => generateStorageBindings({
			bindings: [{ ...binding, connector: { module: ' ', exportName: 'connect' } }],
		})).toThrow(/connector/i);
		expect(() => generateStorageBindings({
			bindings: [{ ...binding, mapper: { module: '../preferences.js', exportName: 'invalid.name' } }],
		})).toThrow(/mapper/i);
	});

	it.each([ModuleNames.Java, ModuleNames.PureJavaScript, ModuleNames.PureTypeScript])(
		'rejects the unsupported %s dialect passed by a JavaScript caller',
		(outLang) => {
			expect(() => generateStorageBindings({
				// @ts-expect-error Java and the standalone FSM dialects are outside the public storage API.
				outLang,
				bindings: [],
			})).toThrow(`Unsupported storage bindings language: ${outLang}`);
		},
	);
});
