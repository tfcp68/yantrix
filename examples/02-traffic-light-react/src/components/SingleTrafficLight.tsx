import { TrafficLight } from '@/components/TrafficLight';
import { useSingleTrafficLight } from '@/hooks/useSingleTrafficLight';

export function SingleTrafficLight() {
	return <TrafficLight {...useSingleTrafficLight()} />;
}
