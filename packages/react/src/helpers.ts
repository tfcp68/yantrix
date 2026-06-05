import { TStaticMethods } from '@yantrix/core';
import { hasCycle } from './typeGuards';
import { TAutomata } from './types';

export const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;

export const setInitialStaticMethods = (inst: TAutomata): TStaticMethods => {
	return inst.constructor as unknown as TStaticMethods;
};

export function readVersion<Selection>(fsmStore: Selection): number {
	if (hasCycle(fsmStore)) {
		return fsmStore.currentCycle;
	}

	return 0;
}
