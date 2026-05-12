import { TTrafficLightProps } from '@/components/TrafficLight';
import TLA from '@/generated/TrafficLightAutomata';
import { RESET_EVENT, SWITCH_EVENT, trafficLightBus } from '@/lib/trafficLightBus';
import { useFSM } from '@yantrix/react';
import { useEffect } from 'react';

type TBusHandler = Parameters<typeof trafficLightBus.subscribe>[1];

export function useMultiTrafficLight(id: string): TTrafficLightProps {
	const { dispatch, getContext, getInstanceAutomata, getState, state } = useFSM({ Automata: TLA, id });
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
			return { event: eventMeta.event, meta: eventMeta.meta, task_id: `switch_${id}`, result: null } as const;
		};
		const busHandlerReset: TBusHandler = (eventMeta) => {
			const actions = adapter.handleEvent(eventMeta, id);
			actions.forEach((action: (typeof actions)[number]) => dispatch(action));
			return { event: eventMeta.event, meta: eventMeta.meta, task_id: `reset_${id}`, result: null } as const;
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
		counter: (context.counter ?? null) as number | null,
		isGreenOn: getState('Green') === state,
		isRedOn: state != null && [getState('Red'), getState('RedYellow')].includes(state),
		isYellowOn: state != null && [getState('Yellow'), getState('RedYellow')].includes(state),
		onReset: () => trafficLightBus.dispatch({ event: RESET_EVENT, meta: { id } }),
		onSwitch: () => trafficLightBus.dispatch({ event: SWITCH_EVENT, meta: { id } }),
	};
}
