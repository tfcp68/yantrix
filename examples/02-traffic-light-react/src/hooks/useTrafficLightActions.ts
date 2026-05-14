import { TTrafficLightActions } from '@/context/TrafficLightContext';
import { RESET_EVENT, SWITCH_EVENT, trafficLightBus } from '@/lib/trafficLightBus';

export function useTrafficLightActions(id: string): TTrafficLightActions {
	return {
		onSwitch: () => trafficLightBus.dispatch({ event: SWITCH_EVENT, meta: { id } }),
		onReset: () => trafficLightBus.dispatch({ event: RESET_EVENT, meta: { id } }),
	};
}
