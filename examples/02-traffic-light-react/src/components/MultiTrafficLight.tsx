import { TrafficLight } from '@/components/TrafficLight';
import { useMultiTrafficLight } from '@/hooks/useMultiTrafficLight';

const MULTI_LIGHT_IDS = ['light-1', 'light-2', 'light-3'] as const;

type TMultiTrafficLightItemProps = {
	id: string;
};

function MultiTrafficLightItem({ id }: TMultiTrafficLightItemProps) {
	return <TrafficLight {...useMultiTrafficLight(id)} />;
}

export function MultiTrafficLight() {
	return (
		<div className="flex flex-row items-start justify-center gap-x-6">
			{MULTI_LIGHT_IDS.map(id => (
				<MultiTrafficLightItem key={id} id={id} />
			))}
		</div>
	);
}
