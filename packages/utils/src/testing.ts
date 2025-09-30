export function waitForEventOnce<E extends number, M extends Record<E, any>>(
	bus: {
		subscribe: (
			event: E,
			cb: (e: { event: E | null; meta: M[E] | null }) => {
				event: E | null;
				meta: M[E] | null;
				task_id: string;
				result: Promise<Array<{ event: E | null; meta: M[E] | null }>>;
			}
		) => any;
		unsubscribe: (
			event: E,
			cb: (e: { event: E | null; meta: M[E] | null }) => {
				event: E | null;
				meta: M[E] | null;
				task_id: string;
				result: Promise<Array<{ event: E | null; meta: M[E] | null }>>;
			}
		) => any;
	},
	event: E,
	timeoutMs = 500,
): Promise<{ event: E; meta: M[E] | null }> {
	return new Promise((resolve, reject) => {
		let done = false;
		let timeoutId: any;

		const cleanup = (handler?: typeof cb) => {
			if (done) return;
			done = true;
			if (handler) {
				bus.unsubscribe(event, handler);
			}
			clearTimeout(timeoutId);
		};

		const cb = (e: { event: E | null; meta: M[E] | null }) => {
			// Unsubscribe and resolve the promise
			cleanup(cb);
			// Ensure we return the expected E type (we are subscribed to a specific event anyway)
			const evt = (e.event ?? event) as E;
			resolve({ event: evt, meta: e.meta });
			// Return a task compatible with the bus
			return {
				event: e.event,
				meta: e.meta,
				task_id: `wait_once_${String(event)}`,
				// Return an empty list of follow-up events
				result: Promise.resolve([] as Array<{ event: E | null; meta: M[E] | null }>),
			};
		};

		timeoutId = setTimeout(() => {
			cleanup(cb);
			reject(new Error(`Timed out waiting for event ${String(event)} after ${timeoutMs}ms`));
		}, timeoutMs);

		bus.subscribe(event, cb);
	});
}

export function waitForState<S extends number>(
	automata: {
		getContext: <K extends S = S>() => { state: K | null; context?: unknown };
	},
	expectedState: S,
	timeoutMs = 500,
	tickMs = 0,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const tick = () => {
			const { state } = automata.getContext<S>();
			if (state === expectedState) return resolve();
			if (Date.now() - start >= timeoutMs) {
				return reject(new Error(`Timed out waiting for state ${String(expectedState)}, got ${String(state)}`));
			}
			setTimeout(tick, tickMs);
		};
		tick();
	});
}
