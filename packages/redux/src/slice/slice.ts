import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TAutomataReducer } from '@yantrix/automata';
import { TAutomataWithStaticMethods, TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';

export function createFSMSlice<Automata extends TAutomataWithStaticMethods>(
	options: TCreateFSMSliceOptions<Automata, TStateFSMSlice, TStateFSMSlice['context']>,
): TCreateFSMSlicerReturned<keyof Automata['actions'], TStateFSMSlice> {
	const { fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new fsm();
	const actionsNameList = Object.keys(fsm.actions);
	const initialState: TStateFSMSlice = _fsm.getContext();

	const selectorsSlice = selectors || {
		state: (sliceState: TStateFSMSlice): TStateFSMSlice['state'] => sliceState.state,
		context: (sliceState: TStateFSMSlice): TStateFSMSlice['context'] => sliceState.context,
	};

	const reducers = actionsNameList.reduce((acc, actionName) => {
		acc[actionName] = (state: TStateFSMSlice, action: PayloadAction<TStateFSMSlice>) => {
			const rootReducer = _fsm.getReducer() as TAutomataReducer<
				number,
				number,
				Record<number, any>,
				Record<number, any>
			> | null;
			const newState = rootReducer
				? rootReducer({
						action: fsm.getAction(actionName),
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

	if (contextToRedux) initialState.context = contextToRedux(initialState.context);

	return createSlice({
		name,
		reducerPath: reducerPath ?? '',
		initialState,
		reducers,
		selectors: selectorsSlice,
	});
}
