import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedPath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

const trafficInput = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter = 0))
end note
note left of Off
+Init
end note
`;

describe('pure-javascript codegen - state transitions and context', async () => {
	await generateAndSave(
		{ input: trafficInput, automataName: 'TrafficLight', lang: ModuleNames.PureJavaScript },
		'pjs_traffic',
	);

	const mod = await import(`./fixtures/generated/pjs_traffic_generated.js`);
	const { statesDictionary, actionsDictionary, createTrafficLight } = mod;

	let fsm: ReturnType<typeof createTrafficLight>;

	beforeEach(() => {
		fsm = createTrafficLight();
	});

	it('factory returns a non-null instance', () => {
		assert.isNotNull(fsm);
	});

	it('initial state is Off', () => {
		expect(fsm.state).toBe(statesDictionary.Off);
	});

	it('initial lastAction is null', () => {
		expect(fsm.lastAction).toBeNull();
	});

	it('initial currentCycle is 0', () => {
		expect(fsm.currentCycle).toBe(0);
	});

	it('initial context has counter = null', () => {
		expect(fsm.getContext().context.counter).toBeNull();
	});

	it('dispatch transitions state from Off to Red', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.state).toBe(statesDictionary.Red);
	});

	it('dispatch updates lastAction', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.lastAction).toBe(actionsDictionary.Switch);
	});

	it('dispatch increments currentCycle', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.currentCycle).toBe(1);
	});

	it('counter increments on each dispatch', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.getContext().context.counter).toBe(2);
	});

	it('getContext returns state and context snapshot', () => {
		const ctx = fsm.getContext();
		expect(ctx).toHaveProperty('state');
		expect(ctx).toHaveProperty('context');
		expect(ctx.state).toBe(statesDictionary.Off);
	});

	it('multiple dispatches cycle through states', () => {
		const states = [statesDictionary.Red, statesDictionary.RedYellow, statesDictionary.Green, statesDictionary.Yellow, statesDictionary.Red];
		for (const expected of states) {
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(expected);
		}
	});

	it('unknown action does not change state', () => {
		const before = fsm.state;
		fsm.dispatch({ action: -999, payload: {} });
		expect(fsm.state).toBe(before);
	});

	describe('pause / resume', () => {
		it('paused machine queues dispatches', () => {
			fsm.pause();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(statesDictionary.Off);
		});

		it('resume flushes queued dispatches', () => {
			fsm.pause();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			fsm.resume();
			expect(fsm.state).toBe(statesDictionary.Red);
		});
	});

	describe('disable / enable', () => {
		it('disabled machine ignores dispatches', () => {
			fsm.disable();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(statesDictionary.Off);
		});

		it('enabled machine resumes accepting dispatches', () => {
			fsm.disable();
			fsm.enable();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(statesDictionary.Red);
		});
	});

	it('destroy clears queue without throwing', () => {
		fsm.pause();
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(() => fsm.destroy()).not.toThrow();
	});
});

describe('pure-javascript codegen - module-level exports', async () => {
	await generateAndSave(
		{ input: trafficInput, automataName: 'TrafficLightExports', lang: ModuleNames.PureJavaScript },
		'pjs_exports',
	);

	const mod = await import(`./fixtures/generated/pjs_exports_generated.js`);

	it('exports statesDictionary', () => {
		expect(mod.statesDictionary).toBeDefined();
		expect(typeof mod.statesDictionary).toBe('object');
	});

	it('exports actionsDictionary', () => {
		expect(mod.actionsDictionary).toBeDefined();
		expect(typeof mod.actionsDictionary).toBe('object');
	});

	it('exports eventDictionary', () => {
		expect(mod.eventDictionary).toBeDefined();
	});

	it('exports actionsMap', () => {
		expect(mod.actionsMap).toBeDefined();
	});

	it('exports statesMap', () => {
		expect(mod.statesMap).toBeDefined();
	});

	it('exports functionDictionary', () => {
		expect(mod.functionDictionary).toBeDefined();
		expect(typeof mod.functionDictionary.get).toBe('function');
	});

	it('exports getState helper', () => {
		expect(typeof mod.getState).toBe('function');
		expect(mod.getState('Off')).toBe(mod.statesDictionary.Off);
	});

	it('exports getAction helper', () => {
		expect(typeof mod.getAction).toBe('function');
		expect(mod.getAction('Switch')).toBe(mod.actionsDictionary.Switch);
	});

	it('exports createAction helper', () => {
		expect(typeof mod.createAction).toBe('function');
		const ap = mod.createAction('Switch', {});
		expect(ap).toEqual({ action: mod.actionsDictionary.Switch, payload: {} });
	});

	it('exports hasState helper', () => {
		expect(typeof mod.hasState).toBe('function');
		const fsm = mod.createTrafficLightExports();
		expect(mod.hasState(fsm, 'Off')).toBe(true);
	});

	it('exports createEventBus function', () => {
		expect(typeof mod.createEventBus).toBe('function');
	});

	it('factory function is default export', () => {
		expect(typeof mod.default).toBe('function');
	});
});

describe('pure-javascript codegen - built-in functions', async () => {
	const fnInput = `stateDiagram-v2
	[*] --> Active: Start
	Active --> Active: Update
