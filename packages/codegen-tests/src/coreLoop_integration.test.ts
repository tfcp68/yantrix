import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import {
	AutomataEventAdapter,
	CoreLoop,
	IAutomataEventBus,
	IEventDestination,
	IEventSource,
	TAutomataEventMetaType,
	TEventBusTask,
	uniqId,
	waitForEventOnce,
	waitForState,
} from '@yantrix/core';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

import { generateAndSave } from './fixtures/utils';

enum TestEvents {
	UI_SELECT_CITY = 1,
	UI_SUBMIT = 2,
	FETCH_WEATHER = 3,
	WEATHER_RESOLVED = 4,
	WEATHER_REJECTED = 5,
	UI_RENDER = 6,
}

type TMockSource = IEventSource & { started: boolean };

type TTestMeta = {
	[TestEvents.UI_SELECT_CITY]: {
		city: string | null;
		coords: {
			lat: number;
			lon: number;
		} | null;
	};
	[TestEvents.UI_SUBMIT]: {
		city: string;
		coords: {
			lat: number;
			lon: number;
		};
	};
	[TestEvents.FETCH_WEATHER]: {
		city: string | null;
		coords: {
			lat: number;
			lon: number;
		} | null;
	};
	[TestEvents.WEATHER_RESOLVED]: {
		data: {
			temp: number;
			place?: string;
			time?: string;
			lat?: number | null;
			lon?: number | null;
		};
	};
	[TestEvents.WEATHER_REJECTED]: {
		error: string;
	};
	[TestEvents.UI_RENDER]: Record<string, never>;
};

const cityTest = 'Moscow';
const coordsTest = { lat: 55.7558, lon: 37.6173 };

function toEvent<E extends TestEvents>(
	event: E,
	meta: TTestMeta[E],
): TAutomataEventMetaType<E, TTestMeta> {
	return { event, meta };
}

/**
 * Creates a mock Source compatible with CoreLoop registration.
 *
 * Behavior:
 * - start(publish): marks source active and publishes provided events through callback
 * - stop(): marks a source inactive
 * - started (getter): returns current active flag
 *
 * @param events - A list of events to publish upon start
 * @returns An object with Source-like API (id is assigned by CoreLoop)
 */
function createMockSource(events: Array<TAutomataEventMetaType<TestEvents, TTestMeta>>): TMockSource {
	let started = false;
	return {
		id: uniqId(),
		start: (publish: (e: TAutomataEventMetaType<TestEvents, TTestMeta>) => void) => {
			started = true;
			for (const e of events) publish(e);
		},
		stop: () => {
			started = false;
		},
		get started() {
			return started;
		},
	};
}

/**
 * Creates a mock Destination that subscribes to WEATHER_RESOLVED and forwards events into a spy function.
 *
 * API:
 * - bind(bus): subscribes to WEATHER_RESOLVED and returns an unbind function
 * - id: string identifier (assigned by CoreLoop)
 *
 * @param spy - A function called with the event meta when WEATHER_RESOLVED is observed
 * @returns A Destination-like object
 */
