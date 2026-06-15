import { CoreLoop } from './CoreLoop';
import {
	TAutomataBaseEventType,
} from './types';
import { IAutomataEventBus } from './types/interfaces';

/** A clock drives the loop, `start` registers a per-tick callback, `stop` tears it down. */
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

export type TTimedCoreLoopOptions = {
	tickMs?: number;
	clock?: ICoreLoopClock;
};

/**
 * {@link CoreLoop} driven by a clock
 */
export class TimedCoreLoop<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends CoreLoop<EventType, EventMetaType> {
	readonly #clock: ICoreLoopClock;

	constructor(bus?: IAutomataEventBus<EventType, EventMetaType>, opts: TTimedCoreLoopOptions = {}) {
		super(bus);
		this.#clock = opts.clock ?? createTimeoutClock(opts.tickMs ?? DEFAULT_TICK_MS);
	}

	protected override onStart(): void {
		this.#clock.start(() => this.tick());
	}

	protected override onStop(): void {
		this.#clock.stop();
	}
}
