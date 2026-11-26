import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('type-checks and runs the public model helpers in strict ESM and CommonJS consumers', () => {
	const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
	const directory = mkdtempSync(path.join(fixtures, 'consumer-'));
	try {
		const entries = ['mts', 'cts'].map((extension) => {
			const entry = path.join(directory, `consumer.${extension}`);
			copyFileSync(path.join(fixtures, 'modelConsumer.ts'), entry);
			return entry;
		});
		const program = ts.createProgram(entries, {
			module: ts.ModuleKind.NodeNext,
			target: ts.ScriptTarget.ES2022,
			lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
			types: [],
			strict: true,
			noUncheckedIndexedAccess: true,
			noEmitOnError: true,
		});
		const diagnostics = ts.getPreEmitDiagnostics(program);
		expect(diagnostics.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n'))).toEqual([]);
		program.emit();
		for (const extension of ['mjs', 'cjs'])
			execFileSync(process.execPath, [path.join(directory, `consumer.${extension}`)]);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}, 30000);
