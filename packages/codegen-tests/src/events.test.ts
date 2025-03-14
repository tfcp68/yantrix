import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { AutomataEventAdapter } from '@yantrix/core';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import templates from './fixtures/eventsTemplates';
import { generateAndSave } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe('automata Events', () => {
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
			const { EmitWithMetaFromContextAutomata, statesDictionary: emitStates, actionsDictionary: emitActions, eventDictionary } = await import(
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
