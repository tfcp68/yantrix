import { beforeEach, describe, expect, it, vitest } from 'vitest';

// @ts-expect-error generated
import { GamePhaseAutomata, actionsDictionary, statesDictionary } from './fixtures/GamePhaseAutomata_generated.js';

let automata: GamePhaseAutomata;

describe('codegen output', () => {
	describe('gamePhaseAutomata', () => {
		automata = new GamePhaseAutomata();
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

		beforeEach(() => {
			vitest.clearAllTimers();
			vitest.clearAllTimers();
			automata = new GamePhaseAutomata();
		});
		it('initial state', () => {
			expect(automata.state).toBe(statesDictionary['~~~START~~~']);
		});
		it('the context and state do not change with the wrong action.', () => {
			// const prevContext = { ...automata.context };
			const prevState = automata.state;
			automata.dispatch({
				action: actionsDictionary.MENU_HOVER,
				payload: { players: 3 },
			});

			expect(automata.state).toBe(prevState);
			expect(automata.context).toStrictEqual(null);
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
