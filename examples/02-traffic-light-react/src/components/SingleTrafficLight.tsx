import { TrafficLight } from '@/components/TrafficLight';
import { TrafficLightButtons } from '@/components/TrafficLightButtons';
import { TrafficLightActionsContext, TrafficLightContext } from '@/context/TrafficLightContext';
import { useSingleTrafficLight } from '@/hooks/useSingleTrafficLight';
import React from 'react';

type TSingleTrafficLightProviderProps = {
	children: React.ReactNode;
};

const SingleTrafficLightProvider = ({ children }: TSingleTrafficLightProviderProps) => {
	const { onSwitch, onReset, ...display } = useSingleTrafficLight();
	return (
		<TrafficLightContext.Provider value={display}>
			<TrafficLightActionsContext.Provider value={{ onSwitch, onReset }}>
				{children}
			</TrafficLightActionsContext.Provider>
		</TrafficLightContext.Provider>
	);
};

export const SingleTrafficLight = () => (
	<SingleTrafficLightProvider>
		<div className="flex flex-col items-center space-y-4">
			<TrafficLight />
			<TrafficLightButtons />
		</div>
	</SingleTrafficLightProvider>
);
