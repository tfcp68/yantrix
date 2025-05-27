import { uniqId } from '@yantrix/utils';
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
});
