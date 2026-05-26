import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useTrafficLight } from '@/context/TrafficLightContext';

export const TrafficLight = () => {
	const { counter, isGreenOn, isRedOn, isYellowOn } = useTrafficLight();
	return (
		<div className="relative">
			<Card className="w-24 p-3 space-y-3 bg-black border-zinc-800">
				<div className="flex flex-col items-center space-y-2">
					<div className={`w-10 h-10 rounded-full transition-colors duration-200 ease-in-out ${
						isRedOn ? 'bg-red-500' : 'bg-red-950'
					}`}
					/>
					<div className={`w-10 h-10 rounded-full transition-colors duration-200 ease-in-out ${
						isYellowOn ? 'bg-yellow-500' : 'bg-yellow-950'
					}`}
					/>
					<div className={`w-10 h-10 rounded-full transition-colors duration-200 ease-in-out ${
						isGreenOn ? 'bg-green-500' : 'bg-green-950'
					}`}
					/>
				</div>
			</Card>
			<Badge className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-200 text-xs">{counter}</Badge>
		</div>
	);
};
