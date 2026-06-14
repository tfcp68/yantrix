import { useCoreLoop } from '@/context/CoreLoopContext';
import { TTrafficLightDisplayProps } from '@/context/TrafficLightContext';
import TLA, { createTrafficLightAutomataEventAdapter, statesDictionary } from '@/generated/TrafficLightAutomata';
import { useFSM } from '@yantrix/react';
import { useEffect } from 'react';

/** Connects a TLA instance to React and registers it with the shared CoreLoop. */
export const useMultiTrafficLight = (instance: InstanceType<typeof TLA>): TTrafficLightDisplayProps => {
	const { getContext, state } = useFSM(instance);
	const { context } = getContext();
	const loop = useCoreLoop();

	useEffect(() => {
		const adapter = createTrafficLightAutomataEventAdapter();
		adapter.setEventMetaValidator(
			(event: any): event is typeof event => !event.meta.id || event.meta.id === instance.correlationId,
		);
		loop.registerAutomata(instance, adapter);
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
