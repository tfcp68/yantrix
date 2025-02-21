import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { randomInteger } from '../../utils/src/fixtures';
import templates from './fixtures/forksTemplates';
import { generateAndSave } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe('forks', () => {
	describe('default', async () => {
		await generateAndSave({ input: templates.defaultFork, automataName: 'DefaultFork', lang: ModuleNames.JavaScript }, `fork_defaultFork`);
		const { DefaultFork, actionsDictionary, statesDictionary } = await import(
			getGeneratedFixturePath('fork_defaultFork_generated.js')
		);

		let automata: typeof DefaultFork;
		const defaultCounterValue = 10;

		beforeEach(() => {
			automata = new DefaultFork();
			if (automata && actionsDictionary && statesDictionary) {
				const queue = [
					{
						action: actionsDictionary.START,
						payload: { counter: defaultCounterValue },
					},

				];
				automata.setActionQueue(queue);
				automata.consumeAction(queue.length);
			}
		});

		it('init', () => {
			expect(automata).toBeDefined();
			expect(actionsDictionary).toBeDefined();
			expect(statesDictionary).toBeDefined();
		});

		it('automata is in working state', () => {
			expect(automata.state).toBe(statesDictionary.WORKING);
		});

		it('transition into END state if condition is TRUE', () => {
			const value = randomInteger(defaultCounterValue + 1, 1000);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.END);
		});

		it('transition back into WORKING state if condition is FALSE', () => {
			const value = randomInteger(0, defaultCounterValue);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.WORKING);
		});

		it('state reducer is invoked when transitioning to the same state after the fork', () => {
			const value = randomInteger(0, defaultCounterValue);
			const prev = automata.context.counter;
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});

			expect(automata.state).toBe(statesDictionary.WORKING);
			expect(automata.context.counter).toBe(prev - value);
		});
	});

	describe('fork with no default path', async () => {
		await generateAndSave({ input: templates.noDefaultPathFork, automataName: 'NoDefaultPathFork', lang: ModuleNames.JavaScript }, `fork_noDefaultPathFork`);
		const { NoDefaultPathFork, actionsDictionary, statesDictionary } = await import(
			getGeneratedFixturePath('fork_noDefaultPathFork_generated.js')
		);

		let automata: typeof NoDefaultPathFork;
		const defaultCounterValue = 10;

		beforeEach(() => {
			automata = new NoDefaultPathFork();
			if (automata && actionsDictionary && statesDictionary) {
				const queue = [
					{
						action: actionsDictionary.START,
						payload: { counter: defaultCounterValue },
					},
					{
						action: actionsDictionary['[-]'],
						payload: { value: 0 },
					},
				];
				automata.setActionQueue(queue);
				automata.consumeAction(queue.length);
			}
		});

		it('init', () => {
			expect(automata).toBeDefined();
			expect(actionsDictionary).toBeDefined();
			expect(statesDictionary).toBeDefined();
		});

		it('automata is in working state', () => {
			expect(automata.state).toBe(statesDictionary.WORKING);
		});

		it('transition into State1 state if isGreater is TRUE', () => {
			const value = randomInteger(defaultCounterValue + 1, 1000);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.State1);
		});

		it('transition into State2 state if isZero is TRUE', () => {
			const value = 0;
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.State2);
		});

		it('staying in WORKING state if no condition is TRUE', () => {
			const value = randomInteger(-100, -1);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.WORKING);
		});

		it('state reducer is NOT invoked when staying on the same state', () => {
			const expected = automata.context.counter;
			const value = randomInteger(-100, -1);

			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});

			expect(automata.state).toBe(statesDictionary.WORKING);
			expect(automata.context.counter).toBe(expected);
		});
	});

	describe('fork that leads into another fork', async () => {
		await generateAndSave({ input: templates.forkIntoFork, automataName: 'ForkIntoFork', lang: ModuleNames.JavaScript }, `fork_forkIntoFork`);
		const { ForkIntoFork, actionsDictionary, statesDictionary } = await import(
			getGeneratedFixturePath('fork_forkIntoFork_generated.js')
		);

		let automata: typeof ForkIntoFork;
		const defaultCounterValue = 10;

		beforeEach(() => {
			automata = new ForkIntoFork();
			if (automata && actionsDictionary && statesDictionary) {
				const queue = [
					{
						action: actionsDictionary.START,
						payload: { counter: defaultCounterValue },
					},

				];
				automata.setActionQueue(queue);
				automata.consumeAction(queue.length);
			}
		});

		it('init', () => {
			expect(automata).toBeDefined();
			expect(actionsDictionary).toBeDefined();
			expect(statesDictionary).toBeDefined();
		});

		it('automata is in working state', () => {
			expect(automata.state).toBe(statesDictionary.WORKING);
		});

		it('transition into State1 state if isGreater is TRUE', () => {
			const value = randomInteger(defaultCounterValue + 1, 1000);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.State1);
		});

		it('transition into State2 state if isGreater is FALSE, and isPositive is TRUE', () => {
			const value = randomInteger(1, defaultCounterValue - 1);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.State2);
		});

		it('transition back into WORKING state as a default path for the second fork, if isGreater and isPositive are FALSE', () => {
			const value = randomInteger(-100, -1);
			automata.dispatch({
				action: actionsDictionary.REDUCE,
				payload: { value },
			});
			expect(automata.state).toBe(statesDictionary.WORKING);
		});
	});

	describe('fork with duplicate default paths is not generated', async () => {
		await expect(generateAndSave({ input: templates.multipleDefaultPathsFork, automataName: 'MultipleDefaultPathsFork', lang: ModuleNames.JavaScript }, `fork_multipleDefaultPathsFork`))
			.rejects
			.toThrow('Duplicate default path encountered');
	});
});
