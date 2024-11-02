import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

const input = `stateDiagram-v2
            [*] --> INIT: RESET
            INIT --> INTRO: RUN
            INTRO --> MAIN_MENU: TO_MENU
            MAIN_MENU --> [*]: EXIT
            MAIN_MENU --> MAIN_MENU: MENU_HOVER
            MAIN_MENU --> GAME_LOBBY: CREATE_GAME
            MAIN_MENU --> GAME_LOBBY: JOIN_GAME
            GAME_LOBBY --> [*]: EXIT
            GAME_LOBBY --> MAIN_MENU: TO_MENU
            GAME_LOBBY --> GAME_STARTING: START_GAME
            GAME_STARTING --> IN_GAME: BEGIN_GAME
            IN_GAME --> [*]: EXIT
            IN_GAME --> SCORE_SCREEN: END_GAME
            IN_GAME --> MAIN_MENU: TO_MENU
            SCORE_SCREEN --> MAIN_MENU: TO_MENU
            SCORE_SCREEN --> [*]: EXIT`;

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe('codegen output', () => {
	describe('gamePhaseAutomata', async () => {
		await generateAndSave({ input, automataName: 'GamePhaseAutomata', lang: ModuleNames.JavaScript }, 'GamePhaseAutomata');
		const { GamePhaseAutomata, actionsDictionary, statesDictionary } = await import(
			getGeneratedFixturePath('GamePhaseAutomata_generated.js')
		);

		const automata = new GamePhaseAutomata();

		const payload = {};
		const toInit = [{ action: actionsDictionary.RESET, payload }];
		const toIntro = [...toInit, { action: actionsDictionary.RUN, payload }];
		const toMenu = [...toIntro, { action: actionsDictionary.TO_MENU, payload }];
		const toGameLobby = [...toMenu, { action: actionsDictionary.JOIN_GAME, payload }];
		const toInGame = [
			...toGameLobby,
			{ action: actionsDictionary.START_GAME, payload },
			{ action: actionsDictionary.BEGIN_GAME, payload },
		];
		const toScoreScreen = [...toInGame, { action: actionsDictionary.END_GAME, payload }];
		const cases = [
			[toInit, statesDictionary.INIT],
			[toIntro, statesDictionary.INTRO],
			[toMenu, statesDictionary.MAIN_MENU],
			[toGameLobby, statesDictionary.GAME_LOBBY],
			[toInGame, statesDictionary.IN_GAME],
			[toScoreScreen, statesDictionary.SCORE_SCREEN],
			[toScoreScreen, statesDictionary.SCORE_SCREEN],
		];

		it('initial state', () => {
			expect(automata.state).toBe(statesDictionary['~~~START~~~']);
		});
		it('the context and state do not change with the wrong action.', () => {
			const prevState = automata.state;
			automata.dispatch({
				action: actionsDictionary.MENU_HOVER,
				payload: { players: 3 },
			});

			expect(automata.state).toBe(prevState);
			expect(automata.context).toStrictEqual({});
		});
		it('automata must have id', () => {
			expect(GamePhaseAutomata.id).toBeDefined();
		});
		it('automata must have actions', () => {
			expect(GamePhaseAutomata.actions).toBeDefined();
		});
		it('automata must have states', () => {
			expect(GamePhaseAutomata.states).toBeDefined();
		});
		it('automata.getState must return numeric state', () => {
			expect(GamePhaseAutomata.getState(GamePhaseAutomata.states.INIT)).toEqual(statesDictionary.INIT);
		});
		it.each(cases)('%j -- > %j', (a: any, b) => {
			automata.setActionQueue([...a]);
			automata.consumeAction(a.length);

			expect(automata.state).toBe(b);
		});
	});
});
