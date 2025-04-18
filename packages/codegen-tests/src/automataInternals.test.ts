import { ModuleNames } from '@yantrix/codegen';
import { internalFunctions } from '@yantrix/core';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import AutomataInternalsTest from './fixtures/generated/functions_automata_internals_generated.js';
import { generateAndSave } from './fixtures/utils.js';

const input = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter))
end note
note left of Off
+Init
end note
`;

describe('automata internal functions tests', async () => {
	await generateAndSave({ input, automataName: 'AutomataInternalsTest', lang: ModuleNames.JavaScript }, 'functions_automataInternals');

	const { AutomataInternalsTest, statesDictionary, actionsDictionary } = await import(`./fixtures/generated/functions_automataInternals_generated.js`);

	let automata: AutomataInternalsTest;

	// alternatively, can use references in automata's function dictionary, but I'd test the functions separately from the dictionary
	const currentStateIdFunction = internalFunctions.currentStateId(AutomataInternalsTest);
	const currentStateNameFunction = internalFunctions.currentStateName(AutomataInternalsTest, statesDictionary);
	const currentActionIdFunction = internalFunctions.currentActionId(AutomataInternalsTest);
	const currentActionNameFunction = internalFunctions.currentActionName(AutomataInternalsTest, actionsDictionary);
	const currentCycleFunction = internalFunctions.currentCycle(AutomataInternalsTest);

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

		// generating a separate bundle for the epoch test
		await generateAndSave({ input, automataName: 'AutomataInternalsEpochTest', lang: ModuleNames.JavaScript }, 'functions_automataInternalsEpoch');
		const { AutomataInternalsEpochTest, actionsDictionary, functionDictionary } = await import(`./fixtures/generated/functions_automataInternalsEpoch_generated.js`);
		const automata = new AutomataInternalsEpochTest();
		const currentEpochFunction = functionDictionary.get('currentEpoch')!;

		it('initial epoch is 1', () => {
			const currentEpoch = currentEpochFunction();
			expect(currentEpoch.val).toBe(1);
		});
		it('epoch is incremented after action dispatch of some automata', async () => {
			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });
			const currentEpoch = currentEpochFunction();
			expect(currentEpoch.val).toBe(2);
		});
	});
});
