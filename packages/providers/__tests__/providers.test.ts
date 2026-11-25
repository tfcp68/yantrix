import { AbstractAgnosticDataDestination, AbstractAgnosticDataSource, CoreLoop } from '@yantrix/automata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHTTPRequestAdapter, IntervalTimerDataSource } from '../src/index.js';

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('interval timer data source', () => {
	it('emits timestamped packets and maps them to events using the source factory', () => {
		vi.useFakeTimers();
		vi.setSystemTime(1000);
		const timer = new IntervalTimerDataSource({ id: 'ticks', interval: 10 });
		expect(timer).toBeInstanceOf(AbstractAgnosticDataSource);
		timer.addListener('clock', packet => [{ event: 1, meta: { at: packet.timestamp } }]);
		const events = timer.eventEmitter();
		const packets = timer.dataEmitter();
		expect(packets.next().value).toBeNull();

		timer.start();
		vi.advanceTimersByTime(10);
		expect(packets.next().value).toEqual({
			id: 'ticks',
			startTimestamp: 1000,
			timestamp: 1010,
			currentCycle: 0,
			totalCycles: 0,
			currentEpoch: 2,
		});
		vi.advanceTimersByTime(10);
		expect(events.next().value).toEqual([{ event: 1, meta: { at: 1020 } }]);

		timer.stop();
		vi.advanceTimersByTime(50);
		expect(packets.next().value).toBeNull();
		timer.start();
		timer.start();
		vi.advanceTimersByTime(10);
		expect(packets.next().value).toMatchObject({
			startTimestamp: 1070,
			timestamp: 1080,
			currentCycle: 0,
			totalCycles: 2,
		});
		expect(packets.next().value).toBeNull();
		timer.stop();
	});

	it('registers directly in a loop with typed events and metadata', () => {
		vi.useFakeTimers();
		type TClockMeta = { 1: { at: number } };
		const timer = new IntervalTimerDataSource<1, TClockMeta>({ interval: 10 });
		const loop = new CoreLoop<1, TClockMeta>();
		const dispatch = vi.fn();
		timer.addListener('clock', packet => [{ event: 1, meta: { at: packet.timestamp } }], dispatch);
		loop.registerSource(timer).start();
		vi.advanceTimersByTime(10);
		loop.tick();
		expect(dispatch).toHaveBeenCalledWith({ event: 1, meta: { at: Date.now() } });
		loop.stop();
	});

	it('requires a positive integer interval', () => {
		expect(() => new IntervalTimerDataSource({ interval: 0 })).toThrow(RangeError);
	});
});

describe('createHTTPRequestAdapter', () => {
	it('routes an event through the destination, fetches the request, and emits the mapped response', async () => {
		const response = new Response(null, { status: 204 });
		const fetchRequest = vi.fn(async (_request: Request) => response);
		vi.stubGlobal('fetch', fetchRequest);
		type TEvents = 0 | 2;
		type TMeta = { 0: { key: string }; 2: { status: number } };
		const [source, destination] = createHTTPRequestAdapter<TEvents, TMeta>({
			routes: {
				0: [
					e => e.meta && {
						url: `https://example.test/${e.meta.key}`,
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(e.meta),
					},
					response => [{ event: 2, meta: { status: response.status } }],
				],
			},
		});
		expect(source).toBeInstanceOf(AbstractAgnosticDataSource);
		expect(destination).toBeInstanceOf(AbstractAgnosticDataDestination);
		expect(source.id).toBe(destination.id);
		source.start();
		destination.start();
		expect(destination.update({ event: 2, meta: { status: 200 } })).toBeNull();
		expect(fetchRequest).not.toHaveBeenCalled();
		destination.update({ event: 0, meta: { key: 'clock' } });
		await vi.waitFor(() => expect(destination.totalCycles).toBe(1));
		expect(fetchRequest).toHaveBeenCalledTimes(1);
		const request = fetchRequest.mock.calls[0]![0];
		expect(request.url).toBe('https://example.test/clock');
		expect(request.method).toBe('POST');
		expect(request.headers.get('content-type')).toBe('application/json');
		expect(await request.json()).toEqual({ key: 'clock' });
		expect(source.eventEmitter().next().value).toEqual([{ event: 2, meta: { status: 204 } }]);
	});

	it('accepts a prebuilt Request with its existing body and metadata', async () => {
		const input = new Request('https://example.test/prebuilt', { method: 'POST', body: 'tick' });
		const fetchRequest = vi.fn(async (_request: Request) => new Response());
		vi.stubGlobal('fetch', fetchRequest);
		const [, destination] = createHTTPRequestAdapter<1, { 1: null }>({
			routes: { 1: [() => input, () => []] },
		});
		destination.start();
		destination.update({ event: 1, meta: null });
		await vi.waitFor(() => expect(destination.totalCycles).toBe(1));
		expect(fetchRequest).toHaveBeenCalledWith(input);
	});
});
