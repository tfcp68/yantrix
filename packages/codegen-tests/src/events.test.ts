import fs from 'node:fs';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { AutomataEventAdapter, BasicEventBus } from '@yantrix/core';
import ts from 'typescript';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import templates from './fixtures/eventsTemplates';
import { generateAndSave, generateAutomata, saveFile } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe.each([
	[ModuleNames.JavaScript, 'js'],
	[ModuleNames.TypeScript, 'ts'],
] as const)('generated %s event bus', (lang, extension) => {
	it.each([
		[undefined, [1, 2]],
		['fifo', [1, 2]],
		['lifo', [2, 1]],
	] as const)('delivers buffered events with order %s', async (eventBusOrder, expected) => {
		const fixture = `event_order_${extension}_${eventBusOrder ?? 'default'}`;
		await generateAndSave({ input: templates.basicSubscribe, automataName: 'Ordered', lang, eventBusOrder }, fixture);
		const { createEventBus } = await import(getGeneratedFixturePath(`${fixture}_generated.${extension}`));
		const [bus, , cleanup] = createEventBus('ordered', {});
		const seen: Array<number | null> = [];
		const record: Parameters<BasicEventBus['subscribe']>[1] = (entry) => {
			seen.push(entry.event);
			return { ...entry, task_id: 'record', result: null };
		};
		bus.subscribe(1, record).subscribe(2, record);
		bus.pause().dispatch({ event: 1, meta: null }, { event: 2, meta: null });
		expect(seen).toEqual([]);
		bus.resume();
		await bus.whenIdle();
		expect(seen).toEqual(expected);
		cleanup();
	});
});

