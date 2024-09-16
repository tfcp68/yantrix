import { PayloadAction, SliceSelectors, createSlice } from '@reduxjs/toolkit';
import { TAutomata, TClassConstructor, TCreateFSMSliceOptions, TReducersFSMSlice, TStateFSMSlice } from '../types';

/**
 * Функция для создания обертки над redux slice.
 * Хранит в себе текущее состояни автомата, возвращает готовый слайс с редьюсерами,
 * каждый из которых вызывается как action автомата
 * @param options
 */
export function createFSMSlice<Automata extends TAutomata, ContextReduxType extends object>(
	options: TCreateFSMSliceOptions<Automata, ContextReduxType>,
) {
	const { Fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	const actionsNameList = Object.keys(Fsm.actions);
	const initialState: TStateFSMSlice<ContextReduxType> = _fsm.getContext();

	const selectorsSlice = Object.assign(selectors ?? {});

	const reducers = actionsNameList.reduce((acc, actionName) => {
		acc[actionName]
			= (
				state: TStateFSMSlice<ContextReduxType>,
				action: PayloadAction<TStateFSMSlice<ContextReduxType>>,
			) => {
				const rootReducer = _fsm.getReducer();
				return rootReducer
					? rootReducer({
						action: Fsm.getAction(actionName),
						payload: action.payload,
						...state,
					})
					: { ...state };
			};
		return acc;
	}, {} as any);

	if (contextToRedux)
		initialState.context = contextToRedux(initialState.context);

	return createSlice<TStateFSMSlice<ContextReduxType>, TReducersFSMSlice<keyof TClassConstructor<Automata>['actions'], TStateFSMSlice<ContextReduxType>>, string, SliceSelectors<TStateFSMSlice<ContextReduxType>>, string>({
		name,
		reducerPath: reducerPath ?? '',
		initialState,
		reducers,
		selectors: selectorsSlice,
	});
}
