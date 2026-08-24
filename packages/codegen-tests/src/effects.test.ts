import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { CoreLoop, EffectScheduler, ModelStore } from '@yantrix/core';
import { describe, expect, it } from 'vitest';

import { generateAndSave, generateAutomata } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedPath = (name: string, extension: 'js' | 'ts') =>
	path.resolve(dirname, 'fixtures/generated', `${name}_generated.${extension}`);

const effectDiagram = `stateDiagram-v2
	[*] --> INIT: Init
	INIT --> APPLIED: APPLY

	note right of INIT
		+Init
		subscribe/apply APPLY
	end note

	note right of APPLIED
		#{count = 7}
		effect/modelUpdated <= (count)
	end note
`;

describe.each([
	[ModuleNames.JavaScript, 'js' as const],
	[ModuleNames.TypeScript, 'ts' as const],
])('effect codegen: %s', (language, extension) => {
	it('generates a named Effect Matrix and a complete Slice factory', async () => {
		const source = await generateAutomata({
			input: effectDiagram,
			automataName: 'EffectfulAutomata',
			lang: language,
		});

		expect(source).toContain('createEffectfulAutomataEffectMatrix');
		expect(source).toContain('createEffectfulAutomataSlice');
		expect(source).toContain('[eventDictionary["modelUpdated"]]');
		expect(source).toContain('new AutomataSlice');
		if (language === ModuleNames.TypeScript) {
			expect(source).toContain('TEffectfulAutomataDataModel');
			expect(source).toContain('TEffectfulAutomataEventMeta');
			expect(source).toContain('TEffectfulAutomataModelTransformers');
		}
	});

	it('runs generated Event → Model Transformer wiring through CoreLoop.registerSlice', async () => {
		const fixtureName = `effect_slice_${extension}`;
		await generateAndSave({
			input: effectDiagram,
			automataName: 'EffectfulAutomata',
			lang: language,
		}, fixtureName);
		const generated = await import(generatedPath(fixtureName, extension));

		interface IModel { count: number }
		const store = new ModelStore<IModel>({ count: 0 });
		const scheduler = new EffectScheduler<IModel, number, Record<number, unknown>>({ store });
		const loop = new CoreLoop<number, Record<number, unknown>, IModel>({ effectScheduler: scheduler });
		const slice = generated.createEffectfulAutomataSlice({
			modelUpdated: (event: { meta: { count?: number } | null }, model: Readonly<IModel>) => ({
				...model,
				count: event.meta?.count ?? model.count,
			}),
		});

		loop.registerSlice(slice);
		loop.getBus().dispatch({ event: generated.eventDictionary.apply, meta: null });
		await loop.whenIdle();

		expect(store.get()).toEqual({ count: 7 });
		expect(Object.keys(slice.getMachines())).toHaveLength(1);
		expect(slice.getEventEffects(generated.eventDictionary.modelUpdated)).toHaveLength(1);
	});

	it('fails early when a declared Model Transformer is missing', async () => {
		const fixtureName = `effect_missing_transformer_${extension}`;
		await generateAndSave({
			input: effectDiagram,
			automataName: 'EffectfulAutomata',
			lang: language,
		}, fixtureName);
		const generated = await import(generatedPath(fixtureName, extension));

		expect(() => generated.createEffectfulAutomataEffectMatrix({})).toThrow(
			/Model Transformer "modelUpdated" must be a function/,
		);
	});
});

it('rejects conflicting Event Meta contracts for the same Effect', async () => {
	const input = `stateDiagram-v2
		[*] --> A: Init
		A --> B: NEXT
		note right of A
			+Init
			effect/save <= (count)
		end note
		note right of B
			effect/save <= (value)
		end note
	`;

	await expect(generateAutomata({
		input,
		automataName: 'ConflictingEffects',
		lang: ModuleNames.TypeScript,
	})).rejects.toThrow(/conflicting Event Meta/i);
});

it('preserves declaration order when a state emits a regular Event and an Effect Event', async () => {
	const input = effectDiagram.replace(
		'effect/modelUpdated <= (count)',
		'emit/notification\n\t\teffect/modelUpdated <= (count)',
	);
	await generateAndSave({
		input,
		automataName: 'OrderedEffectEvents',
		lang: ModuleNames.JavaScript,
	}, 'ordered_effect_events');
	const generated = await import(generatedPath('ordered_effect_events', 'js'));
	const adapter = generated.createOrderedEffectEventsEventAdapter();

	const emitted = adapter.handleTransition({
		state: generated.statesDictionary.APPLIED,
		context: { count: 7 },
	});

	expect(emitted.map((event: { event: number }) => event.event)).toEqual([
		generated.eventDictionary.notification,
		generated.eventDictionary.modelUpdated,
	]);
});

it.each([
	ModuleNames.Java,
	ModuleNames.Python,
	ModuleNames.PureJavaScript,
	ModuleNames.PureTypeScript,
])('rejects Side Effects for an output dialect without Effect Matrix support: %s', async (language) => {
	await expect(generateAutomata({
		input: effectDiagram,
		automataName: 'UnsupportedEffectAutomata',
		lang: language,
	})).rejects.toThrow(/Side Effects codegen is not supported/);
});
