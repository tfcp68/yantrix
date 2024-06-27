import { combineReducers, configureStore, Dispatch } from '@reduxjs/toolkit';

type TActionGenerator = (actionFromFSM: any) => {
	type: string;
	payload?: any;
};

export function dispatchFSMActionToReduxGenerator(dispatch: Dispatch, actionGenerator: TActionGenerator) {
	return ({ action, payload }: { action: any; payload: any }) => {
		const reduxAction = actionGenerator(action);
		Object.assign(reduxAction.payload, payload, reduxAction.payload);
		return dispatch(actionGenerator(reduxAction));
	};
}

// client code
const rootReducer = combineReducers({});

const store = configureStore({
	reducer: rootReducer,
	middleware: (gDM) =>
		gDM().concat(() => {
			return (next) => (action) => {
				return next(action);
			};
		}),
});

const dispatchFSMActionToRedux = dispatchFSMActionToReduxGenerator(store.dispatch, (state) => ({
	type: 'dispatchFromFSM',
	payload: {
		state,
	},
}));

dispatchFSMActionToRedux({ action: 'action', payload: 'asfas' });
