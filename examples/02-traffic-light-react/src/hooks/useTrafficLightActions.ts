import { TTrafficLightActions } from '@/context/TrafficLightContext';
import { eventDictionary } from '@/generated/MultiTrafficLightAutomata';
import { trafficLightBus } from '@/lib/trafficLightBus';

export const useTrafficLightActions = (id: string): TTrafficLightActions => {
	return {
		onSwitch: () => trafficLightBus.dispatch({ event: eventDictionary.SWITCH, meta: { id } }),
		onReset: () => trafficLightBus.dispatch({ event: eventDictionary.RESET, meta: { id, initialCounter: 0 } }),
	};
};
