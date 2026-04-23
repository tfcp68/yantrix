import { ModuleNames } from '@yantrix/codegen';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

const input = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter = 0))
end note
note left of Off
+Init
end note
`;

describe('automata internal functions tests', async () => {
	await generateAndSave({ input, automataName: 'AutomataInternalsTest', lang: ModuleNames.JavaScript }, 'functions_automataInternals');

	const { AutomataInternalsTest, statesDictionary, actionsDictionary } = await import(`./fixtures/generated/functions_automataInternals_generated.js`);

	let automata: InstanceType<typeof AutomataInternalsTest>;

	const currentStateIdFunction = (a: typeof automata) => a.state;
	const currentStateNameFunction = (a: typeof automata) =>
		Object.keys(statesDictionary).find(
			k => (statesDictionary as Record<string, number>)[k] === a.state,
		) ?? null;
	const currentActionIdFunction = (a: typeof automata) => a.lastAction;
	const currentActionNameFunction = (a: typeof automata) =>
		Object.keys(actionsDictionary).find(
			k => (actionsDictionary as Record<string, number>)[k] === a.lastAction,
		) ?? null;
	const currentCycleFunction = (a: typeof automata) => a.currentCycle;

	beforeEach(() => {
		automata = new AutomataInternalsTest();
	});

	it('automata is not null', () => {
		assert.isNotNull(automata);
	});

	describe('currentState functions test', () => {
		it('returns the initial state ID & name', () => {
			const expectedId = statesDictionary.Off;
			const expectedName = 'Off';
			const stateId = currentStateIdFunction(automata);
			const stateName = currentStateNameFunction(automata);
			expect(stateId).toBe(expectedId);
			expect(stateName).toBe(expectedName);
		});
		it('returns the correct state ID & name after a transition', () => {
			const expectedId = statesDictionary.Red;
			const expectedName = 'Red';

			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });

			const stateId = currentStateIdFunction(automata);
			const stateName = currentStateNameFunction(automata);
			expect(stateId).toBe(expectedId);
			expect(stateName).toBe(expectedName);
		});
	});

	describe('currentAction functions test', () => {
		it('has no initial action', () => {
			const actionId = currentActionIdFunction(automata);
			const actionName = currentActionNameFunction(automata);
			expect(actionId).toBeNull();
			expect(actionName).toBeNull();
		});
		it('returns the correct action ID & name after a transition', () => {
			const expectedId = actionsDictionary.Switch;
			const expectedName = 'Switch';

			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });

			const actionId = currentActionIdFunction(automata);
			const actionName = currentActionNameFunction(automata);
			expect(actionId).toBe(expectedId);
			expect(actionName).toBe(expectedName);
		});
	});

	describe('currentCycle functions test', () => {
		it('initial cycle is 1', () => {
			const cycle = currentCycleFunction(automata);
			expect(cycle).toBe(1);
		});
		it('cycle is incremented after action dispatch', () => {
			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });
			const cycle = currentCycleFunction(automata);
			expect(cycle).toBe(2);
		});
	});

	describe('currentEpoch functions test', async () => {
		// separate module: both states expose $currentEpoch through context so epoch is observable
		const epochInput = `stateDiagram-v2
	[*] --> StateA: Reset
	StateA --> StateB: Switch
note right of StateA
	+Init
	#{epochSnapshot} <= currentEpoch()
end note
note right of StateB
	#{epochSnapshot} <= currentEpoch()
end note
`;
		await generateAndSave({ input: epochInput, automataName: 'AutomataInternalsEpochTest', lang: ModuleNames.JavaScript }, 'functions_automataInternalsEpoch');
		const { AutomataInternalsEpochTest, actionsDictionary } = await import(`./fixtures/generated/functions_automataInternalsEpoch_generated.js`);
		// shared instance — construction captures epoch=1 in StateA's initReducer (no increment yet)
		const automata = new AutomataInternalsEpochTest();

		it('initial epoch is 1', () => {
			expect(automata.getContext().context.epochSnapshot).toBe(1);
		});
		it('epoch is incremented after action dispatch of some automata', () => {
			// dispatch: StateA→StateB — reducer captures pre-increment epoch (=1), then incrementEpoch() → epoch=2
			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });
			// fresh instance: its initReducer runs with epoch already at 2, capturing the new value
			const freshAutomata = new AutomataInternalsEpochTest();
			expect(freshAutomata.getContext().context.epochSnapshot).toBe(2);
		});
	});
});
