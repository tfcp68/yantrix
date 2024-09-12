import { configureStore } from '@reduxjs/toolkit';
import { createFSMSlice } from '@yantrix/redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import TLA from '@/generated/TrafficLightAutomata';

const { reducer, actions } = createFSMSlice({
	Fsm: TLA,
	name: TLA.id,
	contextToRedux: context => ({ ...context, counter: 0 }),
});

export const store = configureStore({ reducer });

export type TAppDispatch = typeof store.dispatch;
export type TRootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<TAppDispatch>();
export const useAppSelector: TypedUseSelectorHook<TRootState> = useSelector;

export const switchLight = () => actions.Switch({});
export const resetLight = () => actions['Reset (initialCounter=0)']({});
