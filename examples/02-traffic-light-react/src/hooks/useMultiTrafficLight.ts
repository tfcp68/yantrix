import { TTrafficLightDisplayProps } from '@/context/TrafficLightContext';
import TLA, { eventDictionary, statesDictionary } from '@/generated/TrafficLightAutomata';
import { trafficLightBus } from '@/lib/trafficLightBus';
import { useFSM } from '@yantrix/react';
import { useEffect } from 'react';

type TBusHandler = Parameters<typeof trafficLightBus.subscribe>[1];

export const useMultiTrafficLight = (id: string): TTrafficLightDisplayProps => {
	const { dispatch, getContext, getInstanceAutomata, state } = useFSM({ Automata: TLA, id });
	const { context } = getContext();

	useEffect(() => {
		const { Automata: instance } = getInstanceAutomata();
		const adapter = instance.eventAdapter;
		if (!adapter) return;

		const busHandler: TBusHandler = (eventMeta) => {
			const targetId = (eventMeta.meta != null && typeof eventMeta.meta === 'object' && 'id' in eventMeta.meta)
				? eventMeta.meta.id
				: undefined;
			if (targetId !== id)
				return { event: eventMeta.event, meta: eventMeta.meta, task_id: id, result: null };

			const actions = adapter.handleEvent(eventMeta);
			actions.forEach((action: (typeof actions)[number]) => dispatch(action));
			return { event: eventMeta.event, meta: eventMeta.meta, task_id: id, result: null };
		};

		trafficLightBus.subscribe(eventDictionary.SWITCH, busHandler);
		trafficLightBus.subscribe(eventDictionary.RESET, busHandler);

		return () => {
			trafficLightBus.unsubscribe(eventDictionary.SWITCH, busHandler);
			trafficLightBus.unsubscribe(eventDictionary.RESET, busHandler);
		};
	}, [id]);

	return {
		counter: context.counter,
		isGreenOn: state === statesDictionary.Green,
		isRedOn: state != null && [statesDictionary.Red, statesDictionary.RedYellow].includes(state),
		isYellowOn: state != null && [statesDictionary.Yellow, statesDictionary.RedYellow].includes(state),
	};
};
