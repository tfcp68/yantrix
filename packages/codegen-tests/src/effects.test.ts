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

	it('requires an explicit transformer for an event named constructor', async () => {
		const fixture = `effect_constructor_${extension}`;
		await generateAndSave({
			input: effectDiagram.replace('effect/modelUpdated', 'effect/constructor'),
			automataName: 'ConstructorEvent',
			lang: language,
		}, fixture);
		const generated = await import(generatedPath(fixture, extension));
		expect(() => generated.createConstructorEventEffectMatrix({})).toThrow(/"constructor" must be a function/);
		const transform = () => ({ count: 7 });
		expect(generated.createConstructorEventEffectMatrix({ constructor: transform }))
			.toEqual({ [generated.eventDictionary.constructor]: [transform] });
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

it.each([
	['emit/modelUpdated', '()'],
	['emit/modelUpdated ($reason) <= #{count}', '(reason)'],
	['emit/modelUpdated (#count, #count)', '(count, count)'],
	['emit/modelUpdated (3)', '(_item)'],
])('checks the emitted keys of %s against the Effect contract', async (producer, keys) => {
	const input = effectDiagram.replace('+Init', `+Init\n\t\t${producer}`);
	await expect(generateAutomata({
		input,
		automataName: 'ConflictingEmitter',
		lang: ModuleNames.TypeScript,
	})).rejects.toThrow(`in state "INIT": expected (count), got ${keys}`);
});

it.each([
	[ModuleNames.JavaScript, 'js'],
	[ModuleNames.TypeScript, 'ts'],
] as const)('matches reordered, aliased and defaulted keys across producers in %s', async (lang, extension) => {
	const input = effectDiagram
		.replace('+Init', '+Init\n\t\teffect/modelUpdated <= (count, label)')
		.replace('effect/modelUpdated <= (count)', [
			'emit/modelUpdated ($label, $count=2) <= #{displayName}',
			'effect/modelUpdated <= (label, count)',
		].join('\n\t\t'));
	const fixture = `matching_effect_events_${extension}`;
	await generateAndSave({
		input,
		automataName: 'MatchingEffectEvents',
		lang,
	}, fixture);
	const generated = await import(generatedPath(fixture, extension));
	const adapter = generated.createMatchingEffectEventsEventAdapter();
	const context = { count: 1, label: 'state', displayName: 'source' };
	const initial = adapter.handleTransition({ state: generated.statesDictionary.INIT, context });
	const applied = adapter.handleTransition({ state: generated.statesDictionary.APPLIED, context });

	expect(Object.keys(initial[0].meta)).toEqual(['count', 'label']);
	expect(applied.map((event: { meta: object }) => Object.entries(event.meta))).toEqual([
		[['label', 'source'], ['count', 2]],
		[['label', 'state'], ['count', 1]],
	]);
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
