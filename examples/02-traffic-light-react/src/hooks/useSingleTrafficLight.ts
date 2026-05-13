import { TTrafficLightActions, TTrafficLightDisplayProps } from '@/context/TrafficLightContext';
import TLA, { actionsMap, statesDictionary } from '@/generated/TrafficLightAutomata';
import { useFSM } from '@yantrix/react';

export function useSingleTrafficLight(): TTrafficLightDisplayProps & TTrafficLightActions {
	const { dispatch, getContext, state } = useFSM(TLA);
	const { context } = getContext();

	return {
		counter: (context.counter ?? null),
		isGreenOn: state === statesDictionary.Green,
		isRedOn: state != null && [statesDictionary.Red, statesDictionary.RedYellow].includes(state),
		isYellowOn: state != null && [statesDictionary.Yellow, statesDictionary.RedYellow].includes(state),
		onReset: () => dispatch({ action: TLA.getAction(actionsMap.Reset), payload: { initialCounter: 0 } }),
		onSwitch: () => dispatch({ action: TLA.getAction(actionsMap.Switch), payload: {} }),
	};
}
