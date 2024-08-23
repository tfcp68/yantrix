import { TCreateFSMSlice, TReducersFSMSlice, TStateFSMSlice } from '../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { actionsDictionary } from '../../__tests__/fixtures/AutomataIncludeNotes_generated';

export const createFSMSlice = (props: TCreateFSMSlice) => {
	const { fsm, name } = props;
	const _fsm = new fsm();

	const actionsNameList = Object.keys(actionsDictionary);

	const reducers: TReducersFSMSlice = Object.assign(
		{},
		...actionsNameList.map((actionName) => {
			return {
				[actionName]: (state: TStateFSMSlice, action: PayloadAction) => {
					const rootReducer = _fsm.getReducer();
					if (!rootReducer) return {};
					const newState = rootReducer({
						action: actionsDictionary[actionName as keyof typeof actionsDictionary],
						state: state.state,
						context: state.context,
						payload: action.payload,
					});

					state = Object.assign(
						{},
						{
							state: newState.state,
							context: newState.context,
						},
					);

					return state;
				},
			};
		}),
	);

	const initialState = _fsm.getContext();

	return createSlice({
		name,
		initialState,
		reducers,
	});
};
