import { expect, it } from 'vitest';
import { IFSMInstanceBase, TFSMAdapter, wrapInstance } from './utils';

export type TBehaviorSpec = {
	diagram: string;
	automataName: string;
	/** State names traversed by dispatching actionName repeatedly, starting from index 0 */
	stateSequence: string[];
	actionName: string;
	contextChecks?: Array<{
		afterDispatches: number;
		key: string;
		expected: unknown;
	}>;
};

/**
 * Run a parameterized behavior suite inside a describe() block.
 * adapterFactory() must return a fresh, initialized instance each call.
 */
export function runBehaviorSuite(
	spec: TBehaviorSpec,
	adapterFactory: () => TFSMAdapter,
	dicts: { statesDictionary: Record<string, number>; actionsDictionary: Record<string, number> },
): void {
	it('starts in initial state', () => {
		const adapter = adapterFactory();
		expect(adapter.state).toBe(dicts.statesDictionary[spec.stateSequence[0]]);
	});

	for (let step = 1; step < spec.stateSequence.length; step++) {
		const expectedState = spec.stateSequence[step];
		it(`after ${step} dispatch(${spec.actionName}): state is ${expectedState}`, () => {
			const adapter = adapterFactory();
			for (let j = 0; j < step; j++) {
				adapter.dispatch({ action: dicts.actionsDictionary[spec.actionName]!, payload: {} });
			}
			expect(adapter.state).toBe(dicts.statesDictionary[expectedState]);
		});
	}

	for (const check of (spec.contextChecks ?? [])) {
		const { afterDispatches, key, expected } = check;
		it(`after ${afterDispatches} dispatches: context.${key} equals expected`, () => {
			const adapter = adapterFactory();
			for (let j = 0; j < afterDispatches; j++) {
				adapter.dispatch({ action: dicts.actionsDictionary[spec.actionName]!, payload: {} });
			}
			expect(adapter.getContext().context[key]).toBe(expected);
		});
	}
}

export function wrapClassFactory(ClassCtor: new () => IFSMInstanceBase): () => TFSMAdapter {
	return () => wrapInstance(new ClassCtor());
}

export function wrapFunctoryFactory(factoryFn: () => IFSMInstanceBase): () => TFSMAdapter {
	return () => wrapInstance(factoryFn());
}
