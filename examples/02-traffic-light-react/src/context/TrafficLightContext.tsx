import { createContext, useContext } from 'react';

export type TTrafficLightDisplayProps = {
	counter: number | null;
	isGreenOn: boolean;
	isRedOn: boolean;
	isYellowOn: boolean;
};

export type TTrafficLightActions = {
	onSwitch: () => void;
	onReset: () => void;
};

export const TrafficLightContext = createContext<TTrafficLightDisplayProps | null>(null);
export const TrafficLightActionsContext = createContext<TTrafficLightActions | null>(null);

export function useTrafficLight(): TTrafficLightDisplayProps {
	const ctx = useContext(TrafficLightContext);
	if (!ctx) throw new Error('useTrafficLight must be used within TrafficLightContext.Provider');
	return ctx;
}

export function useTrafficLightActions(): TTrafficLightActions {
	const ctx = useContext(TrafficLightActionsContext);
	if (!ctx) throw new Error('useTrafficLightActions must be used within TrafficLightActionsContext.Provider');
	return ctx;
}
