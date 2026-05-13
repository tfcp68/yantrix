import { TTrafficLightActions, TTrafficLightDisplayProps } from '@/context/TrafficLightContext';
import TLA, { statesDictionary } from '@/generated/TrafficLightAutomata';
import { useFSM } from '@yantrix/react';

export function useSingleTrafficLight(): TTrafficLightDisplayProps & TTrafficLightActions {
	const { dispatch, getContext, state } = useFSM(TLA);
	const { context } = getContext();

	return {
		counter: (context.counter ?? null),
		isGreenOn: state === statesDictionary.Green,
		isRedOn: state != null && [statesDictionary.Red, statesDictionary.RedYellow].includes(state as number),
		isYellowOn: state != null && [statesDictionary.Yellow, statesDictionary.RedYellow].includes(state as number),
		onReset: () => dispatch({ action: TLA.getAction('Reset'), payload: { initialCounter: 0 } }),
		onSwitch: () => dispatch({ action: TLA.getAction('Switch'), payload: {} }),
	};
}
