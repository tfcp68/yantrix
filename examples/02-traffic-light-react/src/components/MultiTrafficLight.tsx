import { TrafficLight } from '@/components/TrafficLight';
import { TrafficLightButtons } from '@/components/TrafficLightButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrafficLightActionsContext, TrafficLightContext } from '@/context/TrafficLightContext';
import { useMultiTrafficLight } from '@/hooks/useMultiTrafficLight';
import { useTrafficLightActions } from '@/hooks/useTrafficLightActions';
import React, { useState } from 'react';

const MULTI_LIGHTS = Array.from({ length: 3 }, (_, i) => ({
	id: crypto.randomUUID(),
	label: `Light ${i + 1}`,
}));

function MultiTrafficLightItemProvider({ id, children }: { id: string; children: React.ReactNode }) {
	const trafficLightValues = useMultiTrafficLight(id);
	return (
		<TrafficLightContext.Provider value={trafficLightValues}>
			{children}
		</TrafficLightContext.Provider>
	);
}

export function MultiTrafficLight() {
	const [selectedId, setSelectedId] = useState<string>(MULTI_LIGHTS[0]!.id);
	const actions = useTrafficLightActions(selectedId);

	return (
		<div className="flex flex-col items-center gap-y-4">
			<div className="flex flex-row items-start justify-center gap-x-6">
				{MULTI_LIGHTS.map(({ id }) => (
					<MultiTrafficLightItemProvider key={id} id={id}>
						<TrafficLight />
					</MultiTrafficLightItemProvider>
				))}
			</div>
			<Select value={selectedId} onValueChange={setSelectedId}>
				<SelectTrigger className="w-full bg-zinc-950 text-zinc-200 border-zinc-800">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MULTI_LIGHTS.map(({ id, label }) => (
						<SelectItem key={id} value={id}>{label}</SelectItem>
					))}
				</SelectContent>
			</Select>
			<TrafficLightActionsContext.Provider value={actions}>
				<TrafficLightButtons />
			</TrafficLightActionsContext.Provider>
		</div>
	);
}
