import { useCallback, useSyncExternalStore } from 'react';
import { fsm_context, getRoute } from '../store/store';
import { TListenerCallback, TUseFSMInput } from '../types';

/** Publish routes only while subscribed. Server or abandoned renders cannot claim a name. */
export function useFSMRegistration(instance: TUseFSMInput, name?: string) {
	const subscribe = useCallback((listener: TListenerCallback) => {
		fsm_context.initializeFSM(instance, name);
		const store = fsm_context.getStore(instance.correlationId);
		const unsubscribe = store.subscribe(listener);
		return () => {
			unsubscribe();
			if (!store.callbacks.size) fsm_context.destroyFSM(instance.correlationId);
		};
	}, [instance, name]);

	const route = useSyncExternalStore(subscribe, () => getRoute(instance, name), () => name || instance.correlationId);
	return { route, subscribe, getSnapshot: () => instance };
}
