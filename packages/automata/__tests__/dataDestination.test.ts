import { randomArray, randomInteger, uniqId } from '@yantrix/utils';
import { beforeEach, describe, expect, it, vi, vitest } from 'vitest';
import { BasicDataDestination } from '../src/DataDestination';

describe('dataDestination', () => {
	let sampleInstance: BasicDataDestination;
	const sampleId = uniqId();
	const sampleValue = Math.random();
	const sampleResolver = vitest.fn((_t: Record<string, any>) => Promise.resolve(sampleValue));
	let setResolver: (t: Record<string, any>) => Promise<any>;
	let resolverCallback: any;
	const afterInitSpy = vitest.fn((id, setResolverCallback) => {
		expect(id).toBe(sampleId);
		expect(setResolverCallback).toBeTypeOf('function');
		setResolver = setResolverCallback;
		resolverCallback = setResolverCallback;
	});

	beforeEach(() => {
		vitest.restoreAllMocks();
		vitest.clearAllTimers();
		sampleInstance = new BasicDataDestination({
			id: sampleId,
			afterInit: afterInitSpy,
		});
		setResolver(sampleResolver);
	});

	describe('constructor', () => {
		it('should initialize with the correct id', () => {
			expect(sampleInstance).toBeInstanceOf(BasicDataDestination);
			expect(sampleInstance.id).toBe(sampleId);
		});

		it('should call afterInit with correct arguments', () => {
			expect(afterInitSpy).toHaveBeenCalledWith(
				sampleId,
				resolverCallback,
			);
		});

		it('should match instance id with passed id', () => {
			const newId = uniqId();
			const newInstance = new BasicDataDestination({ id: newId });
			expect(newInstance.id).toBe(newId);
		});

		it('should throw when passed invalid resolver', () => {
			expect(() => new BasicDataDestination({
				id: sampleId,
				resolver: {} as any,
			})).toThrow();
		});

		it ('has proper starting values', () => {
			expect(sampleInstance.currentCycle).toBe(0);
			expect(sampleInstance.totalCycles).toBe(0);
			expect(sampleInstance.currentEpoch).toBe(0);
		});
	});

	describe('start/stop', () => {
		it('should be disabled by default', () => {
			expect(sampleInstance.isActive()).toBe(false);
		});

		it('should be enabled when started and increase epoch', () => {
			sampleInstance.start();
			expect(sampleInstance.isActive()).toBe(true);
			expect(sampleInstance.currentEpoch).toBe(1);
		});

		it('should be disabled when stopped', () => {
			sampleInstance.stop();
			expect(sampleInstance.isActive()).toBe(false);
		});
		it('should reset cycles and increment epoch when started, while keeping total cycles', async () => {
			const initialEpoch = sampleInstance.currentEpoch;
			const totalCycles = sampleInstance.totalCycles;
			sampleInstance.start();
			expect(sampleInstance.currentCycle).toBe(0);
			expect(sampleInstance.currentEpoch).toBe(initialEpoch + 1);
			await sampleInstance.send({ key: 'value' });
			expect(sampleInstance.totalCycles).toBe(totalCycles + 1);
			expect(sampleInstance.currentCycle).toBe(1);
		});

		it('should resolve all packets sent before start', async () => {
			const packets = [
				{ key: 'value1' },
				{ key: 'value2' },
				{ key: 'value3' },
			];

			// Create a new instance with a custom resolver
			const testValue = Math.random();
			const testId = uniqId();
			const customResolver = vitest.fn((_t: Record<string, any>) => Promise.resolve(testValue));
			const customInstance = new BasicDataDestination({
				id: testId,
				resolver: customResolver,
			});

			const currentCycle = customInstance.currentCycle;

			customInstance.stop();

			// Send packets before starting the instance
			packets.forEach(async packet => await customInstance.send(packet));

			// Start the instance
			customInstance.start();
			await vi.waitFor(() => {
				expect(customResolver).toHaveBeenCalledTimes(packets.length);
			});

			// Wait for all packets to be resolved
			for (const packet of packets) {
				expect(customResolver).toHaveBeenCalledWith({
					id: testId,
					...packet,
				}, customInstance);
			}

			// Check requestEmitter has emitted the resolved packets
			for (const packet of packets) {
				const req = customInstance.requestEmitter().next();
				expect(req.value).toEqual({
					data: { ...packet, id: testId },
					result: testValue,
				});
			}

			expect(currentCycle + packets.length).toEqual(customInstance.currentCycle);
		});
	});

	describe('send', () => {
		it('should resolve with correct value when send is called', async () => {
			const data = { key: 'value' };
			const result = await sampleInstance.start().send(data);
			expect(result).toBe(sampleValue);
			expect(sampleResolver).toHaveBeenCalledWith({ ...data, id: sampleInstance.id }, sampleInstance);
		});

		it('should increment cycles after resolver completes', async () => {
			const initialCycle = sampleInstance.currentCycle;
			const totalCycles = sampleInstance.totalCycles;
			await sampleInstance.start().send({ key: 'value' });
			expect(sampleInstance.currentCycle).toBe(initialCycle + 1);
			expect(sampleInstance.totalCycles).toBe(totalCycles + 1);
		});

		it('should throw an error if resolver is not set', () => {
			const sampleInstance2 = new BasicDataDestination({ id: sampleId });
			expect(() => sampleInstance2.send({})).toThrow();
		});
		it('should throw an error if resolver is not provided', () => {
			expect(() => setResolver(null as any)).toThrow(); // Unset resolver
		});

		it('should increment cycles and epochs correctly', async () => {
			const initialCycle = sampleInstance.currentCycle;
			const initialEpoch = sampleInstance.currentEpoch;
			const totalCycles = sampleInstance.totalCycles;
			sampleInstance.start();
			expect(sampleInstance.currentEpoch).toBe(initialEpoch + 1);
			await sampleInstance.send({ key: 'value' });
			expect(sampleInstance.currentCycle).toBe(initialCycle + 1);
			expect(sampleInstance.totalCycles).toBe(totalCycles + 1);
		});

		it('should resolve with null when disabled', async () => {
			const sampleResolver2 = vitest.fn((_t: Record<string, any>) => Promise.resolve(Math.random()));
			const sampleInstance2 = new BasicDataDestination({
				id: uniqId(),
				resolver: sampleResolver2,
			});
			expect(sampleInstance2.isActive()).toBe(false);
			const data = { key: 'value' };
			const result = await sampleInstance2.send(data);
			expect(sampleResolver2).not.toHaveBeenCalled(); // Will be called after `start`
			expect(result).toBeNull();
		});
	});
	describe('requestEmitter', () => {
		it('should return null when created and not started', () => {
			const instance = new BasicDataDestination({ id: uniqId(), resolver: sampleResolver });
			expect(instance.requestEmitter().next().value).toBe(null);
		});
		it('should return null when created, started', () => {
			const instance = new BasicDataDestination({ id: uniqId(), resolver: sampleResolver });
			instance.start();
			expect(instance.requestEmitter().next().value).toBe(null);
		});
		it('should return the result of resolver after send has been dispatched', async () => {
			const testValue = Math.random();
			const sampleResolver2 = vitest.fn((_t: Record<string, any>) => Promise.resolve(testValue));
			const sampleInstance2 = new BasicDataDestination({
				id: uniqId(),
				resolver: sampleResolver2,
			});
			sampleInstance2.start();
			const data = { key: 'value' };
			await sampleInstance2.send(data);
			const testData = {
				...data,
				id: sampleInstance2.id,
			};
			const result = await sampleInstance2.requestEmitter().next().value;
			expect(sampleResolver2).toHaveBeenCalledWith(testData, sampleInstance2);
			expect(result).toEqual({ data: testData, result: testValue });
		});
		it('should return null after send when stopped', async () => {
			const testValue = Math.random();
			const sampleResolver2 = vitest.fn((_t: Record<string, any>) => Promise.resolve(testValue));
			const sampleInstance2 = new BasicDataDestination({
				id: uniqId(),
				resolver: sampleResolver2,
			});
			sampleInstance2.start();
			const data = { key: 'value' };
			sampleInstance2.stop();
			await sampleInstance2.send(data);
			const result = await sampleInstance2.requestEmitter().next().value;
			expect(sampleResolver2).not.toHaveBeenCalled();
			expect(result).toBe(null);
		});
		it('should return the error thrown by resolver after send has been dispatched', async () => {
			const sampleResolver2 = vitest.fn((_t: Record<string, any>) => Promise.reject(new Error('Test error')));
			const sampleInstance2 = new BasicDataDestination({
				id: uniqId(),
				resolver: sampleResolver2,
			});
			sampleInstance2.start();
			const data = { key: 'value' };
			await sampleInstance2.send(data);
			const result = await sampleInstance2.requestEmitter().next().value;
			expect(sampleResolver2).toHaveBeenCalledWith({
				...data,
				id: sampleInstance2.id,
			}, sampleInstance2);
			expect(result).toEqual({
				result: null,
				data: { ...data, id: sampleInstance2.id },
				error: new Error('Test error'),
			});
		});
	});
	describe('getBoundEvents', () => {
		it('should return an empty array by default', () => {
			expect(sampleInstance.getBoundEvents()).toEqual([]);
		});
		it('should return bound events after triggers are added', () => {
			const events = [randomInteger(1, 20), randomInteger(21, 40), randomInteger(41, 60)];
			sampleInstance.createTrigger(events, () => null);
			const boundEvents = sampleInstance.getBoundEvents();
			expect(boundEvents).toEqual(expect.arrayContaining(events));
			expect(boundEvents.length).toBe(events.length);
		});
		it('returns each key only once', () => {
			const events1 = [1, 2, 3];
			const events2 = [2, 3, 4];
			sampleInstance
				.createTrigger(events1, () => null)
				.createTrigger(events2, () => null);
			expect(sampleInstance.getBoundEvents()).toEqual([1, 2, 3, 4]);
		});
	});
	describe('triggers', () => {
		it('createTrigger returns the instance', () => {
			const events = [2, 3, 4];
			expect(sampleInstance.createTrigger(events, () => null)).toBe(sampleInstance);
		});
		it('createTrigger throws an error if passed an invalid argument', () => {
			expect(() => sampleInstance.createTrigger(null, null as any)).toThrow();
			expect(() => sampleInstance.createTrigger('asa' as any, null as any)).toThrow();
			expect(() => sampleInstance.createTrigger(['not an event'] as any, () => null)).toThrow();
		});
		it ('removeTrigger returns the instance', () => {
			expect(sampleInstance.removeTrigger([1, 2, 3])).toBe(sampleInstance);
		});
		it('removeTrigger throws an error if passed an invalid argument', () => {
			expect(() => sampleInstance.removeTrigger('ff' as any)).toThrow();
			expect(() => sampleInstance.removeTrigger(['not an event'] as any)).toThrow();
		});
		it('removeTrigger removes a specific selector', () => {
			const events = [2, 3, 4];
			const spy1 = vitest.fn();
			const spy2 = vitest.fn();
			sampleInstance
				.createTrigger(events, spy1)
				.createTrigger(events, spy2);
			expect(sampleInstance.getBoundEvents()).toEqual(events);
			expect(sampleInstance.getTriggers()[2]).toHaveLength(2); // spy1 and spy2
			expect(sampleInstance.getTriggers()[2]?.[1]).toBe(spy1);
			expect(sampleInstance.getTriggers()[2]?.[0]).toBe(spy2);
			sampleInstance.removeTrigger(events, spy2);
			expect(sampleInstance.getBoundEvents()).toEqual(events);
			expect(sampleInstance.getTriggers()[2]).toHaveLength(1); // spy1 only
			expect(sampleInstance.getTriggers()[2]?.[0]).toBe(spy1);
		});
		it('getTriggers returns the triggers without duplicates', () => {
			const events1 = [1, 2, 3];
			const events2 = [2, 3, 4];
			const spy1 = vitest.fn();
			const spy2 = vitest.fn();
			sampleInstance
				.createTrigger(events1, spy1)
				.createTrigger(events2, spy2)
				.removeTrigger([1]);
			expect(sampleInstance.getBoundEvents()).toEqual([2, 3, 4]);
			expect(sampleInstance.getTriggers()[2]).toHaveLength(2); // spy1 and spy2
			expect(sampleInstance.getTriggers()[2]?.[1]).toBe(spy1);
			expect(sampleInstance.getTriggers()[2]?.[0]).toBe(spy2);
			expect(sampleInstance.getTriggers()[3]).toHaveLength(2);
			expect(sampleInstance.getTriggers()[3]?.[1]).toBe(spy1);
			expect(sampleInstance.getTriggers()[3]?.[0]).toBe(spy2);
			expect(sampleInstance.getTriggers()[4]).toHaveLength(1);
			expect(sampleInstance.getTriggers()[4]?.[0]).toBe(spy2);
		});
	});
	describe('update', () => {
		it('calls the passed selector when event is sent', async () => {
			const spy = vitest.fn((event, model) => (event?.event || 0) + (model?.value || 0));
			const events = [1, 2, 3];
			sampleInstance.createTrigger(events, spy).start();
			const testEvent = { event: 1, meta: {} };
			const dataPackets = sampleInstance.update(testEvent, { value: 2 });
			expect(spy).toHaveBeenCalledWith(testEvent, { value: 2 });
			expect(dataPackets).toEqual(expect.arrayContaining([3]));
			expect(dataPackets).toHaveLength(1);
		});
		it('returns correct values when the same event has two different selectors', async () => {
			const selector1 = vitest.fn((event, model) => ({ result: event?.meta?.t + model?.value }));
			const selector2 = vitest.fn((_event, _model) => ({ result: 5 }));
			const events1 = [2];
			const events2 = [2, 3];

			sampleInstance.createTrigger(events1, selector1).createTrigger(events2, selector2).start();

			const testEvent = { event: 2, meta: { t: 1234 } };
			const dataPackets = sampleInstance.update(testEvent, { value: 2 });

			expect(selector1).toHaveBeenCalledWith(testEvent, { value: 2 });
			expect(selector2).toHaveBeenCalledWith(testEvent, { value: 2 });

			expect(dataPackets).toEqual(expect.arrayContaining([{ result: 1236 }, { result: 5 }]));
			expect(dataPackets).toHaveLength(2);
		});
		it('does not call the passed selector when event is not bound', async () => {
			const spy = vitest.fn();
			const events = [1, 2, 3];
			sampleInstance.createTrigger(events, spy);
			const testEvent = { event: 100, meta: {} };
			const dataPackets = sampleInstance.update(testEvent, { value: 2 });
			expect(spy).not.toHaveBeenCalled();
			expect(dataPackets).toBe(null);
		});
		it('calls the resolver with the selector result when a bound event is sent', async () => {
			const selector = vitest.fn((event, model) => ({ result: event?.meta?.t + model?.value }));
			const events = [1, 2, 3];
			sampleInstance.createTrigger(events, selector).start();
			const testEvent = { event: 1, meta: { t: 1234 } };
			sampleInstance.update(testEvent, { value: 2 });
			expect(selector).toHaveBeenCalledWith(testEvent, { value: 2 });
			expect(sampleResolver).toHaveBeenCalledWith({
				result: 1236,
				id: sampleInstance.id,
			}, sampleInstance);
		});
		it('returns null and doesn\'t call selector and/or resolver when the instance is disabled', async () => {
			const spy = vitest.fn();
			const events = [1, 2, 3];
			sampleInstance.createTrigger(events, spy);
			sampleInstance.stop();
			const testEvent = { event: 1, meta: {} };
			const result = sampleInstance.update(testEvent, { value: 2 });
			expect(spy).not.toHaveBeenCalled();
			expect(sampleResolver).not.toHaveBeenCalled();
			expect(result).toBe(null);
		});
		it('throws an error when passed an invalid event', () => {
			const testEvent = { event: null, meta: {} };
			expect(() => sampleInstance.update(testEvent, { value: 2 })).toThrow();
		});
		it('calls the selector and resolver for every sent event when a wildcard trigger is used', async () => {
			const selector = vitest.fn((event, model) => ({ result: event?.meta?.t + model?.value }));
			const events = randomArray(() => randomInteger(), 5);
			sampleInstance.createTrigger(null, selector).start();
			events.forEach((event) => {
				const testEvent = { event, meta: { t: Math.random() } };
				sampleInstance.update(testEvent, { value: 2 });
			});
			expect(selector).toHaveBeenCalledTimes(events.length);
			expect(sampleResolver).toHaveBeenCalledTimes(events.length);
		});
	});
});
