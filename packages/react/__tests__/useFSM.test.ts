import { describe, expect, it } from 'vitest';
import { useFSM } from '../src/hooks/useFSM';
import GamePhaseAutomataTest from './fixtures/GamePhaseAutomataTest';
import TrafficLightAutomata from './fixtures/TrafficLightAutomata';

describe('useFSM tests', () => {
	it('instance class by automata id', () => {
		useFSM({
			Automata: TrafficLightAutomata,
			id: TrafficLightAutomata.id,
		});

		const FSM2 = useFSM({
			Automata: GamePhaseAutomataTest,
			id: TrafficLightAutomata.id,
		});

		expect(FSM2.getInstanceAutomata()).toBeInstanceOf(TrafficLightAutomata);
	});
});
