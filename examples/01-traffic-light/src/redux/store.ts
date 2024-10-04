import TLA, { TActionsTrafficLightAutomata } from '@/generated/TrafficLightAutomata';
import { configureStore } from '@reduxjs/toolkit';
import { createFSMSlice } from '@yantrix/redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const contextToReduxParams = (context: any) => {
	return {
		redColorOn: [
			TLA.getState('Red'),
			TLA.getState('RedYellow'),
		].includes(context.state),
		yellowColorOn: [
			TLA.getState('Yellow'),
			TLA.getState('RedYellow'),
		].includes(context.state),
		greenColorOn: TLA.getState('Green') === context.state,
		...context,
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
export const resetLight = () => actions['Reset (initialCounter=0)']({
	initialCounter: 0,
});
