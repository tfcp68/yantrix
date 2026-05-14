import { TrafficLight } from '@/components/TrafficLight';
import { TrafficLightButtons } from '@/components/TrafficLightButtons';
import { TrafficLightActionsContext, TrafficLightContext } from '@/context/TrafficLightContext';
import { useSingleTrafficLight } from '@/hooks/useSingleTrafficLight';
import React from 'react';

function SingleTrafficLightProvider({ children }: { children: React.ReactNode }) {
	const { onSwitch, onReset, ...display } = useSingleTrafficLight();
	return (
		<TrafficLightContext.Provider value={display}>
			<TrafficLightActionsContext.Provider value={{ onSwitch, onReset }}>
				{children}
			</TrafficLightActionsContext.Provider>
		</TrafficLightContext.Provider>
	);
}

export function SingleTrafficLight() {
	return (
		<SingleTrafficLightProvider>
			<div className="flex flex-col items-center space-y-4">
				<TrafficLight />
				<TrafficLightButtons />
			</div>
		</SingleTrafficLightProvider>
	);
}