function createMockDestination(spy:
(event: TAutomataEventMetaType<TestEvents, TTestMeta>) => TEventBusTask<TestEvents, TTestMeta>): IEventDestination<TestEvents, TTestMeta> {
	return {
		bind: (bus: IAutomataEventBus<TestEvents, TTestMeta>) => {
			const handler
				= (event: TAutomataEventMetaType<TestEvents, TTestMeta>) => spy(event);

			bus.subscribe(TestEvents.WEATHER_RESOLVED, handler);
			return () => bus.unsubscribe(TestEvents.WEATHER_RESOLVED, handler);
		},
		id: uniqId(),
	};
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

const input = `stateDiagram-v2
	[*] --> Idle: Init

	Idle --> Filling: FocusInput
	Idle --> Filling: UpdateSelect

	Filling --> Filling: UpdateInput
	Filling --> Filling: UpdateSelect
	Filling --> Pending: Submit

	Pending --> Success: Resolve
	Pending --> Error: Reject

	Error --> Filling: UpdateInput
	Error --> Filling: UpdateSelect

	Success --> [*]: Reset
	Success --> Filling: UpdateInput
	Success --> Filling: UpdateSelect

	note left of Idle
		+Init
		#{ coords = 0, city = 0 }
	end note

	note right of Filling
		#{ coords } <= coalesce($coords, #coords)
		#{ city } <= coalesce($city, #city)
		#{ result = 0, error = 0 }
	end note

	note right of Pending
		#{ coords } <= coalesce($coords, #coords)
		#{ city } <= coalesce($city, #city)
	end note

	note right of Success
		#{ result = $data, coords, city }
	end note

	note right of Error
		#{ error = $error, coords, city }
	end note
`;

describe('coreLoop with generated WeatherReportAutomata', async () => {
	await generateAndSave({ input, automataName: 'WeatherReportAutomata', lang: ModuleNames.TypeScript }, 'WeatherReportAutomata');
	const { WeatherReportAutomata, actionsDictionary, statesDictionary } = await import(
		getGeneratedFixturePath('WeatherReportAutomata_generated.ts')
	);
	let loop: CoreLoop<TestEvents, TTestMeta>;
	let automata: typeof WeatherReportAutomata;
	let bus: IAutomataEventBus<TestEvents, TTestMeta>;
	let adapter: AutomataEventAdapter;

	let handleTransitionSpy: ReturnType<typeof vi.spyOn>;

	/**
	 * Configures an AutomataEventAdapter using the given automata instance.
	 *
	 * Adds:
	 * - Event -> Action listeners (UI_* and WEATHER_* events to respective actions)
	 * - State -> Event emitters (Pending -> FETCH_WEATHER, and UI_RENDER for main states)
	 *
	 * @param automata - WeatherReportAutomata whose adapter will be configured
	 * @returns The configured AutomataEventAdapter instance
	 */
	function buildAdapterFromAutomata(
		automata: typeof WeatherReportAutomata,
	): AutomataEventAdapter {
		const adapter = automata.getEventAdapter() as AutomataEventAdapter;

		// Event -> Action
		adapter.addEventListener(TestEvents.UI_SELECT_CITY, ({ meta }) => ({
			action: actionsDictionary.UpdateSelect,
			payload: { city: meta?.city ?? null, coords: meta?.coords ?? null },
		}));
		adapter.addEventListener(TestEvents.UI_SUBMIT, ({ meta }) => ({
			action: actionsDictionary.Submit,
			payload: { city: meta?.city ?? null, coords: meta?.coords ?? null },
		}));
		adapter.addEventListener(TestEvents.WEATHER_RESOLVED, ({ meta }) => ({
			action: actionsDictionary.Resolve,
			payload: { data: meta?.data },
		}));
		adapter.addEventListener(TestEvents.WEATHER_REJECTED, ({ meta }) => ({
			action: actionsDictionary.Reject,
			payload: { error: meta?.error },
		}));

		// State -> Event
		adapter.addEventEmitter(statesDictionary.Pending, ({ context }) => ({
			event: TestEvents.FETCH_WEATHER,
			meta: { city: context?.city ?? null, coords: context?.coords ?? null },
		}));
		[statesDictionary.Filling, statesDictionary.Pending, statesDictionary.Success, statesDictionary.Error].forEach(
			(s) => {
				adapter.addEventEmitter(s, () => ({
					event: TestEvents.UI_RENDER,
					meta: {},
				}));
			},
		);

		return adapter;
	}

	beforeEach(async () => {
		loop = new CoreLoop<TestEvents, TTestMeta>();
		bus = loop.getBus();
		automata = new WeatherReportAutomata();

		adapter = buildAdapterFromAutomata(automata);

		// Spy to verify CoreLoop actually calls adapter
		handleTransitionSpy = vi.spyOn(adapter, 'handleTransition') as MockInstance;

		loop.registerAutomata('weather', automata, adapter);
	});

	/**
	 * Verifies an end-to-end path:
	 * 1) UI_SELECT_CITY sets FSM to Filling
	 * 2) UI_SUBMIT moves to Pending
	 * 3) Pending emits FETCH_WEATHER (and UI_RENDER)
	 *
	 * Expectations:
	 * - UI_SUBMIT observed once by bus subscriber
	 * - FSM in Pending state
	 * - handleTransition invoked
	 * - FETCH_WEATHER emitted exactly once with the correct meta
	 */
	it('runs Event -> Action -> State and emits Events from State (Pending -> FETCH_WEATHER)', async () => {
		const fetchSpy = vi.fn();
		const submitBusSpy = vi.fn();

		// Verify the bus actually sees UI_SUBMIT publication
		bus.subscribe(TestEvents.UI_SUBMIT, submitBusSpy);
		bus.subscribe(TestEvents.FETCH_WEATHER, fetchSpy);

		// Idle -> Filling
		bus.dispatch(
			toEvent(TestEvents.UI_SELECT_CITY, { city: cityTest, coords: coordsTest }),
		);
		// wait for UI render tick to ensure async bus settled
		await waitForEventOnce(bus, TestEvents.UI_RENDER);
		expect(automata.getContext().state).toBe(statesDictionary.Filling);

		// Filling -> Pending
		bus.dispatch(
			toEvent(TestEvents.UI_SUBMIT, { city: cityTest, coords: coordsTest }),
		);

		// await UI render tick after submit (Pending entered)
		await waitForEventOnce(bus, TestEvents.UI_RENDER);

		// Bus subscriber diagnostics
		expect(submitBusSpy).toHaveBeenCalledTimes(1);

		// FSM state must be Pending
		expect(automata.getContext().state).toBe(statesDictionary.Pending);

		// CoreLoop must have attempted to emit state events
		expect(handleTransitionSpy).toHaveBeenCalled();

		// FETCH_WEATHER must be re-dispatched by CoreLoop
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0]![0]).toEqual(
			expect.objectContaining({
				event: TestEvents.FETCH_WEATHER,
				meta: { city: cityTest, coords: coordsTest },
			}),
		);
	});

	it('resolves to Success on WEATHER_RESOLVED, preserving city/coords and setting result', async () => {
		// move to Filling
		bus.dispatch(toEvent(TestEvents.UI_SELECT_CITY, { city: cityTest, coords: coordsTest }));
		await waitForEventOnce(bus, TestEvents.UI_RENDER);

		// move to Pending
		bus.dispatch(toEvent(TestEvents.UI_SUBMIT, { city: cityTest, coords: coordsTest }));
		await waitForEventOnce(bus, TestEvents.UI_RENDER);
		await waitForState(automata, statesDictionary.Pending);

		// Resolve -> Success
		bus.dispatch(
			toEvent(TestEvents.WEATHER_RESOLVED, { data: { temp: 21, place: 'Moscow', time: 'T', lat: 55, lon: 37 } }),
		);
		await waitForEventOnce(bus, TestEvents.UI_RENDER);
		await waitForState(automata, statesDictionary.Success);

		expect(automata.getContext().state).toBe(statesDictionary.Success);
		const ctx = automata.getContext().context;
		expect(ctx?.city).toBe(cityTest);
		expect(ctx?.coords).toEqual(coordsTest);
		expect(ctx?.result).toEqual({ temp: 21, place: 'Moscow', time: 'T', lat: 55, lon: 37 });
	});

	it('resolves to Error on WEATHER_REJECTED, preserving city/coords and setting error', async () => {
		// move to Filling
		bus.dispatch(toEvent(TestEvents.UI_SELECT_CITY, { city: cityTest, coords: coordsTest }));
		await waitForEventOnce(bus, TestEvents.UI_RENDER);

		// move to Pending
		bus.dispatch(toEvent(TestEvents.UI_SUBMIT, { city: cityTest, coords: coordsTest }));
		await waitForEventOnce(bus, TestEvents.UI_RENDER);
		await waitForState(automata, statesDictionary.Pending);

		// Reject -> Error
		bus.dispatch(
			toEvent(TestEvents.WEATHER_REJECTED, { error: 'Network failure' }),
		);
		await waitForEventOnce(bus, TestEvents.UI_RENDER);
		await waitForState(automata, statesDictionary.Error);

		expect(automata.getContext().state).toBe(statesDictionary.Error);
		const ctx = automata.getContext().context;
		expect(ctx?.city).toBe(cityTest);
		expect(ctx?.coords).toEqual(coordsTest);
		expect(ctx?.error).toBe('Network failure');
	});

	/**
	 * Ensures destination (observer) subscribes/unsubscribes correctly:
	 * - After registration, first WEATHER_RESOLVED reaches destination
	 * - After unregistration, subsequent events do not reach it
	 */
	it('registers destination and unsubscribes correctly', () => {
		const spy = vi.fn();
		const dest = createMockDestination(spy);
		loop.registerDestination(dest);

		bus.dispatch(
			toEvent(TestEvents.WEATHER_RESOLVED, { data: { temp: 10 } }),
		);
		expect(spy).toHaveBeenCalledTimes(1);

		loop.unregisterDestination(dest.id);
		bus.dispatch(
			toEvent(TestEvents.WEATHER_RESOLVED, { data: { temp: 12 } }),
		);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	/**
	 * Validates Source lifecycle:
	 * - start() activates a source which publishes its queued events
	 * - FSM reaches Success after processing the sequence
	 * - stop() deactivates the source
	 */
	it('registers source; start/stop lifecycle works', async () => {
		loop.start();

		const srcEvents = [
			toEvent(TestEvents.UI_SELECT_CITY, { city: cityTest, coords: coordsTest }),
			toEvent(TestEvents.UI_SUBMIT, { city: cityTest, coords: coordsTest }),
			toEvent(TestEvents.WEATHER_RESOLVED, { data: { temp: 25 } }),
		];
		const source = createMockSource(srcEvents);

		loop.registerSource(source);
		expect(source.started).toBe(true);

		// wait until FSM reaches Success
		await waitForState(automata, statesDictionary.Success);

		expect(automata.getContext().state).toBe(statesDictionary.Success);
		const ctx = automata.getContext().context;
		expect(ctx?.city).toBe(cityTest);
		expect(ctx?.coords).toEqual(coordsTest);
		expect(ctx?.result).toEqual({ temp: 25 });

		loop.stop();
		expect(source.started).toBe(false);
	});

	/**
	 * Validates multiple sources/destinations and stop():
	 * - stop() must deactivate all sources and unbind all destinations
	 * - After stop(), destinations no longer receive events
	 */
	it('multiple sources and destinations; stop() stops sources and unbinds destinations', () => {
		loop.start();

		const src1 = createMockSource([toEvent(TestEvents.UI_SELECT_CITY, { city: cityTest, coords: coordsTest })]);
		const src2 = createMockSource([toEvent(TestEvents.UI_SELECT_CITY, { city: 'Rome', coords: { lat: 41.9, lon: 12.5 } })]);

		const spy = vi.fn();
		const dest1 = createMockDestination(spy);
		const dest2 = createMockDestination(spy);

		loop.registerSource(src1);
		loop.registerSource(src2);
		loop.registerDestination(dest1);
		loop.registerDestination(dest2);

		expect(src1.started).toBe(true);
		expect(src2.started).toBe(true);

		loop.stop();
		expect(src1.started).toBe(false);
		expect(src2.started).toBe(false);

		spy.mockClear();
		bus.dispatch(
			toEvent(TestEvents.WEATHER_RESOLVED, { data: { temp: 1 } }),
		);
		expect(spy).toHaveBeenCalledTimes(0);
	});

	/**
	 * Confirms idempotence of CoreLoop start/stop:
	 * - Repeated start() and stop() calls should not throw
	 * - isRunning() must reflect the current state
	 */
	it('idempotent start/stop', () => {
		expect(() => loop.start()).not.toThrow();
		expect(loop.getBus().isRunning()).toBe(true);
		expect(() => loop.start()).not.toThrow();

		expect(() => loop.stop()).not.toThrow();
		expect(loop.getBus().isRunning()).toBe(false);
		expect(() => loop.stop()).not.toThrow();
	});

	it('throws on duplicate ids (automata/source/destination)', () => {
		const anotherAutomata = new WeatherReportAutomata();
		const adapter2 = buildAdapterFromAutomata(anotherAutomata);
		expect(() => loop.registerAutomata('weather', anotherAutomata, adapter2)).toThrow();

		const src = createMockSource([]);
		loop.start();
		loop.registerSource(src);
		expect(() => loop.registerSource(src)).toThrow();

		const spy = vi.fn();
		const dest = createMockDestination(spy);
		loop.registerDestination(dest);
		expect(() => loop.registerDestination(dest)).toThrow();
	});

	it('unregister methods are safe to call twice', () => {
		expect(() => loop.unregisterAutomata('weather')).not.toThrow();
		expect(() => loop.unregisterAutomata('weather')).not.toThrow();

		loop.start();
		const src = createMockSource([]);
		loop.registerSource(src);
		expect(() => loop.unregisterSource(src.id)).not.toThrow();
		expect(() => loop.unregisterSource(src.id)).not.toThrow();

		const spy = vi.fn();
		const dest = createMockDestination(spy);
		loop.registerDestination(dest);
		expect(() => loop.unregisterDestination(dest.id)).not.toThrow();
		expect(() => loop.unregisterDestination(dest.id)).not.toThrow();
	});
});
