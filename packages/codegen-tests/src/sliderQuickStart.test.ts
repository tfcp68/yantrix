import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import ts from 'typescript';
import { expect, it } from 'vitest';
import { generateAutomata } from './fixtures/utils';

const guide = fs.readFileSync(new URL('../../../docs/index.md', import.meta.url), 'utf8');

function readQuickStartBlock(language: string): string {
	const quickStart = guide.split('## Quick Start\n')[1]?.split('\n## ')[0];
	const block = quickStart?.split(`\`\`\`${language}\n`)[1]?.split('\n```')[0];
	if (!block) throw new Error(`Missing ${language} block in the Quick Start`);
	return block;
}

it('runs the Quick Start slider with the documented TypeScript controls', async () => {
	const directory = fs.mkdtempSync(fileURLToPath(new URL('./slider-example-', import.meta.url)));
	try {
		const machine = await generateAutomata({
			input: readQuickStartBlock('mermaid'),
			automataName: 'Slider',
			lang: ModuleNames.TypeScript,
		});
		fs.writeFileSync(path.join(directory, 'slider_controller.ts'), machine);
		const consumer = path.join(directory, 'controls.ts');
		fs.writeFileSync(consumer, readQuickStartBlock('typescript'));

		const program = ts.createProgram([consumer], {
			module: ts.ModuleKind.NodeNext,
			target: ts.ScriptTarget.ES2022,
			strict: true,
			skipLibCheck: true,
		});
		const diagnostics = ts.getPreEmitDiagnostics(program);
		expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([]);
		program.emit();

		const { slider, setPosition, moveLeft, moveRight, getValue, isDisabled } = await import(path.join(directory, 'controls.js'));
		const { Slider } = await import(path.join(directory, 'slider_controller.js'));
		expect(new Slider().getContext().context).toEqual({ min: 0, max: 100, value: 0 });
		expect(slider.getContext().context).toEqual({ min: -1000, max: 1000, value: -1000 });
		setPosition(0.5);
		expect(getValue()).toBe(0);
		moveRight();
		expect(getValue()).toBe(50);
		moveLeft();
		expect(getValue()).toBe(0);

		setPosition(2);
		expect(getValue()).toBe(1000);
		moveRight();
		expect(getValue()).toBe(1000);
		setPosition(-1);
		expect(getValue()).toBe(-1000);
		moveLeft();
		expect(getValue()).toBe(-1000);

		slider.dispatch(Slider.createAction('DISABLE', {}));
		setPosition(1);
		expect(isDisabled()).toBe(true);
		expect(getValue()).toBe(-1000);
		slider.dispatch(Slider.createAction('ENABLE', {}));
		expect(isDisabled()).toBe(false);
		slider.dispatch(Slider.createAction('INCREASE', {}));
		expect(getValue()).toBe(-999);
		slider.dispatch(Slider.createAction('DECREASE', { by: 0 }));
		expect(getValue()).toBe(-999);
		slider.dispatch(Slider.createAction('DISABLE', {}));
		slider.dispatch(Slider.createAction('RESET', {}));
		expect(isDisabled()).toBe(false);
		expect(slider.getContext().context).toEqual({ min: 0, max: 100, value: 0 });
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
}, 20000);
