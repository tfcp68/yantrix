import { TrafficLight } from '@/components/TrafficLight';
import { TrafficLightButtons } from '@/components/TrafficLightButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrafficLightActionsContext, TrafficLightContext } from '@/context/TrafficLightContext';
import { TrafficLightPoolProvider, TTrafficLightPoolEntry, useTrafficLightPool } from '@/context/TrafficLightPoolContext';
import { useMultiTrafficLight } from '@/hooks/useMultiTrafficLight';
import { useTrafficLightActions } from '@/hooks/useTrafficLightActions';
import React, { useState } from 'react';

type TMultiTrafficLightItemProviderProps = {
	entry: TTrafficLightPoolEntry;
	children: React.ReactNode;
};

const MultiTrafficLightItemProvider = ({ entry, children }: TMultiTrafficLightItemProviderProps) => {
	const trafficLightValues = useMultiTrafficLight(entry.instance);
	return (
		<TrafficLightContext.Provider value={trafficLightValues}>
			{children}
		</TrafficLightContext.Provider>
	);
};

const MultiTrafficLightInner = () => {
	const pool = useTrafficLightPool();
	const [selectedId, setSelectedId] = useState<string>(pool.items[0]!.correlationId);
	const actions = useTrafficLightActions(selectedId);

	return (
		<div className="flex flex-col items-center gap-y-4">
			<div className="flex flex-row items-start justify-center gap-x-6">
				{pool.items.map(entry => (
					<MultiTrafficLightItemProvider key={entry.correlationId} entry={entry}>
						<TrafficLight />
					</MultiTrafficLightItemProvider>
				))}
			</div>
			<Select value={selectedId} onValueChange={setSelectedId}>
				<SelectTrigger className="w-full bg-zinc-950 text-zinc-200 border-zinc-800">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{pool.items.map(({ correlationId, label }) => (
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
	<TrafficLightPoolProvider count={3}>
		<MultiTrafficLightInner />
	</TrafficLightPoolProvider>
);
