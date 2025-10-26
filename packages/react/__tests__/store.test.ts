import { uniqId } from '@yantrix/core';
import { describe, expect, it } from 'vitest';
import { automatasList, fsm_context } from '../src/store/store';
import { TrafficLightAutomata as TLA } from './fixtures/TrafficLightAutomata';

describe('store.ts (per-id stores)', () => {
	it('initializeFSM with class returns static id and creates an instance', () => {
		const id = fsm_context.initializeFSM(TLA);
		expect(id).toBe(TLA.id);

		const instance = automatasList[id];
		expect(instance).toBeDefined();
		expect(instance).toBeInstanceOf(TLA);

		const store = fsm_context.getStore(id);
		expect(store.getSnapshot()).toBe(instance);
	});

	it('initializeFSM with props uses provided id and creates an instance once', () => {
		const customId = uniqId();
		const id1 = fsm_context.initializeFSM({ Automata: TLA, id: customId });
		expect(id1).toBe(customId);

		const instance1 = automatasList[customId];
		expect(instance1).toBeDefined();
		expect(instance1).toBeInstanceOf(TLA);

		// Calling again with the same id should not re-instantiate
		const id2 = fsm_context.initializeFSM({ Automata: TLA, id: customId });
		expect(id2).toBe(customId);
		const instance2 = automatasList[customId];
		expect(instance2).toBe(instance1);

		const store = fsm_context.getStore(customId);
		expect(store.getSnapshot()).toBe(instance1);
	});

	it('getStore.getSnapshot throws when FSM not initialized for the id', () => {
		const ghostId = uniqId();
		const store = fsm_context.getStore(ghostId);
		expect(() => store.getSnapshot()).toThrowError(`FSM '${ghostId}' not initialized`);
	});

	it('subscribe returns unsubscribe and changeState notifies only current id subscribers', () => {
		const idA = uniqId();
		const idB = uniqId();

		// Init only A to get a valid snapshot
		fsm_context.initializeFSM({ Automata: TLA, id: idA });
		const storeA = fsm_context.getStore(idA);
		const storeB = fsm_context.getStore(idB);

		let callsA = 0;
		let callsB = 0;
		const unsubA = storeA.subscribe(() => {
			callsA += 1;
		});
		const unsubB = storeB.subscribe(() => {
			callsB += 1;
		});

		// change B -> only B listeners notified
		storeB.changeState();
		expect(callsA).toBe(0);
		expect(callsB).toBe(1);

		// change A -> only A listeners notified
		storeA.changeState();
		expect(callsA).toBe(1);
		expect(callsB).toBe(1);

		// Unsubscribe A and change A again -> no extra notify for A
		unsubA();
		storeA.changeState();
		expect(callsA).toBe(1);

		// Unsubscribe B and change B again -> no extra notify for B
		unsubB();
		storeB.changeState();
		expect(callsB).toBe(1);
	});

	it('initializeFSM(class) does not notify subscribers during render/init; notifications occur only on changeState', () => {
		// Prepare id and subscribe before/after init to ensure no implicit notifications
		const id = uniqId();
		const store = fsm_context.getStore(id);

		let calls = 0;
		const unsub = store.subscribe(() => {
			calls += 1;
		});

		// No instance yet; getSnapshot would throw, but subscription exists
		// Initialize should NOT call subscribers implicitly
		fsm_context.initializeFSM({ Automata: TLA, id });
		expect(calls).toBe(0);

		// Now when we explicitly notify, the subscriber is called
		store.changeState();
		expect(calls).toBe(1);

		unsub();
	});

	it('multiple automata ids are isolated (changeState for one id does not affect others)', () => {
		const id1 = uniqId();
		const id2 = uniqId();
		fsm_context.initializeFSM({ Automata: TLA, id: id1 });
		fsm_context.initializeFSM({ Automata: TLA, id: id2 });

		const s1 = fsm_context.getStore(id1);
		const s2 = fsm_context.getStore(id2);

		let c1 = 0;
		let c2 = 0;
		const u1 = s1.subscribe(() => {
			c1 += 1;
		});
		const u2 = s2.subscribe(() => {
			c2 += 1;
		});

		s1.changeState();
		expect(c1).toBe(1);
		expect(c2).toBe(0);

		s2.changeState();
		expect(c1).toBe(1);
		expect(c2).toBe(1);

		u1();
		u2();
	});
});
