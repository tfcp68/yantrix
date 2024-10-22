import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AutomataEventAdapter, BasicEventBus } from '@yantrix/automata';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import templates from './fixtures/eventsTemplates';
import { generateAndSave } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe('automata Events', () => {
	describe('event dictionary', async () => {
		await generateAndSave({ input: templates.basicEvents, automataName: 'BasicEventsAutomata', lang: 'JavaScript' }, `event_basicEvents`);
		const { BasicEventsAutomata, eventDictionary } = await import(
			getGeneratedFixturePath('event_basicEvents_generated.js')
		);

		const automata = new BasicEventsAutomata();

		it('automata has an Event Dictionary', () => {
			expect(automata).toBeTruthy();
			expect(eventDictionary).toBeTruthy();
		});

		it('automata\'s Event Dictionary contains events from the diagram', () => {
			expect(Object.keys(eventDictionary).length).toBe(3);
		});

		it('automatas share one Event Dictionary', async () => {

		});
	});

	describe('event Adapter', async () => {
		await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventAdapterAutomata', lang: 'JavaScript' }, `event_adapter`);
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
			await generateAndSave({ input: templates.basicEvents, automataName: 'BasicEventsAutomata', lang: 'JavaScript' }, `event_basicEvents`);
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

	describe('event Bus', () => {
		it('automata has an Event Bus', async () => {
			await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventBusTest1', lang: 'JavaScript' }, `event_bus1`);
			const { EventBusTest1 } = await import(
				getGeneratedFixturePath('event_bus1_generated.js')
			);
			const automata = new EventBusTest1();

			expect(automata.eventBus).toBeTruthy();
		});

		it('automatas share the same Event Bus by default', async () => {
			await generateAndSave({ input: templates.basicSubscribe, automataName: 'BasicSubscribeAutomata', lang: 'JavaScript' }, `event_basicSubscribe`);
			await generateAndSave({ input: templates.basicEmit, automataName: 'BasicEmitAutomata', lang: 'JavaScript' }, `event_basicEmit`);
			const { BasicSubscribeAutomata } = await import(
				getGeneratedFixturePath('event_basicSubscribe_generated.js')
			);
			const { BasicEmitAutomata } = await import(
				getGeneratedFixturePath('event_basicEmit_generated.js')
			);

			const automata1 = new BasicSubscribeAutomata();
			const automata2 = new BasicEmitAutomata();

			expect(automata1.eventBus).toBeTruthy();
			expect(automata2.eventBus).toBeTruthy();
			expect(automata1.eventBus).toBe(automata2.eventBus);
		});

		it('automata can be switched to a different Event Bus', async () => {
			await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventBusTest1', lang: 'JavaScript' }, `event_bus1`);
			const { EventBusTest1 } = await import(
				getGeneratedFixturePath('event_bus1_generated.js')
			);
			const automata = new EventBusTest1();
			const bus = new BasicEventBus();
			assert.notEqual(automata.eventBus, bus);
			automata.setEventBus(bus);
			assert.equal(automata.eventBus, bus);
		});
	});

	describe('event interactions', () => {
		it('events can be emitted from automata during action dispatch', async () => {
			await generateAndSave({ input: templates.basicEmit, automataName: 'BasicEmitAutomata', lang: 'JavaScript' }, `event_basicEmit`);
			const { BasicEmitAutomata, actionsDictionary } = await import(
				getGeneratedFixturePath('event_basicEmit_generated.js')
			);

			const automataEmitter = new BasicEmitAutomata();

			const spy = vi.spyOn(automataEmitter.eventBus, 'dispatch');

			automataEmitter.dispatch({
				action: actionsDictionary.MOVE,
				payload: {},
			});

			expect(spy).toHaveBeenCalled();
		});

		it('events from automatas can be listened to by subscriber automata', async () => {
			await generateAndSave({ input: templates.selfSubscribeAndEmit, automataName: 'SelfAutomata', lang: 'JavaScript' }, `event_selfSubscribeEmit`);
			const { SelfAutomata, actionsDictionary } = await import(
				getGeneratedFixturePath('event_selfSubscribeEmit_generated.js')
			);
			const selfAutomata = new SelfAutomata();

			const spy = vi.spyOn(selfAutomata.eventAdapter, 'handleEvent');

			selfAutomata.dispatch({
				action: actionsDictionary.MOVE,
				payload: {},
			});

			expect(spy).toHaveBeenCalled();
		});

		it('basic subscribe & emit in 1 automata', async () => {
			await generateAndSave({ input: templates.selfSubscribeAndEmit, automataName: 'SelfAutomata', lang: 'JavaScript' }, `event_selfSubscribeEmit`);
			const { SelfAutomata, statesDictionary, actionsDictionary } = await import(
				getGeneratedFixturePath('event_selfSubscribeEmit_generated.js')
			);
			const selfAutomata = new SelfAutomata();

			const emitterSpy = vi.spyOn(selfAutomata.eventBus, 'dispatch');
			const listenerSpy = vi.spyOn(selfAutomata.eventAdapter, 'handleEvent');

			expect(selfAutomata.state).toBe(statesDictionary.INIT);

			selfAutomata.dispatch({
				action: actionsDictionary.MOVE,
				payload: {},
			});

			expect(selfAutomata.state).toBe(statesDictionary.EVENT_RECEIVED);

			expect(emitterSpy).toHaveBeenCalled();
			expect(listenerSpy).toHaveBeenCalled();
		});

		it('state of automata#1 changes after emit from automata#2', async () => {
			await generateAndSave({ input: templates.basicSubscribe, automataName: 'BasicSubscribeAutomata', lang: 'JavaScript' }, `event_basicSubscribe`);
			await generateAndSave({ input: templates.basicEmit, automataName: 'BasicEmitAutomata', lang: 'JavaScript' }, `event_basicEmit`);
			const { BasicSubscribeAutomata, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_basicSubscribe_generated.js')
			);
			const { BasicEmitAutomata, statesDictionary: emitStates, actionsDictionary: emitActions } = await import(
				getGeneratedFixturePath('event_basicEmit_generated.js')
			);

			const automataSubscriber = new BasicSubscribeAutomata();
			const automataEmitter = new BasicEmitAutomata();

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			automataEmitter.dispatch({
				action: emitActions.MOVE,
				payload: {},
			});

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.EVENT_RECEIVED);

			expect(spy).toHaveBeenCalled();
		});

		it('state of automata#1 does not change on emitting wrong events from automata#2', async () => {
			await generateAndSave({ input: templates.basicSubscribe, automataName: 'BasicSubscribeAutomata', lang: 'JavaScript' }, `event_basicSubscribe`);
			await generateAndSave({ input: templates.wrongEventEmit, automataName: 'WrongEventEmitAutomata', lang: 'JavaScript' }, `event_wrongEventEmit`);
			const { BasicSubscribeAutomata, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_basicSubscribe_generated.js')
			);
			const { WrongEventEmitAutomata, statesDictionary: emitStates, actionsDictionary: emitActions } = await import(
				getGeneratedFixturePath('event_wrongEventEmit_generated.js')
			);

			const automataSubscriber = new BasicSubscribeAutomata();
			const automataEmitter = new WrongEventEmitAutomata();

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			automataEmitter.dispatch({
				action: emitActions.MOVE,
				payload: {},
			});

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.INIT);

			expect(spy).toHaveBeenCalledTimes(0);
		});

		it('action payload can be filled from incoming event meta information', async () => {
			await generateAndSave({ input: templates.subscribeWithMeta, automataName: 'SubscribeWithMetaAutomata', lang: 'JavaScript' }, `event_subscribeWithMeta`);
			await generateAndSave({ input: templates.emitWithMeta, automataName: 'EmitWithMetaAutomata', lang: 'JavaScript' }, `event_emitWithMeta`);
			const { SubscribeWithMetaAutomata, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_subscribeWithMeta_generated.js')
			);
			const { EmitWithMetaAutomata, statesDictionary: emitStates, actionsDictionary: emitActions } = await import(
				getGeneratedFixturePath('event_emitWithMeta_generated.js')
			);

			const automataSubscriber = new SubscribeWithMetaAutomata();
			const automataEmitter = new EmitWithMetaAutomata();

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			let subscriberContext = automataSubscriber.getContext().context;

			expect(subscriberContext.contextValue1).toBeUndefined();
			expect(subscriberContext.contextValue2).toBeUndefined();

			automataEmitter.dispatch({
				action: emitActions.MOVE,
				payload: {},
			});

			expect(spy).toHaveBeenCalled();

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.EVENT_RECEIVED);

			subscriberContext = automataSubscriber.getContext().context;

			expect(subscriberContext.contextValue1).toBe(10);
			expect(subscriberContext.contextValue2).toBe('string');
		});

		it('event meta information can be filled from context of the automata', async () => {
			await generateAndSave({ input: templates.subscribeWithMeta, automataName: 'SubscribeWithMetaAutomata', lang: 'JavaScript' }, `event_subscribeWithMeta`);
			await generateAndSave({ input: templates.emitWithMetaFromContext, automataName: 'EmitWithMetaFromContextAutomata', lang: 'JavaScript' }, `event_emitWithMetaFromContext`);
			const { SubscribeWithMetaAutomata, statesDictionary: subscribeStates } = await import(
				getGeneratedFixturePath('event_subscribeWithMeta_generated.js')
			);
			const { EmitWithMetaFromContextAutomata, statesDictionary: emitStates, actionsDictionary: emitActions } = await import(
				getGeneratedFixturePath('event_emitWithMetaFromContext_generated.js')
			);

			const automataSubscriber = new SubscribeWithMetaAutomata();
			const automataEmitter = new EmitWithMetaFromContextAutomata();

			const spy = vi.spyOn(automataSubscriber, 'dispatch');

			automataEmitter.dispatch({
				action: emitActions.RESET,
			});

			expect(automataSubscriber.state).toBe(subscribeStates.INIT);
			expect(automataEmitter.state).toBe(emitStates.INIT);

			let emitterContext = automataEmitter.getContext();
			let subscriberContext = automataSubscriber.getContext();

			expect(emitterContext.context.contextValue1).toBe(10);
			expect(emitterContext.context.contextValue2).toBe('string');

			expect(subscriberContext.context.contextValue1).toBeUndefined();
			expect(subscriberContext.context.contextValue2).toBeUndefined();

			automataEmitter.dispatch({
				action: emitActions.MOVE,
				payload: {},
			});

			expect(automataEmitter.state).toBe(emitStates.EMIT_TRIGGER);
			expect(automataSubscriber.state).toBe(subscribeStates.EVENT_RECEIVED);

			expect(spy).toHaveBeenCalled();

			emitterContext = automataEmitter.getContext();
			subscriberContext = automataSubscriber.getContext();

			expect(subscriberContext.context.contextValue1).toBe(10);
			expect(subscriberContext.context.contextValue2).toBe('string');
		});
	});
});
