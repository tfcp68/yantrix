import { TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const createFSMSlice = <Actions extends string>(
	options: TCreateFSMSliceOptions<Actions>,
): TCreateFSMSlicerReturned<Actions> => {
	const { fsm, name, contextToRedux, actionsFSM, selectors } = options;
	const _fsm = new fsm();

	const actionsNameList = Object.keys(actionsFSM) as Actions[];

	const reducers = actionsNameList.reduce(
		(acc, actionName) => {
			acc[actionName] = (state: TStateFSMSlice, action: PayloadAction<TStateFSMSlice>) => {
				const rootReducer = _fsm.getReducer();
				if (!rootReducer) return {};
				const newState = rootReducer({
					action: actionsFSM[actionName as keyof typeof actionsFSM],
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
		},
		{} as Record<Actions, any>,
	);

	const initialState: TStateFSMSlice = _fsm.getContext();

	if (contextToRedux) initialState.context = contextToRedux(initialState.context);

	return createSlice({
		name,
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
