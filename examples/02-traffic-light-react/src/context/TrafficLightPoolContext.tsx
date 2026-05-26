import MTLA, { statesDictionary } from '@/generated/MultiTrafficLightAutomata';
import { createContext, ReactNode, useContext, useRef } from 'react';

export type TTrafficLightPoolItem = {
	instance: InstanceType<typeof MTLA>;
	label: string;
};

export type TTrafficLightPool = Record<string, TTrafficLightPoolItem>;

type TTrafficLightPoolValue = { items: TTrafficLightPool };

const TrafficLightPoolContext = createContext<TTrafficLightPoolValue | null>(null);

export const TrafficLightPoolProvider = ({ children }: { children: ReactNode }) => {
	const poolRef = useRef<TTrafficLightPoolValue | null>(null);
	if (!poolRef.current) {
		const items: TTrafficLightPool = {};
		for (let i = 0; i < 3; i++) {
			const instance = new MTLA();
			instance.setContext({
				state: statesDictionary.Off,
				context: {
					correlationId: instance.correlationId,
				},
			});
			items[instance.correlationId] = { instance, label: `Light ${i + 1}` };
		}
		poolRef.current = { items };
	}
	return (
		<TrafficLightPoolContext.Provider value={poolRef.current}>
			{children}
		</TrafficLightPoolContext.Provider>
	);
};

/** Returns the stable pool of MTLA instances. Must be used within {@link TrafficLightPoolProvider}. */
export const useTrafficLightPool = (): TTrafficLightPoolValue => {
	const ctx = useContext(TrafficLightPoolContext);
	if (!ctx) throw new Error('useTrafficLightPool must be used within TrafficLightPoolProvider');
	return ctx;
};
