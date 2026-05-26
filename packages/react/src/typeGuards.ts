type THasCycle = { currentCycle: number };

export function hasCycle(x: unknown): x is THasCycle {
	return !!x && typeof (x as any).currentCycle === 'number';
}
