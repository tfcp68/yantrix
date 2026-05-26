import { describe, expect, it } from 'vitest';
import { automatasList, destroyFSM, fsm_context } from '../src/store/store';
import { TrafficLightAutomata as TLA } from './generated/TrafficLightAutomata_generated';

describe('store.ts (per-id stores)', () => {
	it('initializeFSM with instance returns correlationId and registers it', () => {
		const inst = new TLA();
		const id = fsm_context.initializeFSM(inst);
		expect(id).toBe(inst.correlationId);

		const stored = automatasList[id];
		expect(stored).toBeDefined();
		expect(stored).toBe(inst);

		const store = fsm_context.getStore(id);
		expect(store.getSnapshot()).toBe(inst);

		destroyFSM(id);
	});

	it('initializeFSM with same instance twice returns same id and does not re-register', () => {
		const inst = new TLA();
		const id1 = fsm_context.initializeFSM(inst);
		const id2 = fsm_context.initializeFSM(inst);
		expect(id1).toBe(id2);
		expect(automatasList[id1]).toBe(inst);

		destroyFSM(id1);
	});

	it('getStore.getSnapshot throws when FSM not initialized for the id', () => {
		const ghostId = 'ghost-id-that-does-not-exist';
		const store = fsm_context.getStore(ghostId);
		expect(() => store.getSnapshot()).toThrowError(`FSM '${ghostId}' not initialized`);
	});

	it('subscribe returns unsubscribe and changeState notifies only current id subscribers', () => {
		const instA = new TLA();
		const instB = new TLA();
		const idA = fsm_context.initializeFSM(instA);
		const idB = fsm_context.initializeFSM(instB);

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

		storeB.changeState();
		expect(callsA).toBe(0);
		expect(callsB).toBe(1);

		storeA.changeState();
		expect(callsA).toBe(1);
		expect(callsB).toBe(1);

		unsubA();
		storeA.changeState();
		expect(callsA).toBe(1);

		unsubB();
		storeB.changeState();
		expect(callsB).toBe(1);

		destroyFSM(idA);
		destroyFSM(idB);
	});

	it('initializeFSM does not notify subscribers during init; notifications occur only on changeState', () => {
		const inst = new TLA();
		const store = fsm_context.getStore(inst.correlationId);

		let calls = 0;
		const unsub = store.subscribe(() => {
			calls += 1;
		});

		fsm_context.initializeFSM(inst);
		expect(calls).toBe(0);

		store.changeState();
		expect(calls).toBe(1);

		unsub();
		destroyFSM(inst.correlationId);
	});

	it('multiple instances are isolated (changeState for one does not affect others)', () => {
		const inst1 = new TLA();
		const inst2 = new TLA();
		const id1 = fsm_context.initializeFSM(inst1);
		const id2 = fsm_context.initializeFSM(inst2);

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
		destroyFSM(id1);
		destroyFSM(id2);
	});

	it('destroyFSM removes instance and store from registries', () => {
		const inst = new TLA();
		const id = fsm_context.initializeFSM(inst);
		expect(automatasList[id]).toBeDefined();

		destroyFSM(id);
		expect(automatasList[id]).toBeUndefined();

		const store = fsm_context.getStore(id);
		expect(() => store.getSnapshot()).toThrowError(`FSM '${id}' not initialized`);
	});
});
