import { isAutomata, isPropsUseFSM } from '../typeGuards';
import { IContextFSM, IYantrixBoundStore, TAutomata, TAutomataConstructorWithStatic, TListenerCallback, TUseFSMProps } from '../types';

/**
 * Registry of created automata instances keyed by their unique id.
 */
export const automatasList: Record<string, TAutomata> = {};

/**
 * Internal storage for per-FSM subscriber stores.
 * Each key is an FSM id and the value is the corresponding store.
 */
const stores: Record<string, IYantrixBoundStore> = {};

/**
 * Ensure that a subscriber store exists for the given FSM id.
 * If a store does not exist, it is created with basic subscribe/getSnapshot/changeState methods.
 *
 * @param id - Unique identifier of the FSM
 * @returns The store associated with the id
 * @throws If a snapshot is requested but the FSM instance is not initialized
 */
function ensureStore(id: string): IYantrixBoundStore {
	let store = stores[id];
	if (!store) {
		const self: IYantrixBoundStore = {
			callbacksIdCounter: 0,
			callbacks: new Map<number, TListenerCallback>(),

			/**
			 * Subscribe to state changes for this FSM.
			 * Returns an unsubscribe function.
			 *
			 * @param cb - Listener callback invoked on state change
			 */
			subscribe(cb: TListenerCallback) {
				const subId = ++self.callbacksIdCounter;
				self.callbacks.set(subId, cb);
				return () => {
					self.callbacks.delete(subId);
				};
			},

			/**
			 * Return a snapshot of the automata instance associated with this store.
			 *
			 * @throws If the automata instance was not initialized
			 */
			getSnapshot() {
				const inst = automatasList[id];
				if (!inst) {
					throw new Error(`FSM '${id}' not initialized`);
				}
				return inst;
			},

			/**
			 * Notify all subscribers about a state change.
			 */
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
 * Public context object used by the hook/integration to initialize and access FSM instances.
 */
export const fsm_context: IContextFSM = {
	/**
	 * Initialize an FSM and ensure its store exists.
	 *
	 * Returns the id of the created or existing automata.
	 *
	 * @param Automata - Automata constructor or props object returned by codegen
	 * @returns The FSM id string
	 * @throws When the provided value is neither a valid automata nor props object
	 */
	initializeFSM: (Automata: TUseFSMProps | TAutomataConstructorWithStatic) => {
		if (isAutomata(Automata)) {
			const id = Automata.id;
			if (!automatasList[id]) {
				automatasList[id] = new Automata();
			}
			ensureStore(id);
			return id;
		} else if (isPropsUseFSM(Automata)) {
			const id = Automata.id;
			if (!automatasList[id]) {
				automatasList[id] = new Automata.Automata();
			}
			ensureStore(id);
			return id;
		}
		throw new Error('Is not fsm or props');
	},

	/**
	 * Get (and create if needed) the store associated with the given FSM id.
	 *
	 * @param id - FSM identifier
	 * @returns The IYantrixBoundStore instance for the id
	 */
	getStore: (id: string) => ensureStore(id),
};
