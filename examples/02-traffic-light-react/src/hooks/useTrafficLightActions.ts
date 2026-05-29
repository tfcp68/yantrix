import { TTrafficLightActions } from '@/context/TrafficLightContext';
import { eventDictionary } from '@/generated/TrafficLightAutomata';
import { trafficLightBus } from '@/lib/trafficLightBus';
import { useCallback } from 'react';

/** Returns stable Switch/Reset dispatchers targeting the given correlationId via the shared bus. */
export const useTrafficLightActions = (id: string): TTrafficLightActions => {
	const onSwitch = useCallback(
		() => trafficLightBus.dispatch({ event: eventDictionary.SWITCH, meta: { id } }),
		[id],
	);
	const onReset = useCallback(
		() => trafficLightBus.dispatch({ event: eventDictionary.RESET, meta: { id, initialCounter: 0 } }),
		[id],
	);
	return { onSwitch, onReset };
};
