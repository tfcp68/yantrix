import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TAutomata, TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';

/**
 * Функция для создания обертки над redux slice.
 * Хранит в себе текущее состояни автомата, возвращает готовый слайс с редьюсерами,
 * каждый из которых вызывается как action автомата
 * @param options
 */
export function createFSMSlice<Automata extends TAutomata, ContextReduxType extends object>(
	options: TCreateFSMSliceOptions<Automata, ContextReduxType>,
): TCreateFSMSlicerReturned<keyof typeof options.Fsm.actions, TStateFSMSlice<ContextReduxType>> {
	const { Fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	const actionsNameList = Object.keys(Fsm.actions);
	const stateAutomata: TStateFSMSlice<ContextReduxType> = _fsm.getContext();

	const contextRedux = Object.assign({}, stateAutomata);

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
						context: stateAutomata.context,
						state: state.state,
					})
					: { ...state };
			};
		return acc;
	}, {} as any);

	if (contextToRedux)
		contextRedux.context = contextToRedux(contextRedux.context);

	return createSlice({
		name,
		reducerPath: reducerPath ?? '',
		initialState: contextRedux,
		reducers,
		selectors: selectorsSlice,
	});
}
