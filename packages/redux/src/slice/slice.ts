import { TCreateFSMSliceOptions, TCreateFSMSlicerReturned, TStateFSMSlice } from '../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import GamePhaseTest from '../../__tests__/fixtures/GamePhaseAutomataTest_generated';

export const createFSMSlice = <Automata extends typeof GamePhaseTest = typeof GamePhaseTest>(
	options: TCreateFSMSliceOptions<Automata>,
): TCreateFSMSlicerReturned<keyof typeof options.fsm.actions> => {
	const { fsm, name, contextToRedux, selectors } = options;
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
