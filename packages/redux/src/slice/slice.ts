import { TAutomataWithStaticMethods, TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const createFSMSlice = <Automata extends TAutomataWithStaticMethods>(
	options: TCreateFSMSliceOptions<Automata, TStateFSMSlice, TStateFSMSlice['context']>,
): TCreateFSMSlicerReturned<keyof Automata['actions'], TStateFSMSlice> => {
	const { fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new fsm();
	const actionsNameList = Object.keys(fsm.actions);
	const initialState: TStateFSMSlice = _fsm.getContext();

	const selectorsSlice = selectors
		? selectors
		: {
				state: (sliceState: TStateFSMSlice): TStateFSMSlice['state'] => sliceState.state,
				context: (sliceState: TStateFSMSlice): TStateFSMSlice['context'] => sliceState.context,
			};

	const reducers = actionsNameList.reduce((acc, actionName) => {
		acc[actionName] = (state: TStateFSMSlice, action: PayloadAction<TStateFSMSlice>) => {
			const rootReducer = _fsm.getReducer();

			const newState = rootReducer
				? {
						action: fsm.getAction(actionName as keyof typeof fsm.actions),
						state: state.state,
						context: state.context,
						payload: action.payload,
					}
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
};
