import { CoreLoop, IAutomataEventBus, TAutomataBaseEventType } from '@yantrix/core';
import { createContext, ReactNode, useContext, useRef } from 'react';

const CoreLoopContext = createContext<CoreLoop | null>(null);

type TCoreLoopProviderProps = {
	bus: IAutomataEventBus<TAutomataBaseEventType>;
	children: ReactNode;
};

export const CoreLoopProvider = ({ bus, children }: TCoreLoopProviderProps) => {
	const loopRef = useRef<CoreLoop | null>(null);
	if (!loopRef.current) {
		loopRef.current = new CoreLoop({ bus });
		loopRef.current.start();
	}
	return (
		<CoreLoopContext.Provider value={loopRef.current}>
			{children}
		</CoreLoopContext.Provider>
	);
};

/** Returns the shared CoreLoop instance. Must be used within {@link CoreLoopProvider}. */
export const useCoreLoop = (): CoreLoop => {
	const ctx = useContext(CoreLoopContext);
	if (!ctx) throw new Error('useCoreLoop must be used within CoreLoopProvider');
	return ctx;
};
