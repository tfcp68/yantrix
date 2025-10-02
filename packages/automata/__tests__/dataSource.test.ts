import { uniqId } from '@yantrix/utils';
import { beforeEach, describe, expect, it, vitest } from 'vitest';
import { BasicDataSource } from '../src/DataSource';

describe('basicDataSource', () => {
type TSampleType = object;
const samplePacket: TSampleType = { foo: 'bar' };
let sampleInstance: BasicDataSource;
let setterLink: (d: TSampleType) => void;
let clearLink: () => TSampleType[];
const sampleId = uniqId();
const afterInitSpy = vitest.fn((id, setter, clear) => {
	expect(id).toBe(sampleId);
	setterLink = setter;
	clearLink = clear;
	setter(samplePacket);
});
beforeEach(() => {
	vitest.restoreAllMocks();
	vitest.clearAllTimers();
	sampleInstance = new BasicDataSource({
		id: sampleId,
		afterInit: afterInitSpy,
	});
});

describe('constructor', () => {
	it ('passes a fixture id', () => {
		expect(sampleInstance.id).toBe(sampleId);
	});
	it ('has proper starting values', () => {
		expect(sampleInstance.currentCycle).toBe(1);
		expect(sampleInstance.totalCycles).toBe(1);
		expect(sampleInstance.currentEpoch).toBe(1);
	});
	it('returns an instance of BasicDataSource', () => {
		expect(sampleInstance).toBeInstanceOf(BasicDataSource);
	});
	it('inherits passed id', () => {
		const id = uniqId();
		const testInstance = new BasicDataSource({ id });
		expect(testInstance.id).toBe(id);
	});
	it('has an id when created without a parameter', () => {
		const testInstance = new BasicDataSource({});
		expect(testInstance.id).toBeTruthy();
	});
	it('instance is disabled by default', () => {
		expect(sampleInstance.isActive()).toBe(false);
	});
	it('calls afterInit synchronously', () => {
		expect(afterInitSpy).toHaveBeenCalled();
	});
	it('passes a clear function to afterInit', () => {
		expect(clearLink).toBeTypeOf('function');
	});
	it('passes a setterLink to afterInit', () => {
		expect(setterLink).toBeTypeOf('function');
	});
});

describe('/start, /stop', () => {
	it('start increases epoch and resets cycles', () => {
		const initialEpoch = sampleInstance.currentEpoch;
		// console.warn(sampleInstance, sampleInstance.currentEpoch, sampleInstance.currentCycle, sampleInstance.totalCycles)
		expect(sampleInstance.currentCycle).toBeGreaterThan(0);
		sampleInstance.start();
		expect(sampleInstance.currentEpoch).toBe(initialEpoch + 1);
		expect(sampleInstance.currentCycle).toBe(0);
		expect(sampleInstance.totalCycles).toBeGreaterThan(0);
	});

	it('start/stop should change isActive', () => {
		sampleInstance.start();
		expect(sampleInstance.isActive()).toBe(true);
		sampleInstance.stop();
		expect(sampleInstance.isActive()).toBe(false);
	});
});

describe('/dataEmitter, /eventEmitter', () => {
	it('doesn\'t emit a packet when disabled', () => {
		sampleInstance.stop();
		const packet = sampleInstance.dataEmitter().next();
		expect(packet.value).toBe(null);
	});
	it('emits a preset packet', () => {
		sampleInstance.start();
		const packet = sampleInstance.dataEmitter().next();
		expect(packet.value).toEqual({
			...samplePacket,
			id: sampleId,
		});
	});
	it('emits a custom packet immediately', () => {
		const customPacket: TSampleType = { foo: 'baz' };
		clearLink();
		sampleInstance.start();
		setterLink(customPacket);
		const packet = sampleInstance.dataEmitter().next();
		expect(packet.value).toEqual({
			...customPacket,
			id: sampleId,
		});
	});
	it('emits a sequence of packets', () => {
		const expected = [
			{ foo: 'bar' },
			{ foo: 'baz' },
			{ foo: 'qux' },
		] as const;
		clearLink();
		sampleInstance.start();
		setterLink(expected[0]);
		setterLink(expected[1]);
		setterLink(expected[2]);

		const packets: TSampleType[] = [];
		for (const packet of sampleInstance.dataEmitter()) {
			if (packet) packets.push(packet);
			if (packets.length === expected.length) break;
		}
		expect(packets).toEqual(expected.map(packet => ({ ...packet, id: sampleId })));
	});
	it('does not emit received packet when disabled', () => {
		const customPacket: TSampleType = { foo: 'baz' };
		sampleInstance.stop();
		setterLink(customPacket);
		const packet = sampleInstance.dataEmitter().next();
		expect(packet.value).toBe(null);
	});
	it('can be cleared', () => {
		const customPacket: TSampleType = { foo: 'baz' };
		setterLink(samplePacket); // Add initial packet to queue
		clearLink(); // Clear the queue
		sampleInstance.start();
		setterLink(customPacket); // Add new packet after clearing
		const packet = sampleInstance.dataEmitter().next();
		expect(packet.value).toEqual({
			...customPacket,
			id: sampleId,
		});
	});
	it ('increments cycles and sagas accordingly', () => {
		const samples = 10e5;
		const resetChance = 0.01;
		const startCycle = sampleInstance.currentCycle;
		const startEpoch = sampleInstance.currentEpoch;
		for (let i = 0; i < samples; i++) {
			setterLink({ wat: Math.random().toFixed(3) });
			if (Math.random() <= resetChance) sampleInstance.start();
		}
		expect((sampleInstance.totalCycles - startCycle)).toEqual(samples);
		expect((sampleInstance.currentEpoch - startEpoch) / samples).toBeCloseTo(resetChance, 2);
	});
	it('dataEmitter and eventEmitter consume packets in order and leave no packets for the other', () => {
		const packets = [
			{ foo: 'packet1' },
			{ foo: 'packet2' },
			{ foo: 'packet3' },
		];
		clearLink();
		sampleInstance.start();
		packets.forEach(packet => setterLink(packet));
		const sampleEvent = { event: 1, meta: { t: Math.random() } };
		sampleInstance.addListener(uniqId(), vitest.fn(_data => ([sampleEvent])));
		// Consume using dataEmitter
		const dataPackets: TSampleType[] = [];
		for (const data of sampleInstance.dataEmitter()) {
			if (data) dataPackets.push(data);
			else break;
		}
		expect(dataPackets).toEqual(
			packets.map(packet => ({ ...packet, id: sampleId })),
		);

		// Check eventEmitter has no packets
		const eventsAfterData = sampleInstance.eventEmitter().next();
		expect(eventsAfterData.value).toEqual([]);

		// Reset and consume using eventEmitter
		clearLink();
		packets.forEach(packet => setterLink(packet));

		let eventPackets: TSampleType[] = [];
		for (const eventStack of sampleInstance.eventEmitter()) {
			if (eventStack?.length) eventPackets = eventPackets.concat(eventStack);
			else break;
		}
		expect(eventPackets).toEqual(
			packets.map(_packet => sampleEvent),
		);

		// Check dataEmitter has no packets
		const dataAfterEvent = sampleInstance.dataEmitter().next();
		expect(dataAfterEvent.value).toBe(null);
	});

	it('dataEmitter returns null with no data in queue', () => {
		clearLink(); // Ensure the queue is empty
		sampleInstance.start();
		const packet = sampleInstance.dataEmitter().next();
		expect(packet.value).toBe(null);
	});
	it('eventEmitter returns empty array with no data in queue', () => {
		clearLink(); // Ensure the queue is empty
		sampleInstance.start();
		const packet = sampleInstance.eventEmitter().next();
		expect(packet.value).toEqual([]);
	});

	it('dataEmitter throws when provided with mapper that returns malformed packet', () => {
		const id = uniqId();
		const malformedMapper = (_data: TSampleType) => [{ malformed: true } as any];
		sampleInstance.addListener(id, malformedMapper).start();
		clearLink();
		setterLink(samplePacket);
		expect(() => sampleInstance.dataEmitter().next()).toThrow();
	});
	it('eventEmitter throws when provided with mapper that returns malformed packet', () => {
		const id = uniqId();
		const malformedMapper = (_data: TSampleType) => [{ malformed: true } as any];
		sampleInstance.addListener(id, malformedMapper).start();
		clearLink();
		setterLink(samplePacket);
		expect(() => sampleInstance.eventEmitter().next()).toThrow();
	});
	it('invokes listener and dispatch functions when dataEmitter is consumed', () => {
		const id = uniqId();
		sampleInstance.start();
		setterLink(samplePacket);
		const fixValue = { event: 1, meta: { t: Math.random() } };
		const listener = vitest.fn(() => [fixValue]);
		const dispatch = vitest.fn();
		sampleInstance.addListener(id, listener, dispatch);
		const packet = sampleInstance.dataEmitter().next();
		expect(listener).toHaveBeenCalledWith(packet.value);
		expect(dispatch).toHaveBeenCalledWith(fixValue);
	});
	it('invokes listener and dispatch functions with multiple packets', () => {
		const id = uniqId();
		clearLink();
		sampleInstance.start();
		const packets = [samplePacket, { foo: 'baz' }, { foo: 'qux' }];
		const fixValue = { event: 1, meta: { t: Math.random() } };
		const listener = vitest.fn(() => [fixValue]);
		const dispatch = vitest.fn();
		sampleInstance.addListener(id, listener, dispatch);
		packets.forEach(packet => setterLink(packet));
		let index = 0;
		for (const emittedPacket of sampleInstance.dataEmitter()) {
			if (!emittedPacket)
				break;
			expect(listener).toHaveBeenNthCalledWith(++index, emittedPacket);
			expect(dispatch).toHaveBeenCalledWith(fixValue);
		}
		expect(listener).toHaveBeenCalledTimes(packets.length);
	});
});
describe('/addListener, /removeListener', () => {
	it('can add a listener', () => {
		const id = uniqId();
		const listener = vitest.fn();
		sampleInstance.addListener(id, listener);
		expect(sampleInstance.getEventListeners()).toHaveProperty(id);
	});
	it('can remove a listener', () => {
		const id = uniqId();
		const listener = vitest.fn();
		sampleInstance.addListener(id, listener);
		sampleInstance.removeListener(id);
		expect(sampleInstance.getEventListeners()).not.toHaveProperty(id);
	});
	it('throws when adding a non-function listener', () => {
		expect(() => sampleInstance.addListener(uniqId(), 'not a function' as any)).toThrow();
	});
	it('throws when adding a non-function dispatch', () => {
		expect(() => sampleInstance.addListener(uniqId(), vitest.fn(), 'not a function' as any)).toThrow();
	});
});
describe('multiple listeners cases', () => {
	it('invokes all listeners with dispatch when consuming dataemitter', () => {
		const id1 = uniqId();
		const id2 = uniqId();
		const id3 = uniqId();
		const id4 = uniqId();
		sampleInstance.start();
		setterLink(samplePacket);
		const testEvent = { event: 1, meta: { t: Math.random() } };
		const listener1 = vitest.fn(() => [testEvent]);
		const dispatch1 = vitest.fn();
		const listener2 = vitest.fn();
		const dispatch2 = vitest.fn();
		const listener3 = vitest.fn(() => [testEvent]);
		const listener4 = vitest.fn();
		sampleInstance.addListener(id1, listener1, dispatch1);
		sampleInstance.addListener(id2, listener2);
		sampleInstance.addListener(id3, listener3, dispatch2);
		sampleInstance.addListener(id4, listener4);
		const packet = sampleInstance.dataEmitter().next();
		expect(listener1).toHaveBeenCalledWith(packet.value);
		expect(dispatch1).toHaveBeenCalledWith(testEvent);
		expect(listener2).toHaveBeenCalledWith(packet.value);
		expect(listener3).toHaveBeenCalledWith(packet.value);
		expect(dispatch2).toHaveBeenCalledWith(testEvent);
		expect(listener4).toHaveBeenCalledWith(packet.value);
	});
	it('consuming event emitter invokes all listeners and returns mapped events', () => {
		const id1 = uniqId();
		const id2 = uniqId();
		const id3 = uniqId();
		const id4 = uniqId();
		clearLink();
		sampleInstance.start();
		setterLink(samplePacket);
		const expectedPacket = { ...samplePacket, id: sampleId };
		const testEvent1 = { event: 1, meta: { t: Math.random() } };
		const testEvent2 = { event: 2, meta: { t: Math.random() } };
		const listener1 = vitest.fn(() => [testEvent1]);
		const dispatch1 = vitest.fn();
		const listener2 = vitest.fn();
		const dispatch2 = vitest.fn();
		const listener3 = vitest.fn(() => [testEvent2]);
		const listener4 = vitest.fn();
		sampleInstance.addListener(id1, listener1, dispatch1);
		sampleInstance.addListener(id2, listener2);
		sampleInstance.addListener(id3, listener3, dispatch2);
		sampleInstance.addListener(id4, listener4);
		const events = sampleInstance.eventEmitter().next().value;
		expect(listener1).toHaveBeenCalledWith(expectedPacket);
		expect(dispatch1).toHaveBeenCalledWith(testEvent1);
		expect(listener2).toHaveBeenCalledWith(expectedPacket);
		expect(listener3).toHaveBeenCalledWith(expectedPacket);
		expect(dispatch2).toHaveBeenCalledWith(testEvent2);
		expect(listener4).toHaveBeenCalledWith(expectedPacket);
		expect(events).toEqual([testEvent1, testEvent2]);
	});
	it('getEventListeners returns all registered listeners according to their ids', () => {
		const id1 = uniqId();
		const id2 = uniqId();
		const id3 = uniqId();
		const dispatch1 = vitest.fn();
		const dispatch2 = vitest.fn();
		const transform1 = vitest.fn();
		const transform2 = vitest.fn();
		const transform3 = vitest.fn();
		sampleInstance.addListener(id1, transform1, dispatch1);
		sampleInstance.addListener(id2, transform2);
		sampleInstance.addListener(id3, transform3, dispatch2);
		const eventListeners = sampleInstance.getEventListeners();
		expect(eventListeners).toHaveProperty(id1);
		expect(eventListeners[id1]?.[0]).toBe(transform1);
		expect(eventListeners[id1]?.[1]).toBe(dispatch1);
		expect(eventListeners).toHaveProperty(id2);
		expect(eventListeners[id2]?.[0]).toBe(transform2);
		expect(eventListeners).toHaveProperty(id3);
		expect(eventListeners[id3]?.[0]).toBe(transform3);
		expect(eventListeners[id3]?.[1]).toBe(dispatch2);
	});
});
});
