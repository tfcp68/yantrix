import { TrafficLight } from '@/components/TrafficLight';
import { TrafficLightButtons } from '@/components/TrafficLightButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoreLoopProvider } from '@/context/CoreLoopContext';
import { TrafficLightActionsContext, TrafficLightContext } from '@/context/TrafficLightContext';
import { TrafficLightPoolProvider, TTrafficLightPoolItem, useTrafficLightPool } from '@/context/TrafficLightPoolContext';
import { useMultiTrafficLight } from '@/hooks/useMultiTrafficLight';
import { useTrafficLightActions } from '@/hooks/useTrafficLightActions';
import { trafficLightBus } from '@/lib/trafficLightBus';
import React, { useState } from 'react';

type TMultiTrafficLightItemProviderProps = {
	item: TTrafficLightPoolItem;
};

const MultiTrafficLightItemProvider = React.memo(({ item }: TMultiTrafficLightItemProviderProps) => {
	const trafficLightValues = useMultiTrafficLight(item.instance);
	return (
		<TrafficLightContext.Provider value={trafficLightValues}>
			<TrafficLight />
		</TrafficLightContext.Provider>
	);
});

const MultiTrafficLightInner = () => {
	const { items } = useTrafficLightPool();
	const [selectedId, setSelectedId] = useState<string>(() => Object.keys(items)[0]!);
	const actions = useTrafficLightActions(selectedId);

	return (
		<div className="flex flex-col items-center gap-y-4">
			<div className="flex flex-row items-start justify-center gap-x-6">
				{Object.entries(items).map(([correlationId, item]) => (
					<MultiTrafficLightItemProvider key={correlationId} item={item} />
				))}
			</div>
			<Select value={selectedId} onValueChange={setSelectedId}>
				<SelectTrigger className="w-full bg-zinc-950 text-zinc-200 border-zinc-800">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{Object.entries(items).map(([correlationId, { label }]) => (
						<SelectItem key={correlationId} value={correlationId}>{label}</SelectItem>
					))}
				</SelectContent>
			</Select>
			<TrafficLightActionsContext.Provider value={actions}>
				<TrafficLightButtons />
			</TrafficLightActionsContext.Provider>
		</div>
	);
};

export const MultiTrafficLight = () => (
	<TrafficLightPoolProvider>
		<CoreLoopProvider bus={trafficLightBus}>
			<MultiTrafficLightInner />
		</CoreLoopProvider>
	</TrafficLightPoolProvider>
);
