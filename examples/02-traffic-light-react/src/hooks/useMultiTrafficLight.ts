import { TTrafficLightDisplayProps } from '@/context/TrafficLightContext';
import TLA, { statesDictionary } from '@/generated/TrafficLightAutomata';
import { RESET_EVENT, SWITCH_EVENT, trafficLightBus } from '@/lib/trafficLightBus';
import { useFSM } from '@yantrix/react';
import { useEffect } from 'react';

type TBusHandler = Parameters<typeof trafficLightBus.subscribe>[1];

export function useMultiTrafficLight(id: string): TTrafficLightDisplayProps {
	const { dispatch, getContext, getInstanceAutomata, state } = useFSM({ Automata: TLA, id });
	const { context } = getContext();

	useEffect(() => {
		const { Automata: instance } = getInstanceAutomata();
		const adapter = instance.eventAdapter;
		if (!adapter) return;

		const removeSwitchListener = adapter.addEventListener(
			SWITCH_EVENT,
			() => ({ action: TLA.getAction('Switch'), payload: {} }),
			id,
		);
		const removeResetListener = adapter.addEventListener(
			RESET_EVENT,
			() => ({ action: TLA.getAction('Reset'), payload: { initialCounter: 0 } }),
			id,
		);

		const busHandlerSwitch: TBusHandler = (eventMeta) => {
			const actions = adapter.handleEvent(eventMeta, id);
			actions.forEach((action: (typeof actions)[number]) => dispatch(action));
			return { event: eventMeta.event, meta: eventMeta.meta, task_id: id, result: null } as const;
		};
		const busHandlerReset: TBusHandler = (eventMeta) => {
			const actions = adapter.handleEvent(eventMeta, id);
			actions.forEach((action: (typeof actions)[number]) => dispatch(action));
			return { event: eventMeta.event, meta: eventMeta.meta, task_id: id, result: null } as const;
		};

		trafficLightBus.subscribe(SWITCH_EVENT, busHandlerSwitch);
		trafficLightBus.subscribe(RESET_EVENT, busHandlerReset);

		return () => {
			removeSwitchListener?.();
			removeResetListener?.();
			trafficLightBus.unsubscribe(SWITCH_EVENT, busHandlerSwitch);
			trafficLightBus.unsubscribe(RESET_EVENT, busHandlerReset);
		};
	}, [id]);

	return {
		counter: (context.counter ?? null),
		isGreenOn: state === statesDictionary.Green,
		isRedOn: state != null && [statesDictionary.Red, statesDictionary.RedYellow].includes(state as number),
		isYellowOn: state != null && [statesDictionary.Yellow, statesDictionary.RedYellow].includes(state as number),
	};
}
