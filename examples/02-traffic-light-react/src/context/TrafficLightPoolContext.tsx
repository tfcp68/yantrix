import TLA from '@/generated/TrafficLightAutomata';
import { createContext, ReactNode, useContext, useRef } from 'react';

export type TTrafficLightPoolEntry = {
	instance: InstanceType<typeof TLA>;
	correlationId: string;
	label: string;
};

type TTrafficLightPoolValue = {
	items: ReadonlyArray<TTrafficLightPoolEntry>;
};

const TrafficLightPoolContext = createContext<TTrafficLightPoolValue | null>(null);

type TTrafficLightPoolProviderProps = {
	count: number;
	labelFor?: (index: number) => string;
	children: ReactNode;
};

export const TrafficLightPoolProvider = ({ count, labelFor, children }: TTrafficLightPoolProviderProps) => {
	const poolRef = useRef<TTrafficLightPoolEntry[] | null>(null);
	if (!poolRef.current) {
		poolRef.current = Array.from({ length: count }, (_, i) => {
			const instance = new TLA();
			return {
				instance,
				correlationId: instance.correlationId,
				label: labelFor ? labelFor(i) : `Light ${i + 1}`,
			};
		});
	}
	const value: TTrafficLightPoolValue = {
		items: poolRef.current,
	};
	return (
		<TrafficLightPoolContext.Provider value={value}>
			{children}
		</TrafficLightPoolContext.Provider>
	);
};

export const useTrafficLightPool = (): TTrafficLightPoolValue => {
	const ctx = useContext(TrafficLightPoolContext);
	if (!ctx) throw new Error('useTrafficLightPool must be used within TrafficLightPoolProvider');
	return ctx;
};
