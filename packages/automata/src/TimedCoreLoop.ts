import { CoreLoop, TCoreLoopProps } from './CoreLoop';
import {
	TAutomataBaseEventType,
} from './types';

/**
 * A clock drives the loop, `start` registers a per-tick callback, `stop` tears it down.
 * Implementations MUST be idempotent: calling `start` when already running must not
 * start a second chain; calling `stop` when already stopped must be a no-op.
 */
export interface ICoreLoopClock {
	start: (onTick: () => void) => void;
	stop: () => void;
}

/**
 * Self-scheduling `setTimeout` clock @ `tickMs`
 */
export function createTimeoutClock(tickMs: number): ICoreLoopClock {
	let handle: ReturnType<typeof setTimeout> | null = null;
	let onTick: (() => void) | null = null;

	const loop = () => {
		const t0 = Date.now();
		onTick?.();
		const delay = Math.max(0, tickMs - (Date.now() - t0));
		handle = setTimeout(loop, delay);
	};

	return {
		start(cb) {
			if (handle != null) clearTimeout(handle); // re-arm is idempotent: drop any prior chain, never leak a second timer
			onTick = cb;
			handle = setTimeout(loop, tickMs);
		},
		stop() {
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
