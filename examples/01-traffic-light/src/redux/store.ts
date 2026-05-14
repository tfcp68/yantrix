import TLA, { statesMap, TActionsTrafficLightAutomata } from '@/generated/TrafficLightAutomata';
import { configureStore } from '@reduxjs/toolkit';
import { createFSMSlice } from '@yantrix/redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const contextToReduxParams = (context: any) => {
	return {
		redColorOn: [TLA.getState(statesMap.Red), TLA.getState(statesMap.RedYellow)].includes(context.state),
		yellowColorOn: [TLA.getState(statesMap.Yellow), TLA.getState(statesMap.RedYellow)].includes(context.state),
		greenColorOn: TLA.getState(statesMap.Green) === context.state,
		...context,
		context: {
			counter: 0,
		},
	};
};

const { actions, reducer } = createFSMSlice<
	TActionsTrafficLightAutomata,
	ReturnType<typeof contextToReduxParams>
>({
	name: TLA.id,
	Fsm: TLA,
	contextToRedux: contextToReduxParams,
});

export const store = configureStore({ reducer });

export type TAppDispatch = typeof store.dispatch;
export type TRootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<TAppDispatch>();
export const useAppSelector: TypedUseSelectorHook<TRootState> = useSelector;

export const switchLight = () => actions.Switch({});
export const resetLight = () => actions.Reset({
	initialCounter: 0,
});
