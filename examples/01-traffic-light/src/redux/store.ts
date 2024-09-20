import TLA from '@/generated/TrafficLightAutomata';
import { configureStore } from '@reduxjs/toolkit';
import { createFSMSlice } from '@yantrix/redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const { reducer, actions } = createFSMSlice({
	Fsm: TLA,
	name: TLA.id,
});

export const store = configureStore({ reducer });

export type TAppDispatch = typeof store.dispatch;
export type TRootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<TAppDispatch>();
export const useAppSelector: TypedUseSelectorHook<TRootState> = useSelector;

export const switchLight = () => actions.Switch({});
export const resetLight = () => actions['Reset (initialCounter=0)']({ context: 0 });
