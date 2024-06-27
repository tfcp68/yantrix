// export function dispatchToFSM (
// 	dispatch: Redux.Dispatch,
// 	actionGenerator:
// 		(fsmState) => ActionWithPayload
// ) =>
// (actions:keyof typeof actionsDictionary, payload:any )=>ActionWithPayload

//// import * from redux
// // import {Store} from './redux-store
// // import {dispatchToFsm, actionsDictionary} from './generatedAutomata123'
// const actionGenerator=(state)=>{action:'dispatchFromFSM',payload:{state});
// const dispatchToFsm=dispatchToFsm( Store.dispatch, actionGenerator);
// //...
// dispatchToFsm({action: actionsDictionary['/START'], payload: {...}});
// => {action:'dispatchFromFSM', payload: {state:{...}}}

import { combineReducers, configureStore, Dispatch } from '@reduxjs/toolkit';

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
const dispatchFSMActionToRedux = dispatchFSMActionToReduxGenerator(store.dispatch, (state) => ({
	type: 'dispatchFromFSM',
	payload: {
		state,
	},
}));

dispatchFSMActionToRedux({ action: 'action', payload: 'asfas' });
