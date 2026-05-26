import { useCoreLoop } from '@/context/CoreLoopContext';
import { TTrafficLightDisplayProps } from '@/context/TrafficLightContext';
import MTLA, { statesDictionary } from '@/generated/MultiTrafficLightAutomata';
import { useFSM } from '@yantrix/react';
import { useEffect } from 'react';

/** Connects a MTLA instance to React and registers it with the shared CoreLoop. */
export const useMultiTrafficLight = (instance: InstanceType<typeof MTLA>): TTrafficLightDisplayProps => {
	const { getContext, state } = useFSM(instance);
	const { context } = getContext();
	const loop = useCoreLoop();

	useEffect(() => {
		loop.registerAutomata(instance.correlationId, instance);
		return () => {
			loop.unregisterAutomata(instance.correlationId);
		};
	}, []);

	return {
		counter: context.counter ?? 0,
		isGreenOn: state === statesDictionary.Green,
		isRedOn: state != null && [statesDictionary.Red, statesDictionary.RedYellow].includes(state),
		isYellowOn: state != null && [statesDictionary.Yellow, statesDictionary.RedYellow].includes(state),
	};
};