it('types a generated ordered bus and cleanup for TypeScript consumers', async () => {
	const machine = await generateAutomata({
		input: templates.basicSubscribe,
		automataName: 'Ordered',
		lang: ModuleNames.TypeScript,
		eventBusOrder: 'lifo',
	});
	saveFile('event_order_types', machine, 'ts');
	saveFile('event_order_consumer', `
		import { createEventBus } from './event_order_types_generated.js';
		const [bus, , cleanup] = createEventBus('example', {});
		bus.pause().dispatch({ event: 1, meta: null }, { event: 2, meta: null }).resume();
		await bus.whenIdle();
		cleanup();
	`, 'ts');

	const program = ts.createProgram([getGeneratedFixturePath('event_order_consumer_generated.ts')], {
		module: ts.ModuleKind.NodeNext,
		target: ts.ScriptTarget.ES2022,
		strict: true,
		skipLibCheck: true,
	});
	const diagnostics = ts.getPreEmitDiagnostics(program);
	expect(diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
}, 20000);

describe('event bus order option validation', () => {
	it('rejects an unknown order from a JavaScript caller', async () => {
		await expect(generateAutomata({
			input: templates.basicEvents,
			automataName: 'Ordered',
			lang: ModuleNames.JavaScript,
			// @ts-expect-error Exercise the untyped API boundary.
			eventBusOrder: 'random',
		})).rejects.toThrow(/eventBusOrder.*fifo.*lifo/);
	});

	it.each(['fifo', 'lifo'] as const)('rejects an explicit %s order on Java', async (eventBusOrder) => {
		await expect(generateAutomata({
			input: templates.defaultTemplate,
			automataName: 'Ordered',
			lang: ModuleNames.Java,
			eventBusOrder,
		})).rejects.toThrow(/eventBusOrder.*Java/);
	});
});

describe('automata Events', () => {
	describe('per-instance event adapter factory', async () => {
		const factoryName = 'createEventFactoryAutomataEventAdapter';

		it('typescript exports the factory and the class constructs from it', async () => {
			const code = await generateAutomata({ input: templates.basicEvents, automataName: 'EventFactoryAutomata', lang: ModuleNames.TypeScript });
			expect(code).toContain(`export function ${factoryName}(`);
			expect(code).toContain(`super(${factoryName}())`);
			expect(code).not.toContain('export const eventAdapter');
		});

		it('pure-javascript exports the factory and the functional factory constructs from it', async () => {
			const code = await generateAutomata({ input: templates.basicEvents, automataName: 'EventFactoryAutomata', lang: ModuleNames.PureJavaScript });
			expect(code).toContain(`export function ${factoryName}(`);
			expect(code).toContain(`const eventAdapter = ${factoryName}();`);
		});

		it('class instances each get their own adapter (no shared singleton)', async () => {
			await generateAndSave({ input: templates.basicEvents, automataName: 'EventFactoryAutomata', lang: ModuleNames.JavaScript }, `event_factory_class`);
			const mod = await import(getGeneratedFixturePath('event_factory_class_generated.js'));
			expect(typeof mod[factoryName]).toBe('function');
			const a = new mod.EventFactoryAutomata();
			const b = new mod.EventFactoryAutomata();
			expect(a.eventAdapter).toBeTruthy();
			expect(b.eventAdapter).toBeTruthy();
			expect(a.eventAdapter).not.toBe(b.eventAdapter);
		});

		it('functional instances each get their own adapter (no shared singleton)', async () => {
			await generateAndSave({ input: templates.basicEvents, automataName: 'EventFactoryAutomata', lang: ModuleNames.PureJavaScript }, `event_factory_functional`);
			const mod = await import(getGeneratedFixturePath('event_factory_functional_generated.js'));
			expect(typeof mod[factoryName]).toBe('function');
			const a = mod.createEventFactoryAutomata();
			const b = mod.createEventFactoryAutomata();
			expect(a.eventAdapter).toBeTruthy();
			expect(b.eventAdapter).toBeTruthy();
			expect(a.eventAdapter).not.toBe(b.eventAdapter);
		});

		it('pure-typescript declares the factory in the .d.ts', async () => {
			await generateAndSave({ input: templates.basicEvents, automataName: 'EventFactoryAutomata', lang: ModuleNames.PureTypeScript }, `event_factory_pts`);
			const dts = fs.readFileSync(getGeneratedFixturePath('event_factory_pts_generated.d.ts'), 'utf8');
			expect(dts).toContain(`export declare function ${factoryName}(): TEventAdapter;`);
		});

		it('factory adapter is pre-loaded with diagram events', async () => {
			await generateAndSave({ input: templates.basicEvents, automataName: 'EventFactoryAutomata', lang: ModuleNames.JavaScript }, `event_factory_class`);
			const mod = await import(getGeneratedFixturePath('event_factory_class_generated.js'));
			const adapter = mod[factoryName]();
			expect(adapter.getObservedEvents()).toStrictEqual([mod.eventDictionary.someEvent]);
		});
	});

	describe('event Adapter', async () => {
		await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventAdapterAutomata', lang: ModuleNames.JavaScript }, `event_adapter`);
		const { EventAdapterAutomata } = await import(
			getGeneratedFixturePath('event_adapter_generated.js')
		);

		const automata = new EventAdapterAutomata();
		const adapter = automata.eventAdapter;

		beforeEach(() => {
			if (adapter) {
				adapter.removeAllEmitters();
				adapter.removeAllListeners();
			}
		});

		it('automata has an Event Adapter', async () => {
			expect(adapter).toBeTruthy();
		});

		it('event Adapter is pre-loaded with events from diagram', async () => {
			await generateAndSave({ input: templates.basicEvents, automataName: 'BasicEventsAutomata', lang: ModuleNames.JavaScript }, `event_basicEvents`);
			const { BasicEventsAutomata, eventDictionary, statesDictionary } = await import(
				getGeneratedFixturePath('event_basicEvents_generated.js')
			);
			const automata = new BasicEventsAutomata();
			const adapter = automata.eventAdapter;
			expect(adapter.getObservedStates()).toStrictEqual([statesDictionary.INIT]);
			expect(adapter.getObservedEvents()).toStrictEqual([eventDictionary.someEvent]);
		});

		it('can add new Event Emitters to Adapter', async () => {
			const current = adapter.getObservedStates().length;
			adapter.addEventEmitter(1234567, ({ context }: { state: number | null; context: any }) => {
				return {
					event: 1288516255,
					meta: {
						someValue: context.someValue ?? 0,
					},
				};
			});
			expect(adapter.getObservedStates().length).toBe(current + 1);
		});

		it('can add new Event Listeners to Adapter', async () => {
			const current = adapter.getObservedEvents().length;
			adapter.addEventListener(1234567, ({ meta }: { event: number | null; meta: any }) => {
				return {
					action: 123123123,
					payload: {
						someValue: meta.someValue ?? 0,
					},
				};
			});
			expect(adapter.getObservedEvents().length).toBe(current + 1);
		});

		it('can set new Event Adapter', () => {
			const newAdapter = new AutomataEventAdapter();
			newAdapter.addEventEmitter(1234567, ({ context }: { state: number | null; context: any }) => {
				return {
					event: 1288516255,
					meta: {
						someValue: context.someValue ?? 0,
					},
				};
			});
			newAdapter.addEventListener(1234567, ({ meta }: { event: number | null; meta: any }) => {
				return {
					action: 123123123,
					payload: {
						someValue: meta.someValue ?? 0,
					},
				};
			});
			assert.notEqual(automata.eventAdapter, newAdapter);
			assert.notEqual(automata.eventAdapter.getObservedEvents().length, newAdapter.getObservedEvents().length);
			assert.notEqual(automata.eventAdapter.getObservedStates().length, newAdapter.getObservedStates().length);
			automata.setEventAdapter(newAdapter);
			assert.equal(automata.eventAdapter, newAdapter);
		});
	});

	describe('event interactions', () => {
		it.each([
			[ModuleNames.JavaScript, 'js'],
			[ModuleNames.TypeScript, 'ts'],
		] as const)('delivers one event for each committed %s transition', async (lang, extension) => {
			const input = `stateDiagram-v2
[*] --> Idle
Idle --> Ready: LOGIN
Ready --> Ready: REFRESH
note right of Idle
  +Init
  subscribe/login LOGIN
  subscribe/refresh REFRESH
end note
note right of Ready
  emit/sessionStarted
end note`;
			const fixture = `event_committed_${extension}`;
			await generateAndSave({ input, automataName: 'Session', lang }, fixture);
			const { Session, createEventBus, eventDictionary, statesDictionary } = await import(
				getGeneratedFixturePath(`${fixture}_generated.${extension}`),
			);
			const [bus, machines, cleanup] = createEventBus('sessions', { session: Session });
			const machine = machines.session;
			const emit = vi.spyOn(machine.eventAdapter, 'handleTransition');
			const delivered = vi.fn();
			bus.subscribe(eventDictionary.sessionStarted, delivered);
			const send = async (event: number) => {
				bus.dispatch({ event, meta: {} });
				await setImmediate();
			};

			await send(eventDictionary.login);
			expect(machine.state).toBe(statesDictionary.Ready);
			expect(emit).toHaveBeenCalledTimes(1);
			expect(delivered).toHaveBeenCalledTimes(1);

			await send(eventDictionary.login); // LOGIN is unavailable in Ready.
			expect(emit).toHaveBeenCalledTimes(1);
			expect(delivered).toHaveBeenCalledTimes(1);

			await send(eventDictionary.refresh); // An explicit Ready → Ready transition.
			expect(emit).toHaveBeenCalledTimes(2);
			expect(delivered).toHaveBeenCalledTimes(2);

			machine.pause();
			await send(eventDictionary.refresh);
			expect(emit).toHaveBeenCalledTimes(2);
			expect(delivered).toHaveBeenCalledTimes(2);
			machine.resume();
			await setImmediate();
			expect(emit).toHaveBeenCalledTimes(3);
			expect(delivered).toHaveBeenCalledTimes(3);

			machine.disable();
			await send(eventDictionary.refresh);
			expect(emit).toHaveBeenCalledTimes(3);
			expect(delivered).toHaveBeenCalledTimes(3);

			cleanup();
			machine.enable();
			machine.dispatch(Session.createAction('REFRESH', {}));
			await setImmediate();
			expect(emit).toHaveBeenCalledTimes(4);
			expect(delivered).toHaveBeenCalledTimes(3);
		});

		it('automata can listen to events dispatched by event bus', async () => {
			await generateAndSave({ input: templates.basicSubscribe, automataName: 'BasicSubscribeAutomata', lang: ModuleNames.JavaScript }, `event_basicSubscribe`);
			const { BasicSubscribeAutomata, createEventBus, statesDictionary, eventDictionary } = await import(
				getGeneratedFixturePath('event_basicSubscribe_generated.js')
			);
			const [EventBus, automatas] = createEventBus('test', {
				subscribe: BasicSubscribeAutomata,
			});

			const subscribeAutomata = automatas.subscribe;

			expect(subscribeAutomata).toBeDefined();
			expect(EventBus).toBeDefined();

			const listenerSpy = vi.spyOn(subscribeAutomata.eventAdapter, 'handleEvent');

			expect(subscribeAutomata.state).toBe(statesDictionary.INIT);

			EventBus.dispatch({
				event: eventDictionary.specialEvent,
				meta: {},
			});

			expect(subscribeAutomata.state).toBe(statesDictionary.EVENT_RECEIVED);

			expect(listenerSpy).toHaveBeenCalled();
		});
		it('subscribe/emit in 1 automata', async () => {
			await generateAndSave({ input: templates.selfSubscribeAndEmit, automataName: 'SelfAutomata', lang: ModuleNames.JavaScript }, `event_selfSubscribeEmit`);
			const { SelfAutomata, createEventBus, statesDictionary, eventDictionary } = await import(
				getGeneratedFixturePath('event_selfSubscribeEmit_generated.js')
			);

			const [EventBus, automatas] = createEventBus('test', {
				self: SelfAutomata,
			});

			const selfAutomata = automatas.self;

			expect(selfAutomata).toBeDefined();
			expect(EventBus).toBeDefined();

			const listenerSpy = vi.spyOn(selfAutomata.eventAdapter, 'handleEvent');

			expect(selfAutomata.state).toBe(statesDictionary.INIT);

			EventBus.dispatch({
				event: eventDictionary.eventFromBus,
				meta: {},
			});

			expect(selfAutomata.state).toBe(statesDictionary.STATE_AFTER_EMIT_TRIGGER);

			expect(listenerSpy).toHaveBeenCalledTimes(2);
		});

		it('state of automata#1 changes after emit from automata#2', async () => {
			await generateAndSave({ input: templates.basicSubscribe, automataName: 'BasicSubscribeAutomata', lang: ModuleNames.JavaScript }, `event_basicSubscribe`);
			await generateAndSave({ input: templates.basicEmit, automataName: 'BasicEmitAutomata', lang: ModuleNames.JavaScript }, `event_basicEmit`);
			const { BasicSubscribeAutomata, createEventBus, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_basicSubscribe_generated.js')
			);
			const { BasicEmitAutomata, statesDictionary: emitStates, eventDictionary } = await import(
				getGeneratedFixturePath('event_basicEmit_generated.js')
			);

			const [EventBus, automatas] = createEventBus('test', {
				subscribe: BasicSubscribeAutomata,
				emit: BasicEmitAutomata,
			});

			const automataSubscriber = automatas.subscribe;
			const automataEmitter = automatas.emit;

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			EventBus.dispatch({
				event: eventDictionary.eventFromBus,
				meta: {},
			});

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.EVENT_RECEIVED);

			expect(spy).toHaveBeenCalled();
		});

		it('state of automata#1 does not change on emitting wrong events from automata#2', async () => {
			await generateAndSave({ input: templates.basicSubscribe, automataName: 'BasicSubscribeAutomata', lang: ModuleNames.JavaScript }, `event_basicSubscribe`);
			await generateAndSave({ input: templates.wrongEventEmit, automataName: 'WrongEventEmitAutomata', lang: ModuleNames.JavaScript }, `event_wrongEventEmit`);
			const { BasicSubscribeAutomata, createEventBus, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_basicSubscribe_generated.js')
			);
			const { WrongEventEmitAutomata, statesDictionary: emitStates, eventDictionary } = await import(
				getGeneratedFixturePath('event_wrongEventEmit_generated.js')
			);

			const [EventBus, automatas] = createEventBus('test', {
				subscribe: BasicSubscribeAutomata,
				emit: WrongEventEmitAutomata,
			});

			const automataSubscriber = automatas.subscribe;
			const automataEmitter = automatas.emit;

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			EventBus.dispatch({
				event: eventDictionary.eventFromBus,
				meta: {},
			});

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.INIT);

			expect(spy).toHaveBeenCalledTimes(0);
		});

		it('action payload can be filled from incoming event meta information', async () => {
			await generateAndSave({ input: templates.subscribeWithMeta, automataName: 'SubscribeWithMetaAutomata', lang: ModuleNames.JavaScript }, `event_subscribeWithMeta`);
			await generateAndSave({ input: templates.emitWithMeta, automataName: 'EmitWithMetaAutomata', lang: ModuleNames.JavaScript }, `event_emitWithMeta`);
			const { SubscribeWithMetaAutomata, createEventBus, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_subscribeWithMeta_generated.js')
			);
			const { EmitWithMetaAutomata, statesDictionary: emitStates, eventDictionary } = await import(
				getGeneratedFixturePath('event_emitWithMeta_generated.js')
			);

			const [EventBus, automatas] = createEventBus('test', {
				subscribe: SubscribeWithMetaAutomata,
				emit: EmitWithMetaAutomata,
			});

			const automataSubscriber = automatas.subscribe;
			const automataEmitter = automatas.emit;

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			let subscriberContext = automataSubscriber.getContext().context;

			expect(subscriberContext.contextValue1).toBeUndefined();
			expect(subscriberContext.contextValue2).toBeUndefined();

			EventBus.dispatch({
				event: eventDictionary.eventFromBus,
				meta: {},
			});

			expect(spy).toHaveBeenCalled();

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.EVENT_RECEIVED);

			subscriberContext = automataSubscriber.getContext().context;

			expect(subscriberContext.contextValue1).toBe(10);
			expect(subscriberContext.contextValue2).toBe('string');
		});

		it('event meta information can be filled from context of the automata', async () => {
			await generateAndSave({ input: templates.subscribeWithMeta, automataName: 'SubscribeWithMetaAutomata', lang: ModuleNames.JavaScript }, `event_subscribeWithMeta`);
			await generateAndSave({ input: templates.emitWithMetaFromContext, automataName: 'EmitWithMetaFromContextAutomata', lang: ModuleNames.JavaScript }, `event_emitWithMetaFromContext`);
			const { SubscribeWithMetaAutomata, createEventBus, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_subscribeWithMeta_generated.js')
			);
			const {
				EmitWithMetaFromContextAutomata,
				statesDictionary: emitStates,
				actionsDictionary: emitActions,
				eventDictionary,
			} = await import(
				getGeneratedFixturePath('event_emitWithMetaFromContext_generated.js')
			);

			const [EventBus, automatas] = createEventBus('test', {
				subscribe: SubscribeWithMetaAutomata,
				emit: EmitWithMetaFromContextAutomata,
			});

			const automataSubscriber = automatas.subscribe;
			const automataEmitter = automatas.emit;

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			automataEmitter.dispatch({
				action: emitActions.RESET,
			});

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			let emitterContext = automataEmitter.getContext().context;
			let subscriberContext = automataSubscriber.getContext().context;

			expect(emitterContext.contextValue1).toBe(10);
			expect(emitterContext.contextValue2).toBe('string');

			expect(subscriberContext.contextValue1).toBeUndefined();
			expect(subscriberContext.contextValue2).toBeUndefined();

			EventBus.dispatch({
				event: eventDictionary.eventFromBus,
				meta: {},
			});

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.EVENT_RECEIVED);

			expect(spy).toHaveBeenCalled();

			emitterContext = automataEmitter.getContext().context;
			subscriberContext = automataSubscriber.getContext().context;

			expect(subscriberContext.contextValue1).toBe(10);
			expect(subscriberContext.contextValue2).toBe('string');
		});
	});
});
