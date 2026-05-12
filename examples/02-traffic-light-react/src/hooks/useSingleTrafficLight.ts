import { TTrafficLightProps } from '@/components/TrafficLight';
import TLA from '@/generated/TrafficLightAutomata';
import { useFSM } from '@yantrix/react';

export function useSingleTrafficLight(): TTrafficLightProps {
	const { dispatch, getContext, getState, state } = useFSM(TLA);
	const { context } = getContext();

	return {
		counter: (context.counter ?? null) as number | null,
		isGreenOn: getState('Green') === state,
		isRedOn: state != null && [getState('Red'), getState('RedYellow')].includes(state),
		isYellowOn: state != null && [getState('Yellow'), getState('RedYellow')].includes(state),
		onReset: () => dispatch({ action: TLA.getAction('Reset'), payload: { initialCounter: 0 } }),
		onSwitch: () => dispatch({ action: TLA.getAction('Switch'), payload: {} }),
	};
}
