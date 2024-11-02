// import { combineReducers, configureStore } from '@reduxjs/toolkit';
// import { actionsDictionary, TrafficLightAutomata } from '../__tests__/fixtures/TrafficLightAutomata';
// import { createMiddleware } from './middleware/middleware';
// import { createFSMSlice } from './slice/slice';
//
// const contextToReduxParams = {
// 	context: {
// 		counter: 0,
// 	},
// };
//
// const { reducer, actions } = createFSMSlice<
// 	keyof typeof actionsDictionary,
// 	typeof contextToReduxParams
// >({
// 	name: TrafficLightAutomata.id,
// 	Fsm: TrafficLightAutomata,
// 	contextToRedux: context => ({
// 		...context,
// 		...contextToReduxParams,
// 	}),
// });
//
// const store = configureStore({
// 	reducer: combineReducers({
// 		[TrafficLightAutomata.id]: reducer,
// 	}),
// 	middleware: getDefaultMiddleware =>
// 		getDefaultMiddleware().concat(
// 			createMiddleware(
// 				TrafficLightAutomata,
// 				({ type, payload }) => (type !== 'TrafficLightAutomata/Switch')
// 					? null
// 					: TrafficLightAutomata.createAction('Switch', payload),
// 				({ context }) => {
// 					return ({
// 						type: 'TrafficLightAutomata/Switch',
// 						payload: { ...context },
// 					});
// 				},
// 			),
// 		),
// });
// // console.log(actions);
// console.log(store.getState());
//
// store.dispatch(actions.Switch({}));
//
// console.log(store.getState());
