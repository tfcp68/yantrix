import TrafficLightAutomata from '@/generated/TrafficLightAutomata';
import { configureStore } from '@reduxjs/toolkit';
import { createFSMSlice } from '@yantrix/redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const { reducer, actions } = createFSMSlice({
	Fsm: TrafficLightAutomata,
	name: TrafficLightAutomata.id,
	contextToRedux: context => ({
		counter: context.counter ?? 0,
		isRedOn: ['RedYellow', 'Red'].includes(context.state),
		isYellowOn: ['RedYellow', 'Yellow'].includes(context.state),
		isGreenOn: context.state === 'Green',
	}),
});

export const store = configureStore({ reducer });

export type TAppDispatch = typeof store.dispatch;
export type TRootState = ReturnType<typeof store.getState>;

export const useTAppDispatch = () => useDispatch<TAppDispatch>();
export const useAppSelector: TypedUseSelectorHook<TRootState> = useSelector;

export const switchLight = () => actions.Switch({});
export const resetLight = () => actions['Reset (initialCounter=0)']({});
