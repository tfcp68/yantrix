import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

// Regression test for: when [*] --> State: ActionA and AnotherState --> State: ActionB
// target the same state with different actions, ActionB was silently dropped because
// actionToStartStateMatrix spread overwrote the explicit transition in serializer.ts.
const input = `stateDiagram-v2
    [*] --> Closed: Init
    Closed --> Prompt: Open
    Prompt --> Closed: Dismiss`;

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe('action hash collision — different actions targeting the same initial state', () => {
	describe('collisionAutomata', async () => {
		await generateAndSave({ input, automataName: 'CollisionAutomata', lang: ModuleNames.JavaScript }, 'CollisionAutomata');
		const { CollisionAutomata, actionsDictionary, statesDictionary } = await import(
			getGeneratedFixturePath('CollisionAutomata_generated.js')
		);

		it('dismiss from Prompt transitions to Closed', () => {
			const m = new CollisionAutomata();
			m.dispatch({ action: actionsDictionary.Init, payload: {} });
			m.dispatch({ action: actionsDictionary.Open, payload: {} });
			expect(m.state).toBe(statesDictionary.Prompt);
			m.dispatch({ action: actionsDictionary.Dismiss, payload: {} });
			expect(m.state).toBe(statesDictionary.Closed);
		});

		it('init from Prompt also transitions to Closed (global reset via [*] action)', () => {
			const m = new CollisionAutomata();
			m.dispatch({ action: actionsDictionary.Init, payload: {} });
			m.dispatch({ action: actionsDictionary.Open, payload: {} });
			expect(m.state).toBe(statesDictionary.Prompt);
			m.dispatch({ action: actionsDictionary.Init, payload: {} });
			expect(m.state).toBe(statesDictionary.Closed);
		});
	});
});
