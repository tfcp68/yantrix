import { deepEqual } from '@yantrix/utils';
import { isNullish, readVersion } from '../helpers';
import {
	IContextFSM,
	IYantrixBoundStore,
	TAutomata,
	TAutomataList,
	TListenerCallback,
	TRef,
	TUseFSMInput,
} from '../types';

export const automatasList: TAutomataList = {};

const stores: Record<string, IYantrixBoundStore> = {};

/** Lazily creates and caches a bound store for the given FSM id. */
function ensureStore(id: string): IYantrixBoundStore {
	let store = stores[id];
	if (!store) {
		// Cache last known instance so getSnapshot survives the window between
		// destroyFSM (which clears automatasList) and the next render that
		// re-registers the instance (e.g. React StrictMode cleanup/remount).
		let lastInst: TAutomata | null = null;

		const self: IYantrixBoundStore = {
			callbacksIdCounter: 0,
			callbacks: new Map<number, TListenerCallback>(),

			subscribe(cb: TListenerCallback) {
				const subId = ++self.callbacksIdCounter;
				self.callbacks.set(subId, cb);
				return () => {
					self.callbacks.delete(subId);
				};
			},

			getSnapshot() {
				const inst = automatasList[id];
				if (inst) {
					lastInst = inst;
					return inst;
				}
				if (lastInst) return lastInst;
				throw new Error(`FSM '${id}' not initialized`);
			},

			changeState() {
				self.callbacks.forEach(cb => cb());
			},
		};

		stores[id] = self;
		store = self;
	}
	return store;
}

/**
 * Singleton FSM registry. Manages initialization, store access, and teardown.
 * Patches `instance.dispatch` to notify React subscribers on state/context change.
 */
export const fsm_context: IContextFSM = {
	initializeFSM: (inst: TUseFSMInput) => {
		const id = inst.correlationId;
		if (!automatasList[id]) {
			automatasList[id] = inst;

			const original = inst.dispatch.bind(inst);
			inst.dispatch = (action) => {
				const { state: prevState, context: prevCtx } = inst.getContext();
				const result = original(action);
				if (result.state !== prevState || !deepEqual(prevCtx, result.context)) {
					ensureStore(id).changeState();
				}
				return result;
			};
		}
		ensureStore(id);
		return id;
	},

	getStore: (id: string) => ensureStore(id),

	destroyFSM: (id: string): void => {
		delete automatasList[id];
	},
};

export function getSnapshotWithSelector<Selection, Statics>(
	store: IYantrixBoundStore,
	staticsRef: TRef<Statics>,
	selector: (inst: TAutomata, statics: Statics) => Selection,
	versionRef: TRef<number>,
	selectionRef: TRef<Selection | null>,
	isEqual?: (a: Selection, b: Selection) => boolean,

): Selection {
	const inst = store.getSnapshot();
	const version = readVersion(inst);

	const prevVersion = versionRef.current;
	const prevSelection = selectionRef.current;

	if (version === prevVersion && prevSelection !== null) {
		return prevSelection;
	}

	const nextSel = selector(inst, staticsRef.current);
	if (isNullish(nextSel)) {
		throw new Error('Undefined or null selection value');
	}

	if (prevSelection !== null && version !== prevVersion && typeof isEqual === 'function') {
		if (isEqual(prevSelection, nextSel)) {
			versionRef.current = version;
			return prevSelection;
		}
	}

	selectionRef.current = nextSel;
	versionRef.current = version;
	return nextSel;
}
