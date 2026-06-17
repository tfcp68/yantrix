import { CoreLoop, TCoreLoopProps } from './CoreLoop';
import {
	TAutomataBaseEventType,
} from './types';

type TNonPromise<R> = R extends Promise<unknown> ? never : R;

/**
 * A clock drives the loop, `start` registers a per-tick callback, `stop` tears it down.
 */
export interface ICoreLoopClock {
	start: <R>(onTick: () => TNonPromise<R>) => void;
	stop: () => void;
}

/**
 * Self-scheduling `setTimeout` clock @ `tickMs`
 */
export function createTimeoutClock(tickMs: number): ICoreLoopClock {
	let handle: ReturnType<typeof setTimeout> | null = null;
	let onTick: (() => void) | null = null;
	let startTime = 0;
	let lastTickN = -1;
	let running = false;

	const loop = () => {
		const tickN = Math.floor((Date.now() - startTime) / tickMs);
		if (tickN > lastTickN) {
			lastTickN = tickN;
			onTick?.();
		}
		if (!running) return; // onTick may have called stop(): do not resurrect the chain
		const nextTickTime = startTime + (lastTickN + 1) * tickMs;
		const delay = Math.max(0, nextTickTime - Date.now());
		handle = setTimeout(loop, delay);
	};

	return {
		start(cb) {
			if (cb.constructor?.name === 'AsyncFunction') {
				throw new TypeError('createTimeoutClock: onTick must be synchronous');
			}
			if (handle != null) clearTimeout(handle); // re-arm: drop prior chain
			onTick = cb;
			startTime = Date.now();
			lastTickN = -1;
			running = true;
			handle = setTimeout(loop, tickMs);
		},
		stop() {
			running = false;
			if (handle != null) clearTimeout(handle);
			handle = null;
			onTick = null;
		},
	};
}

export const DEFAULT_TICK_MS = 33;

type TTimedCoreLoopOptions = {
	tickMs?: number;
	clock?: ICoreLoopClock;
};

/** Props for {@link TimedCoreLoop}: the base props plus the clock knobs. */
export type TTimedCoreLoopProps<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = TCoreLoopProps<EventType, EventMetaType> & TTimedCoreLoopOptions;

/**
 * {@link CoreLoop} driven by a clock
 */
export class TimedCoreLoop<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends CoreLoop<EventType, EventMetaType> {
	readonly #clock: ICoreLoopClock;

	constructor(props: TTimedCoreLoopProps<EventType, EventMetaType> = {}) {
		super(props);
		this.#clock = props.clock ?? createTimeoutClock(props.tickMs ?? DEFAULT_TICK_MS);
	}

	override start(): this {
		super.start();
		this.#clock.start(() => this.tick());
		return this;
	}

	override stop(): this {
		super.stop();
		this.#clock.stop();
		return this;
	}
}