note left of Active
	+Init
	#{ doubled = 0 } <= mult($val, 2)
	#{ clamped = 0 } <= if(isGreater($v, 100), 100, $v)
end note
`;

	await generateAndSave(
		{ input: fnInput, automataName: 'BuiltinFnsTest', lang: ModuleNames.PureJavaScript },
		'pjs_builtins',
	);

	const { createBuiltinFnsTest, actionsDictionary } = await import(`./fixtures/generated/pjs_builtins_generated.js`);

	it('mult built-in: doubled = val * 2', () => {
		const fsm = createBuiltinFnsTest();
		fsm.dispatch({ action: actionsDictionary.Update, payload: { val: 5, v: 0 } });
		expect(fsm.getContext().context.doubled).toBe(10);
	});

	it('if+isGreater built-in: clamps value at 100', () => {
		const fsm = createBuiltinFnsTest();
		fsm.dispatch({ action: actionsDictionary.Update, payload: { val: 0, v: 200 } });
		expect(fsm.getContext().context.clamped).toBe(100);
	});

	it('if+isGreater: passes value through when <= 100', () => {
		const fsm = createBuiltinFnsTest();
		fsm.dispatch({ action: actionsDictionary.Update, payload: { val: 0, v: 42 } });
		expect(fsm.getContext().context.clamped).toBe(42);
	});
});

describe('pure-javascript codegen - define directive', async () => {
	const defineInput = `stateDiagram-v2
	[*] --> S: go
	S --> S: next
note left of S
	+Init
	define/double(x) => mult(x, 2)
	#{ result = 0 } <= double($n)
end note
`;

	await generateAndSave(
		{ input: defineInput, automataName: 'DefineTest', lang: ModuleNames.PureJavaScript },
		'pjs_define',
	);

	const { createDefineTest, actionsDictionary } = await import(`./fixtures/generated/pjs_define_generated.js`);

	it('user-defined function is applied', () => {
		const fsm = createDefineTest();
		fsm.dispatch({ action: actionsDictionary.next, payload: { n: 7 } });
		expect(fsm.getContext().context.result).toBe(14);
	});
});

describe('pure-javascript codegen - inject functions', async () => {
	const injectInput = `stateDiagram-v2
	[*] --> A: toA
note right of [*]
	inject/isBoolean
end note
`;
	await generateAndSave(
		{
			input: injectInput,
			automataName: 'PJSInject',
			lang: ModuleNames.PureJavaScript,
			injects: '../../fixtures/injects/correctFunctions.ts',
		},
		'pjs_inject',
	);

	const mod = await import(getGeneratedPath('pjs_inject_generated.js'));

	it('functionDictionary has injected function', () => {
		expect(mod.functionDictionary.get('isBoolean')).toBeDefined();
	});

	it('injected function is callable', () => {
		const fn = mod.functionDictionary.get('isBoolean');
		expect(typeof fn).toBe('function');
		expect(fn(true)).toBe(true);
		expect(fn(42)).toBe(false);
	});
});

describe('pure-javascript codegen - eventAdapter on instance', async () => {
	const trafficInput = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
note left of Off
+Init
end note
`;
	await generateAndSave(
		{ input: trafficInput, automataName: 'PJSEventTest', lang: ModuleNames.PureJavaScript },
		'pjs_events',
	);

	const mod = await import(getGeneratedPath('pjs_events_generated.js'));
	const { createPJSEventTest } = mod;

	it('factory instance exposes eventAdapter', () => {
		const fsm = createPJSEventTest();
		expect(fsm.eventAdapter).toBeDefined();
	});

	it('eventAdapter has addEventEmitter', () => {
		const fsm = createPJSEventTest();
		expect(typeof fsm.eventAdapter.addEventEmitter).toBe('function');
	});

	it('eventAdapter has addEventListener', () => {
		const fsm = createPJSEventTest();
		expect(typeof fsm.eventAdapter.addEventListener).toBe('function');
	});

	it('createEventBus is exported', () => {
		expect(typeof mod.createEventBus).toBe('function');
	});
});

