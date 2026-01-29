import { ModuleNames } from '@yantrix/codegen';
import { internalFunctions } from '@yantrix/core';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import AutomataInternalsTest from './fixtures/generated/functions_automataInternals_generated.js';
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
			const currentEpoch = currentEpochFunction;
			expect(currentEpoch()).toBe(1);
		});
		it('epoch is incremented after action dispatch of some automata', async () => {
			automata.dispatch({ action: actionsDictionary.Switch, payload: {} });
			const currentEpoch = currentEpochFunction;
			expect(currentEpoch()).toBe(2);
		});
	});
});

const inputTwoCounters = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0, initialCounter2=0)

	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch

	Red --> Red: Switch_1
	RedYellow --> RedYellow: Switch_1
	Green --> Green: Switch_1
	Yellow --> Yellow: Switch_1

	note right of [*]
	#{ counter, counter2 } <= coalesce($initialCounter, #counter), coalesce($initialCounter2, #counter2)
	end note

	note left of Off
	+Init #{ counter = 0, counter2 = 0 }
	end note

	note right of Red
	#{ counter, counter2 } <= if(isEqual(%%currentActionName, 'Switch'), inc(#counter), #counter), if(isEqual(%%currentActionName, 'Switch_1'), inc(#counter2), #counter2)
	end note
	note right of RedYellow
	#{ counter, counter2 } <= if(isEqual(%%currentActionName, 'Switch'), inc(#counter), #counter), if(isEqual(%%currentActionName, 'Switch_1'), inc(#counter2), #counter2)
	end note
	note right of Green
	#{ counter, counter2 } <= if(isEqual(%%currentActionName, 'Switch'), inc(#counter), #counter), if(isEqual(%%currentActionName, 'Switch_1'), inc(#counter2), #counter2)
	end note
	note right of Yellow
	#{ counter, counter2 } <= if(isEqual(%%currentActionName, 'Switch'), inc(#counter), #counter), if(isEqual(%%currentActionName, 'Switch_1'), inc(#counter2), #counter2)
	end note
`;

describe('two counters via %%const internals', async () => {
	const exportedConsts = {
		currentActionId: '_currentActionId',
		currentActionName: '_currentActionName',
		currentStateId: '_currentStateId',
		currentStateName: '_currentStateName',
	};

	await generateAndSave(
		{
			input: inputTwoCounters,
			automataName: 'TwoCountersInternalsTest',
			lang: ModuleNames.JavaScript,
			constants: JSON.stringify(exportedConsts),
		},
		'functions_twoCountersInternals',
	);

	const {
		TwoCountersInternalsTest,
		statesDictionary,
		actionsDictionary,
	} = await import(`./fixtures/generated/functions_twoCountersInternals_generated.js`);

	let machine: InstanceType<typeof TwoCountersInternalsTest>;

	beforeEach(() => {
		machine = new TwoCountersInternalsTest();
	});

	it('instance is successfully created', () => {
		assert.isNotNull(machine);
	});

	it('starts in Off with both counters set to zero', () => {
		const snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.Off);
		expect(snapshot.context.counter).toBe(0);
		expect(snapshot.context.counter2).toBe(0);
	});

	it('switch transition to Red increments first counter only', () => {
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });

		const snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.Red);
		expect(snapshot.context.counter).toBe(1);
		expect(snapshot.context.counter2).toBe(0);
	});

	it('switch_1 self-transition in Red affects only second counter', () => {
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });
		machine.dispatch({ action: actionsDictionary.Switch_1, payload: {} });

		const snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.Red);
		expect(snapshot.context.counter).toBe(1);
		expect(snapshot.context.counter2).toBe(1);
	});

	it('red → RedYellow increments counter; Switch_1 increments counter2', () => {
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });

		let snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.RedYellow);
		expect(snapshot.context.counter).toBe(2);
		expect(snapshot.context.counter2).toBe(0);

		machine.dispatch({ action: actionsDictionary.Switch_1, payload: {} });

		snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.RedYellow);
		expect(snapshot.context.counter).toBe(2);
		expect(snapshot.context.counter2).toBe(1);
	});

	it('behavior remains correct in Green and Yellow states', () => {
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });
		machine.dispatch({ action: actionsDictionary.Switch, payload: {} });

		let snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.Yellow);
		expect(snapshot.context.counter).toBe(4);
		expect(snapshot.context.counter2).toBe(0);

		machine.dispatch({ action: actionsDictionary.Switch_1, payload: {} });

		snapshot = machine.getContext();
		expect(snapshot.state).toBe(statesDictionary.Yellow);
		expect(snapshot.context.counter).toBe(4);
		expect(snapshot.context.counter2).toBe(1);
	});
});
