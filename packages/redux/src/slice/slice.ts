import { createSlice, PayloadAction, SliceSelectors } from '@reduxjs/toolkit';
import { isStaticMethodsAutomata } from '@yantrix/utils';
import { TAutomata, TAutomataContext, TCreateFSMSliceOptions, TReducersFSMSlice } from '../types';

// Each Redux store sends its own initialization action through all mounted reducers.
// Using that action as the key keeps independent stores' namespaces separate.
const namesByInitialization = new WeakMap<object, Map<string, TAutomata>>();

function checkSliceName(initialization: object, name: string, machine: TAutomata): void {
	let names = namesByInitialization.get(initialization);
	if (!names) {
		names = new Map();
		namesByInitialization.set(initialization, names);
	}

	const previous = names.get(name);
	if (previous && previous !== machine) {
		console.warn(`Multiple Yantrix slices use the Redux name "${name}" in this store. Both handle actions in that namespace.`);
	} else {
		names.set(name, machine);
	}
}

/**
 * Function for creating a wrapper around a Redux slice.
 * Stores the current state of the FSM and returns a ready-to-use slice with reducers
 * that correspond to the FSM's actions.
 *
 * @template Actions Type representing possible FSM actions (string | number | symbol).
 * @template ContextReduxType Type of the context stored in Redux.
 * @template Automata Type of the FSM, which should implement TAutomata.
 * @param {TCreateFSMSliceOptions<Automata, ContextReduxType>} options
 * Options for creating the slice:
 *
 * @param {TClassConstructor<Automata>} options.Fsm
 * The FSM class used to initialize the FSM and define its actions and states.
 *
 * @param {string} [options.name]
 * Redux action namespace. An omitted or empty name uses the machine's correlationId.
 *
 * @param {string} [options.reducerPath]
 * Path for the reducer, which can be used to place the reducer in a state hierarchy.
 *
 * @param {Function} [options.contextToRedux]
 * Maps the current FSM snapshot to the slice's context at initialization and after each handled action.
 * The snapshot includes the state ID and raw context. Raw context fields are also available at the top level.
 * Redux receives a shallow copy of the projected object or array; nested values must be treated as immutable.
 *
 * @param {SliceSelectors<TAutomataContext<ContextReduxType>>} [options.selectors]
 * Set of selectors for accessing slice data from the Redux state.
 *
 * @returns {ReturnType<typeof createSlice>}
 * Created Redux slice containing reducers that correspond to the FSM's actions and selectors.
 *
 * @example
 * // Example usage with the TrafficLightAutomata FSM:
 * const trafficLightSlice = createFSMSlice({
 *   Fsm: TrafficLightAutomata,
 *   name: 'trafficLight',
 *   contextToRedux: ({ state, context }) => ({ color: state, count: context.counter }),
 *   selectors: {
 *     selectColor: slice => slice.context.color,
 *     selectCounter: slice => slice.context.count,
 *   },
 * });
 *
 * // Access FSM actions via dispatch:
 * dispatch(trafficLightSlice.actions.Switch({}));
 *
 * @description
 * The function wraps the FSM into a Redux slice, storing the current state of the FSM and its context.
 * Each FSM action automatically calls the corresponding reducer in the created slice.
 * This approach ensures decomposition and automation of FSM logic within the Redux store structure.
 */
export function createFSMSlice<Actions extends string
	| number
	| symbol, ContextReduxType extends object, Automata extends TAutomata = TAutomata>(
	options: TCreateFSMSliceOptions<Automata, ContextReduxType>,
) {
	const { Fsm, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	const name = options.name || _fsm.correlationId;
	let reducers;
	let actionsNameList;
	const selectorsSlice = Object.assign(selectors ?? {});

	function project(
		{ state, context }: TAutomataContext<ReturnType<Automata['getContext']>['context']>,
	): TAutomataContext<ContextReduxType> {
		let projected = contextToRedux ? contextToRedux({ ...context, state, context }) : context;
		if (Array.isArray(projected)) projected = Array.prototype.slice.call(projected);
		else if (projected !== null && typeof projected === 'object') projected = { ...projected };
		return { state, context: projected };
	}

	if (isStaticMethodsAutomata(Fsm)) {
		actionsNameList = Object.keys(Fsm.actions);
		reducers = actionsNameList.reduce((acc, actionName) => {
			acc[actionName]
				= (
					_state: TAutomataContext<ContextReduxType>,
					action: PayloadAction<ContextReduxType>,
				) => {
					return project(_fsm.dispatch({
						action: Fsm.getAction(actionName),
						payload: action.payload,
					}));
				};
			return acc;
		}, {} as any);
	}

	return createSlice<TAutomataContext<ContextReduxType>, TReducersFSMSlice<Actions, TAutomataContext<ContextReduxType>['context']>, string, SliceSelectors<TAutomataContext<ContextReduxType>>, string>({
		name,
		reducerPath: reducerPath ?? name,
		initialState: project(_fsm.getContext()),
		reducers,
		selectors: selectorsSlice,
		extraReducers: builder => builder.addMatcher(
			action => action.type.startsWith('@@redux/'),
			(_state, action) => checkSliceName(action, name, _fsm),
		),
	});
}