describe('pure-javascript codegen - forks', async () => {
	const forksInput = `stateDiagram-v2
	Check --> High: Eval [isGreater($score, 50)]
	Check --> Low: Eval
note left of Check
+Init
end note
`;
	await generateAndSave(
		{ input: forksInput, automataName: 'PJSForksTest', lang: ModuleNames.PureJavaScript },
		'pjs_forks',
	);
	const { createPJSForksTest, statesDictionary: forksStates, actionsDictionary: forksActions } = await import(
		getGeneratedPath('pjs_forks_generated.js'),
	);

	it('score > 50 routes to High', () => {
		const fsm = createPJSForksTest();
		fsm.dispatch({ action: forksActions.Eval, payload: { score: 80 } });
		expect(fsm.state).toBe(forksStates.High);
	});

	it('score <= 50 routes to Low', () => {
		const fsm = createPJSForksTest();
		fsm.dispatch({ action: forksActions.Eval, payload: { score: 30 } });
		expect(fsm.state).toBe(forksStates.Low);
	});

	it('score exactly 50 routes to Low', () => {
		const fsm = createPJSForksTest();
		fsm.dispatch({ action: forksActions.Eval, payload: { score: 50 } });
		expect(fsm.state).toBe(forksStates.Low);
	});
});

describe('pure-javascript codegen - subscribe via EventBus', async () => {
	const subscriberInput = `stateDiagram-v2
	[*] --> INIT
	INIT --> EVENT_RECEIVED: RESPOND_TO_EVENT
note right of INIT
+Init
subscribe/specialEvent RESPOND_TO_EVENT
end note
`;
	await generateAndSave(
		{ input: subscriberInput, automataName: 'PJSSubscribeTest', lang: ModuleNames.PureJavaScript },
		'pjs_subscribe',
	);
	const subMod = await import(getGeneratedPath('pjs_subscribe_generated.js'));
	const { createPJSSubscribeTest, createEventBus: createSubBus, eventDictionary: subEvents, statesDictionary: subStates } = subMod;

	it('createEventBus returns [EventBus, automatas, cleanup] tuple', () => {
		const result = createSubBus('t1', { sub: createPJSSubscribeTest });
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(3);
		const [EventBus, automatas, cleanup] = result;
		expect(typeof EventBus.dispatch).toBe('function');
		expect(typeof EventBus.subscribe).toBe('function');
		expect(typeof EventBus.getEventStack).toBe('function');
		expect(automatas.sub).toBeDefined();
		expect(typeof cleanup).toBe('function');
	});

	it('subscribe transitions FSM on EventBus.dispatch', () => {
		const [EventBus, automatas] = createSubBus('t2', { sub: createPJSSubscribeTest });
		expect(automatas.sub.state).toBe(subStates.INIT);
		EventBus.dispatch({ event: subEvents.specialEvent, meta: {} });
		expect(automatas.sub.state).toBe(subStates.EVENT_RECEIVED);
	});

	it('getEventStack records dispatched events', () => {
		const [EventBus] = createSubBus('t3', { sub: createPJSSubscribeTest });
		EventBus.dispatch({ event: subEvents.specialEvent, meta: {} });
		expect(EventBus.getEventStack().length).toBeGreaterThan(0);
	});
});

