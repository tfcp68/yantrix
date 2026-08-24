import { describe, expect, it } from 'vitest';

import {
	applyNova,
	applyPlacement,
	coordinateKey,
	createInitialGameModel,
	findCompletedLines,
	migrateSnapshotV1,
} from '../src/domain/gameModel';

describe('infinite Constellations domain', () => {
	it('places stones on an unbounded sparse board without mutating the previous snapshot', () => {
		const initial = createInitialGameModel();
		const next = applyPlacement(initial, -100_000, 250_000);

		expect(next).not.toBe(initial);
		expect(initial.board).toEqual({});
		expect(next.board[coordinateKey(-100_000, 250_000)]).toBe('aurora');
		expect(next.currentPlayer).toBe('umbra');
		expect(next.turn).toBe(1);
	});

	it('preserves the model reference for an occupied or invalid coordinate', () => {
		const placed = applyPlacement(createInitialGameModel(), 3, 4);

		expect(applyPlacement(placed, 3, 4)).toBe(placed);
		expect(applyPlacement(placed, Number.MAX_SAFE_INTEGER + 1, 0)).toBe(placed);
	});

	it('finds completed lines using coordinate lookups without enumerating the board', () => {
		const target = createInitialGameModel();
		for (let x = 0; x < 5; x++) target.board[coordinateKey(x, -7)] = 'aurora';
		const board = new Proxy(target.board, {
			ownKeys: () => {
				throw new Error('full-board scan');
			},
		});

		expect(findCompletedLines(board, 4, -7, 'aurora')).toEqual([
			['0:-7', '1:-7', '2:-7', '3:-7', '4:-7'],
		]);
	});

	it.each([
		[1, 0],
		[0, 1],
		[1, 1],
		[1, -1],
	] as const)('scores a five-star line in direction %i:%i', (dx, dy) => {
		const model = createInitialGameModel();
		for (let step = -2; step <= 1; step++) {
			model.board[coordinateKey(step * dx, step * dy)] = 'aurora';
		}

		const next = applyPlacement(model, 2 * dx, 2 * dy);

		expect(next.scores.aurora).toBe(1);
		expect(next.nova.aurora).toBe(1);
		expect(next.board).toEqual({});
	});

	it('clears two crossing lines, scores both and awards two Nova charges', () => {
		const model = createInitialGameModel();
		const coordinates = [
			[-2, 0],
			[-1, 0],
			[1, 0],
			[2, 0],
			[0, -2],
			[0, -1],
			[0, 1],
			[0, 2],
		] as const;
		for (const [x, y] of coordinates) model.board[coordinateKey(x, y)] = 'aurora';

		const next = applyPlacement(model, 0, 0);

		expect(next.board).toEqual({});
		expect(next.scores.aurora).toBe(2);
		expect(next.nova.aurora).toBe(2);
		expect(next.lastAction?.cleared).toBe(9);
	});

	it('spends Nova only on an opponent stone adjacent to the current player constellation', () => {
		const model = createInitialGameModel();
		model.board['0:0'] = 'aurora';
		model.board['1:1'] = 'umbra';
		model.nova.aurora = 1;

		const next = applyNova(model, 1, 1);
		expect(next.board['1:1']).toBeUndefined();
		expect(next.nova.aurora).toBe(0);
		expect(next.currentPlayer).toBe('umbra');

		expect(applyNova(model, 9, 9)).toBe(model);
	});

	it('migrates the v1 array savegame into the v2 JSON-safe sparse snapshot', () => {
		const migrated = migrateSnapshotV1({
			cells: [{ x: -3, y: 8, player: 'umbra' }],
			currentPlayer: 'aurora',
			scores: { aurora: 2, umbra: 4 },
			turn: 12,
		});

		expect(migrated).toEqual({
			board: { '-3:8': 'umbra' },
			currentPlayer: 'aurora',
			scores: { aurora: 2, umbra: 4 },
			nova: { aurora: 0, umbra: 0 },
			turn: 12,
		});
	});
});
