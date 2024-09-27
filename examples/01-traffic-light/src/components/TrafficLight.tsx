'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { resetLight, switchLight, useAppDispatch, useAppSelector } from '@/redux/store';

export function TrafficLight() {
	const { context, state } = useAppSelector(state => state);
	const dispatch = useAppDispatch();

	const onSwitch = () => dispatch(switchLight());
	const onReset = () => dispatch(resetLight());

	console.log(state, context);
	return (
		<div className="flex flex-col items-center space-y-4">
			<div className="relative">
				<Card className="w-24 p-3 space-y-3 bg-black border-zinc-800">
					<div className="flex flex-col items-center space-y-2">
						<div className={`w-10 h-10 rounded-full transition-colors duration-200 ease-in-out ${
							state && context.redColorOn ? 'bg-red-500' : 'bg-red-950'
						}`}
						/>
						<div className={`w-10 h-10 rounded-full transition-colors duration-200 ease-in-out ${
							state && context.yellowColorOn ? 'bg-yellow-500' : 'bg-yellow-950'
						}`}
						/>
						<div className={`w-10 h-10 rounded-full transition-colors duration-200 ease-in-out ${
							context.greenColorOn ? 'bg-green-500' : 'bg-green-950'
						}`}
						/>
					</div>
				</Card>
				<Badge className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-200 text-xs">{context.counter}</Badge>
			</div>
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
		</div>
	);
}