describe('pure-javascript codegen - emit via EventBus', async () => {
	const emitterInput = `stateDiagram-v2
	[*] --> INIT
	INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
end note
note right of EMIT_TRIGGER
emit/specialEvent
end note
`;
	await generateAndSave(
		{ input: emitterInput, automataName: 'PJSEmitTest', lang: ModuleNames.PureJavaScript },
		'pjs_emit',
	);
	const emitMod = await import(getGeneratedPath('pjs_emit_generated.js'));
	const { createPJSEmitTest, createEventBus: createEmitBus, eventDictionary: emitEvents, statesDictionary: emitStates } = emitMod;

	it('emitter transitions to EMIT_TRIGGER on subscribed event', () => {
		const [EventBus, automatas] = createEmitBus('t4', { emit: createPJSEmitTest });
		EventBus.dispatch({ event: emitEvents.eventFromBus, meta: {} });
		expect(automatas.emit.state).toBe(emitStates.EMIT_TRIGGER);
	});

	it('emit dispatches specialEvent back to EventBus', () => {
		const [EventBus] = createEmitBus('t5', { emit: createPJSEmitTest });
		const received: unknown[] = [];
		EventBus.subscribe(emitEvents.specialEvent, (ev: unknown) => received.push(ev));
		EventBus.dispatch({ event: emitEvents.eventFromBus, meta: {} });
		expect(received.length).toBeGreaterThan(0);
	});
});

describe('pure-javascript codegen - epoch tracking', async () => {
	const epochMod = await import(getGeneratedPath('pjs_traffic_generated.js'));

	it('exports getEpoch function', () => {
		expect(typeof epochMod.getEpoch).toBe('function');
	});

	it('epoch increments on each successful dispatch', () => {
		const before = epochMod.getEpoch();
		const fsm = epochMod.createTrafficLight();
		fsm.dispatch({ action: epochMod.actionsDictionary.Switch, payload: {} });
		expect(epochMod.getEpoch()).toBe(before + 1);
	});

	it('epoch is shared across instances from same module', () => {
		const before = epochMod.getEpoch();
		const fsm1 = epochMod.createTrafficLight();
		const fsm2 = epochMod.createTrafficLight();
		fsm1.dispatch({ action: epochMod.actionsDictionary.Switch, payload: {} });
		fsm2.dispatch({ action: epochMod.actionsDictionary.Switch, payload: {} });
		expect(epochMod.getEpoch()).toBe(before + 2);
	});

	it('unknown action does not increment epoch', () => {
		const before = epochMod.getEpoch();
		const fsm = epochMod.createTrafficLight();
		fsm.dispatch({ action: -999, payload: {} });
		expect(epochMod.getEpoch()).toBe(before);
	});
});

describe('pure-javascript codegen - internals in context', async () => {
	const internalsInput = `stateDiagram-v2
	[*] --> A: go
	A --> B: step
	B --> A: step
note left of A
	+Init
	#{ cycle = 0 } <= _currentCycle()
end note
note left of B
	#{ cycle = 0 } <= _currentCycle()
end note
`;
	await generateAndSave(
		{ input: internalsInput, automataName: 'PJSInternalsTest', lang: ModuleNames.PureJavaScript },
		'pjs_internals',
	);
	const { createPJSInternalsTest, actionsDictionary: intActions } = await import(
		getGeneratedPath('pjs_internals_generated.js')
	);

	it('context.cycle reflects pre-dispatch cycle (currentCycle - 1)', () => {
		const fsm = createPJSInternalsTest();
		fsm.dispatch({ action: intActions.step, payload: {} });
		expect(fsm.getContext().context.cycle).toBe(fsm.currentCycle - 1);
	});

	it('context.cycle increments on each successful dispatch', () => {
		const fsm = createPJSInternalsTest();
		fsm.dispatch({ action: intActions.step, payload: {} });
		const after1 = fsm.getContext().context.cycle;
		fsm.dispatch({ action: intActions.step, payload: {} });
		const after2 = fsm.getContext().context.cycle;
		expect(after2).toBe(after1 + 1);
	});

	it('context.cycle does not change on impossible action', () => {
		const fsm = createPJSInternalsTest();
		fsm.dispatch({ action: intActions.step, payload: {} });
		const before = fsm.getContext().context.cycle;
		fsm.dispatch({ action: -999, payload: {} });
		expect(fsm.getContext().context.cycle).toBe(before);
	});
});
