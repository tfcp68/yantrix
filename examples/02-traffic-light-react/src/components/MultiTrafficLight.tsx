import { TrafficLight, TTrafficLightProps } from '@/components/TrafficLight';
import { useMultiTrafficLight } from '@/hooks/useMultiTrafficLight';
import { RESET_EVENT, SWITCH_EVENT, trafficLightBus } from '@/lib/trafficLightBus';
import React from 'react';

const MULTI_LIGHT_IDS = Array.from({ length: 3 }, () => crypto.randomUUID());

type TMultiTrafficLightItemProps = {
	id: string;
};

function withMultiTrafficLight(Component: React.ComponentType<TTrafficLightProps>) {
	return function MultiTrafficLightItem({ id }: TMultiTrafficLightItemProps) {
		const state = useMultiTrafficLight(id);
		const onSwitch = () => trafficLightBus.dispatch({ event: SWITCH_EVENT, meta: { id } });
		const onReset = () => trafficLightBus.dispatch({ event: RESET_EVENT, meta: { id } });
		return <Component {...state} onSwitch={onSwitch} onReset={onReset} />;
	};
}

const MultiTrafficLightItem = withMultiTrafficLight(TrafficLight);

export const MultiTrafficLight = () => (
	<div className="flex flex-row items-start justify-center gap-x-6">
		{MULTI_LIGHT_IDS.map(id => (
			<MultiTrafficLightItem key={id} id={id} />
		))}
	</div>
);
