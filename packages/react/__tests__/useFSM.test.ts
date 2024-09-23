import { renderHook } from '@testing-library/react-hooks';
import { describe, expect, it } from 'vitest';
import { useFSM } from '../src';
import GamePhaseAutomataTest from './fixtures/GamePhaseAutomataTest';
import TrafficLightAutomata from './fixtures/TrafficLightAutomata';

describe('useFSM tests', () => {
	it('instance class by automata id', () => {
		renderHook(() => useFSM({
			Automata: TrafficLightAutomata,
			id: TrafficLightAutomata.id,
		}));

		const { result: FSM2 } = renderHook(() => useFSM({
			Automata: GamePhaseAutomataTest,
			id: TrafficLightAutomata.id,
		}));

		expect(FSM2.current.getInstanceAutomata()).toBeInstanceOf(TrafficLightAutomata);
	});
});
