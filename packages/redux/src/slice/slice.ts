import { createSlice, PayloadAction, SliceSelectors } from '@reduxjs/toolkit';
import { TAutomata, TAutomataContext, TCreateFSMSliceOptions, TReducersFSMSlice } from '../types';
import { isStaticMethodsAutomata } from '../utility/typeGuards';

/**
 * Функция для создания обертки над redux slice.
 * Хранит в себе текущее состояни автомата, возвращает готовый слайс с редьюсерами,
 * каждый из которых вызывается как action автомата
 * @param options
 */
export function createFSMSlice<Actions extends string | number | symbol, ContextReduxType extends object, Automata extends TAutomata = TAutomata>(
	options: TCreateFSMSliceOptions<Automata, ContextReduxType>,
) {
	const { Fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	let reducers;
	let actionsNameList;
	const selectorsSlice = Object.assign(selectors ?? {});

	const stateAutomata: TAutomataContext<ContextReduxType> = _fsm.getContext();
	const contextRedux = Object.assign({}, stateAutomata);

	if (isStaticMethodsAutomata(Fsm)) {
		actionsNameList = Object.keys(Fsm.actions);
		reducers = actionsNameList.reduce((acc, actionName) => {
			acc[actionName]
				= (
					state: TAutomataContext<ContextReduxType>,
					action: PayloadAction<(typeof stateAutomata)>,
				) => {
					const rootReducer = _fsm.getReducer();
					return rootReducer
						? rootReducer({
							action: Fsm.getAction(actionName),
							payload: action.payload,
							context: stateAutomata.context,
							state: state.state,
						})
						: { ...state };
				};
			return acc;
		}, {} as any);
	}

	if (contextToRedux)
		contextRedux.context = contextToRedux(contextRedux.context);

	return createSlice<TAutomataContext<ContextReduxType>, TReducersFSMSlice<Actions, TAutomataContext<ContextReduxType>>, string, SliceSelectors<TAutomataContext<ContextReduxType>>, string>({
		name,
		reducerPath: reducerPath ?? '',
		initialState: contextRedux as TAutomataContext<ContextReduxType>,
		reducers,
		selectors: selectorsSlice,
	});
}
