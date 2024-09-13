import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TAutomataWithStaticMethods, TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';

/**
 * Функция для создания обертки над redux slice.
 * Хранит в себе текущее состояни автомата, возвращает готовый слайс с редьюсерами,
 * каждый из которых вызывается как action автомата
 * @param options
 */
export function createFSMSlice<Automata extends TAutomataWithStaticMethods>(
	options: TCreateFSMSliceOptions<Automata, TStateFSMSlice, TStateFSMSlice['context']>,
): TCreateFSMSlicerReturned<keyof Automata['actions'], TStateFSMSlice> {
	const { Fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	const actionsNameList = Object.keys(Fsm.actions);
	const initialState: TStateFSMSlice = _fsm.getContext();

	const selectorsSlice = selectors || {
		state: (sliceState: TStateFSMSlice): TStateFSMSlice['state'] => sliceState.state,
		context: (sliceState: TStateFSMSlice): TStateFSMSlice['context'] => sliceState.context,
	};

	const reducers = actionsNameList.reduce((acc, actionName) => {
		acc[actionName]
			= (
				state: TStateFSMSlice,
				action: PayloadAction<TStateFSMSlice>,
			) => {
				const rootReducer = _fsm.getReducer();
				const newState = rootReducer
					? rootReducer({
						action: Fsm.getAction(actionName),
						payload: action.payload,
						...state,
					})
					: initialState;

				state = {
					state: newState.state,
					context: newState.context,
				};

				return state;
			};
		return acc;
	}, {} as any);

	if (contextToRedux)
		initialState.context = contextToRedux(initialState.context);

	return createSlice({
		name,
		reducerPath: reducerPath ?? '',
		initialState,
		reducers,
		selectors: selectorsSlice,
	});
}
