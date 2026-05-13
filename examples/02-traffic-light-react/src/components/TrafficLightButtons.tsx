import { Button } from '@/components/ui/button';
import { useTrafficLightActions } from '@/context/TrafficLightContext';

export function TrafficLightButtons() {
	const { onSwitch, onReset } = useTrafficLightActions();
	return (
		<div className="flex flex-col w-24 space-y-2">
			<Button
				onClick={onSwitch}
				variant="outline"
				className="w-full bg-zinc-950 text-zinc-200 hover:bg-zinc-800 hover:text-white border-zinc-800 text-sm py-1"
			>
				Switch
			</Button>
			<Button
				onClick={onReset}
				variant="destructive"
				className="w-full bg-red-600 hover:bg-red-500 text-sm py-1"
			>
				Reset
			</Button>
		</div>
	);
}
