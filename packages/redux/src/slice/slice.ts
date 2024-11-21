import { createSlice, PayloadAction, SliceSelectors } from '@reduxjs/toolkit';
import { isStaticMethodsAutomata } from '@yantrix/utils';
import { TAutomata, TAutomataContext, TCreateFSMSliceOptions, TReducersFSMSlice } from '../types';

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
 * @param {string} options.name
 * The name of the slice to be created, used in the Redux store.
 *
 * @param {string} [options.reducerPath]
 * Path for the reducer, which can be used to place the reducer in a state hierarchy.
 *
 * @param {(context: ContextType) => StateType} [options.contextToRedux]
 * Function that transforms the FSM context into the Redux context to synchronize data between
 * the FSM and the Redux store. If not specified, the FSM context will be used as is.
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
 *   contextToRedux: (context) => ({ color: context.state, count: context.counter }),
 *   selectors: {
 *     selectColor: (state) => state.trafficLight.color,
 *     selectCounter: (state) => state.trafficLight.counter,
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
	const { Fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	let reducers;
	let actionsNameList;
	const selectorsSlice = Object.assign(selectors ?? {});

	const contextAutomata: TAutomataContext<ContextReduxType> = _fsm.getContext();
	const contextRedux = Object.assign({}, contextToRedux?.(contextAutomata) ?? {});

	if (isStaticMethodsAutomata(Fsm)) {
		actionsNameList = Object.keys(Fsm.actions);
		reducers = actionsNameList.reduce((acc, actionName) => {
			acc[actionName]
				= (
					_state: TAutomataContext<ContextReduxType>,
					action: PayloadAction<(typeof contextAutomata)['context']>,
				) => {
					const { state, context } = _fsm.dispatch({
						action: Fsm.getAction(actionName),
						payload: action.payload,
					});

					// Прокидываем в маппер контекст из автомата, если contextToRedux неопределен,
					// то прокидываем просто контекст из автомата
					const newSliceContext = contextToRedux?.({
						state,
						...context,
					}) ?? { ...contextAutomata.context };

					_state.context = {
						...newSliceContext,
					};
					_state.state = state;
				};
			return acc;
		}, {} as any);
	}

	return createSlice<TAutomataContext<ContextReduxType>, TReducersFSMSlice<Actions, TAutomataContext<ContextReduxType>['context']>, string, SliceSelectors<TAutomataContext<ContextReduxType>>, string>({
		name,
		reducerPath: reducerPath ?? '',
		initialState: contextRedux as TAutomataContext<ContextReduxType>,
		reducers,
		selectors: selectorsSlice,
	});
}
