import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import ts from 'typescript';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { generateAutomata } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(dirname, '../../../docs');
let directory: string;

beforeEach(() => {
	directory = fs.mkdtempSync(path.join(dirname, 'mvp-example-'));
	fs.mkdirSync(path.join(directory, 'generated'));
});

afterEach(() => {
	vi.unstubAllGlobals();
	fs.rmSync(directory, { recursive: true, force: true });
});

// Compile the guide's own program. The extra exports let tests inspect its state after running it.
async function runGuide(file: string, machine: string, inspect: string[], fixtureDiagram?: string) {
	const markdown = fs.readFileSync(path.join(docs, file), 'utf8');
	const diagram = fixtureDiagram ?? markdown.match(/^```mermaid\r?\n(stateDiagram-v2[\s\S]*?)^```/m)?.[1];
	if (!diagram) throw new Error(`Missing state diagram for ${file}`);
	const generated = await generateAutomata({ input: diagram, automataName: machine, lang: ModuleNames.TypeScript });
	fs.writeFileSync(path.join(directory, 'generated', `${machine}.ts`), generated);

	const blocks = Array.from(markdown.matchAll(/^```(?:ts|typescript)\r?\n([\s\S]*?)^```/gm), match => match[1]);
	const entry = path.join(directory, 'guide.ts');
	fs.writeFileSync(entry, [...blocks, `export { ${inspect.join(', ')} };`].join('\n\n'));
	const program = ts.createProgram([entry], {
		module: ts.ModuleKind.NodeNext,
		target: ts.ScriptTarget.ES2022,
		types: ['node'],
		strict: true,
		noUncheckedIndexedAccess: true,
		noEmitOnError: true,
	});
	const diagnostics = ts.getPreEmitDiagnostics(program);
	expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')), file).toEqual([]);
	program.emit();
	return import(path.join(directory, 'guide.js'));
}

it('runs the documented counter commands and preserves the snapshot for a no-op', async () => {
	const { coreLoop, createCounterStore, eventDictionary, modelStore } = await runGuide(
		'examples/500_effect_counter.md',
		'CounterFlow',
		['coreLoop', 'createCounterStore', 'eventDictionary', 'modelStore'],
	);
	const increment = async (amount: number) => {
		coreLoop.getBus().dispatch({ event: eventDictionary.increment, meta: { amount } });
		await coreLoop.whenIdle();
	};

	const atMaximum = modelStore.get();
	expect(atMaximum.score).toBe(10);
	expect(Object.isFrozen(atMaximum)).toBe(false);
	expect(Object.isFrozen(createCounterStore({ score: 0, maximum: 10 }, true).get())).toBe(true);
	const invalidCounter = { score: Number.NaN, maximum: 10 };
	expect(createCounterStore(invalidCounter).get()).toBe(invalidCounter);
	expect(() => createCounterStore(invalidCounter, true)).toThrow(/numbers must be finite/);
	const notify = vi.fn();
	modelStore.subscribe(notify);
	await increment(1);
	expect(modelStore.get()).toBe(atMaximum);
	expect(notify).not.toHaveBeenCalled();

	modelStore.commit({ ...atMaximum, score: 3 });
	const belowMaximum = modelStore.get();
	notify.mockClear();
	await increment(0);
	expect(modelStore.get()).toBe(belowMaximum);
	expect(notify).not.toHaveBeenCalled();
	coreLoop.stop();
}, 30000);

function todoStorage() {
	const values = new Map<string, string>();
	const localStorage = {
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
		removeItem: (key: string) => { values.delete(key); },
	};
	vi.stubGlobal('window', { localStorage });
	return { values, localStorage };
}

const todoFile = 'examples/1000_todo.md';
const todoKey = 'yantrix:todo-list:v1';

it('finishes a Todo command dispatched immediately before shutdown and persists the item', async () => {
	const { values } = todoStorage();
	const { addTodo, shutdown, modelStore } = await runGuide(todoFile, 'TodoFlow', ['modelStore', 'shutdown']);
	const pending = addTodo('last', 'Finish before shutdown');
	const closing = shutdown();
	await expect(addTodo('late', 'After shutdown began')).rejects.toThrow();
	await Promise.all([pending, closing]);
	const saved = JSON.parse(values.get(todoKey)!);
	expect(modelStore.get().items.last).toEqual({ id: 'last', text: 'Finish before shutdown' });
	expect(modelStore.get().items.late).toBeUndefined();
	expect(saved).toEqual(modelStore.get());
}, 30000);

