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

	const contextAutomata: TAutomataContext<ContextReduxType> = _fsm.getContext();
	const contextRedux = Object.assign({}, contextAutomata);

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
