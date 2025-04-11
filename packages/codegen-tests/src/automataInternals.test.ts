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
	await generateAndSave({ input, automataName: 'AutomataInternalsTest', lang: ModuleNames.JavaScript }, 'functions_automata_internals');

	const { AutomataInternalsTest, statesDictionary, actionsDictionary, epoch } = await import(`./fixtures/generated/functions_automata_internals_generated.js`);

	let automata: AutomataInternalsTest;

	const currentStateIdFunction = internalFunctions.currentStateId(AutomataInternalsTest);
	const currentStateNameFunction = internalFunctions.currentStateName(AutomataInternalsTest, statesDictionary);
	const currentActionIdFunction = internalFunctions.currentActionId(AutomataInternalsTest);
	const currentActionNameFunction = internalFunctions.currentActionName(AutomataInternalsTest, actionsDictionary);
	const currentCycleFunction = internalFunctions.currentCycle(AutomataInternalsTest);
	const currentEpochFunction = internalFunctions.currentEpoch(epoch);

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

	// skip for now
	describe.skip('currentEpoch functions test', () => {
		it('initial epoch is 1', () => {
			const Epoch = currentEpochFunction();
			expect(Epoch).toBe(1);
		});
		it('epoch is incremented after action dispatch of some automata', () => {
			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });
			const Epoch = currentEpochFunction();
			expect(Epoch).toBe(2);
		});
	});
});