it('re-enters Todo command states and ignores malformed metadata without committing', async () => {
	todoStorage();
	const guide = await runGuide(
		todoFile,
		'TodoFlow',
		['coreLoop', 'createTodoStore', 'eventDictionary', 'modelStore', 'shutdown', 'todoSlice'],
	);
	const { addTodo, removeTodo, clearTodos, createTodoStore, eventDictionary, modelStore, coreLoop } = guide;
	const added = modelStore.get();
	expect(Object.isFrozen(added.items)).toBe(false);
	expect(Object.isFrozen(createTodoStore({ items: {} }, true).get().items)).toBe(true);
	const invalidTodos = { items: { invalid: { id: 'invalid', text: undefined } } };
	expect(createTodoStore(invalidTodos).get()).toBe(invalidTodos);
	expect(() => createTodoStore(invalidTodos, true)).toThrow(/not serializable/);
	expect(added.items.first).toBeDefined();

	await addTodo('42', 'Keep the numeric-looking ID');
	await addTodo('[object Object]', 'Keep the object-looking ID');
	const beforeMalformed = modelStore.get();
	for (const bad of [42, {}]) {
		for (const [event, meta] of [
			[eventDictionary.addTodo, { id: bad, text: 'Invalid ID' }],
			[eventDictionary.addTodo, { id: 'invalid', text: bad }],
			[eventDictionary.removeTodo, { id: bad }],
		]) {
			coreLoop.getBus().dispatch({ event, meta });
			await coreLoop.whenIdle();
			expect(modelStore.get()).toBe(beforeMalformed);
		}
	}

	await removeTodo('42');
	await removeTodo('first');
	expect(Object.keys(modelStore.get().items)).toEqual(['[object Object]']);
	await addTodo('again', 'After remove');
	expect(modelStore.get().items.again.text).toBe('After remove');
	const emissions = vi.fn();
	guide.todoSlice.getMachines().TodoFlow.onEmittedEvents(emissions);
	await clearTodos();
	const cleared = modelStore.get();
	expect(cleared.items).toEqual({});
	await clearTodos();
	expect(modelStore.get()).toBe(cleared);
	expect(emissions).toHaveBeenCalledTimes(2);
	expect(emissions).toHaveBeenNthCalledWith(1, [expect.objectContaining({ event: eventDictionary.todosCleared })]);
	expect(emissions).toHaveBeenNthCalledWith(2, [expect.objectContaining({ event: eventDictionary.todosCleared })]);
	await addTodo('last', 'After clear');
	expect(modelStore.get().items.last.text).toBe('After clear');
	await guide.shutdown();
}, 30000);

it('keeps the stored Todo list intact after a failed hydration', async () => {
	const { values, localStorage } = todoStorage();
	const original = '{"items":{"existing":{"id":"existing","text":"Saved before startup"}}}';
	values.set(todoKey, original);
	localStorage.getItem.mockImplementationOnce(() => {
		throw new Error('Temporary read failure');
	});
	const { shutdown } = await runGuide(todoFile, 'TodoFlow', ['shutdown']);
	await shutdown();
	expect(localStorage.getItem).toHaveBeenCalledWith(todoKey);
	expect(localStorage.setItem).not.toHaveBeenCalled();
	expect(values.get(todoKey)).toBe(original);
}, 30000);

it('runs the migration guide against a generated Cart', async () => {
	const diagram = fs.readFileSync(path.join(dirname, 'fixtures/migrationCart.mermaid'), 'utf8');
	const { modelStore, coreLoop, eventDictionary } = await runGuide(
		'integrations/190_core_migration.md',
		'Cart',
		['modelStore', 'coreLoop', 'eventDictionary'],
		diagram,
	);
	const afterAdd = modelStore.get();
	expect(afterAdd.cart.productIds).toEqual(['coffee']);
	coreLoop.getBus().dispatch({ event: eventDictionary.addProduct, meta: { productId: 123 } });
	await coreLoop.whenIdle();
	expect(modelStore.get()).toBe(afterAdd);
	coreLoop.stop();
}, 30000);
