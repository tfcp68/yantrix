import { TAutomataWithStaticMethods, TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const createFSMSlice = <Automata extends TAutomataWithStaticMethods>(
	options: TCreateFSMSliceOptions<Automata, TStateFSMSlice, TStateFSMSlice['context']>,
): TCreateFSMSlicerReturned<keyof Automata['actions'], TStateFSMSlice> => {
	const { fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new fsm();
	const actionsNameList = Object.keys(fsm.actions);

	const reducers = actionsNameList.reduce((acc, actionName) => {
		acc[actionName] = (state: TStateFSMSlice, action: PayloadAction<TStateFSMSlice>) => {
			const rootReducer = _fsm.getReducer();
			if (!rootReducer) return {};
			const newState = rootReducer({
				action: fsm.getAction(actionName as keyof typeof fsm.actions),
				state: state.state,
				context: state.context,
				payload: action.payload,
			});

			state = {
				state: newState.state,
				context: newState.context,
			};

			return state;
		};
		return acc;
	}, {} as any);

	const initialState: TStateFSMSlice = _fsm.getContext();

	if (contextToRedux) initialState.context = contextToRedux(initialState.context);

	return createSlice({
		name,
		reducerPath: reducerPath ?? '',
		initialState,
		reducers,
		selectors: selectors
			? selectors
			: {
					state: (sliceState): TStateFSMSlice['state'] => sliceState.state,
					context: (sliceState): TStateFSMSlice['context'] => sliceState.context,
				},
	});
};
