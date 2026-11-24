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

export const automatasList: TAutomataList = Object.create(null);

// Subscriptions belong to the instance even if its public route changes.
const instances = new Map<string, TAutomata>();
const routes = new WeakMap<TAutomata, string>();
const restoreDispatch = new WeakMap<TAutomata, () => void>();
const stores = new Map<string, IYantrixBoundStore>();

export function getRoute(inst: TAutomata, name?: string): string {
	const registered = routes.get(inst);
	if (registered !== undefined) return registered;
	if (!name || automatasList[name] || instances.has(name)) return inst.correlationId;
	return name;
}

function warnDuplicate(name: string, fallback: string) {
	console.warn(`Yantrix React: route "${name}" is already in use. Using correlationId "${fallback}".`);
}

/** Lazily creates and caches a bound store for the given FSM id. */
function ensureStore(id: string): IYantrixBoundStore {
	let store = stores.get(id);
	if (!store) {
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
				const inst = instances.get(id);
				if (inst) return inst;
				throw new Error(`FSM '${id}' not initialized`);
			},

			changeState() {
				self.callbacks.forEach(cb => cb());
			},
		};

		stores.set(id, self);
		store = self;
	}
	return store;
}

/**
 * Singleton FSM registry. Manages initialization, store access, and teardown.
 * Patches `instance.dispatch` to notify React subscribers on state/context change.
 */
export const fsm_context: IContextFSM = {
	initializeFSM: (inst: TUseFSMInput, name?: string) => {
		const registered = routes.get(inst);
		if (registered !== undefined) return registered;
		const { correlationId } = inst;
		const occupant = automatasList[correlationId];
		if (occupant && occupant !== inst) {
			// An explicit alias cannot hide a new machine's intrinsic route.
			warnDuplicate(correlationId, occupant.correlationId);
			delete automatasList[correlationId];
			routes.set(occupant, occupant.correlationId);
			automatasList[occupant.correlationId] = occupant;
			ensureStore(occupant.correlationId).changeState();
		}

		const id = getRoute(inst, name);
		if (name && id !== name) warnDuplicate(name, id);
		instances.set(correlationId, inst);
		routes.set(inst, id);
		automatasList[id] = inst;

		const store = ensureStore(correlationId);
		const original = inst.dispatch;
		const dispatch: typeof original = (action) => {
			const before = inst.getContext();
			const after = original.call(inst, action);
			if (after.state !== before.state || !deepEqual(before.context, after.context)) store.changeState();
			return after;
		};
		inst.dispatch = dispatch;
		restoreDispatch.set(inst, () => {
			if (inst.dispatch === dispatch) inst.dispatch = original;
		});
		return id;
	},

	getStore: (id: string) => ensureStore(id),

	destroyFSM: (id: string): void => {
		const inst = instances.get(id);
		if (!inst) return;
		delete automatasList[routes.get(inst)!];
		routes.delete(inst);
		instances.delete(id);
		stores.delete(id);
		restoreDispatch.get(inst)?.();
		restoreDispatch.delete(inst);
	},
};

export function getSnapshotWithSelector<Selection, Statics>(
	store: Pick<IYantrixBoundStore, 'getSnapshot'>,
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
