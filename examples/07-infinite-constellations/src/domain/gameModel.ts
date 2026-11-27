import {
	mergeModelObject,
	removeModelProperty,
	setModelProperty,
} from '@yantrix/core';

export const PLAYERS = ['aurora', 'umbra'] as const;
export type TPlayer = typeof PLAYERS[number];
export type TCoordinateKey = `${number}:${number}`;
export type TBoard = Record<TCoordinateKey, TPlayer>;

export type TGameAction = {
	kind: 'place' | 'nova';
	player: TPlayer;
	x: number;
	y: number;
	cleared: number;
};

export type TGameModel = {
	board: TBoard;
	currentPlayer: TPlayer;
	scores: Record<TPlayer, number>;
	nova: Record<TPlayer, number>;
	turn: number;
	lastAction: TGameAction | null;
	notice: string;
};

export type TGameSnapshot = Pick<
	TGameModel,
	'board' | 'currentPlayer' | 'scores' | 'nova' | 'turn'
>;

export type TGameSnapshotV1 = {
	cells: Array<{ x: number; y: number; player: TPlayer }>;
	currentPlayer: TPlayer;
	scores: Record<TPlayer, number>;
	turn: number;
};

const DIRECTIONS = [
	[1, 0],
	[0, 1],
	[1, 1],
	[1, -1],
] as const;

export function coordinateKey(x: number, y: number): TCoordinateKey {
	return `${x}:${y}`;
}

export function isBoardCoordinate(value: number): boolean {
	return Number.isSafeInteger(value);
}

export function otherPlayer(player: TPlayer): TPlayer {
	return player === 'aurora' ? 'umbra' : 'aurora';
}

export function createInitialGameModel(): TGameModel {
	return {
		board: {},
		currentPlayer: 'aurora',
		scores: { aurora: 0, umbra: 0 },
		nova: { aurora: 0, umbra: 0 },
		turn: 0,
		lastAction: null,
		notice: 'Aurora opens the constellation.',
	};
}

export function canPlace(model: Readonly<TGameModel>, x: number, y: number): boolean {
	return isBoardCoordinate(x)
		&& isBoardCoordinate(y)
		&& model.board[coordinateKey(x, y)] === undefined;
}

function collectDirection(
	board: Readonly<TBoard>,
	x: number,
	y: number,
	dx: number,
	dy: number,
	player: TPlayer,
): TCoordinateKey[] {
	const negative: TCoordinateKey[] = [];
	let cursorX = x - dx;
	let cursorY = y - dy;
	while (board[coordinateKey(cursorX, cursorY)] === player) {
		negative.push(coordinateKey(cursorX, cursorY));
		cursorX -= dx;
		cursorY -= dy;
	}

	const positive: TCoordinateKey[] = [];
	cursorX = x + dx;
	cursorY = y + dy;
	while (board[coordinateKey(cursorX, cursorY)] === player) {
		positive.push(coordinateKey(cursorX, cursorY));
		cursorX += dx;
		cursorY += dy;
	}

	return [...negative.reverse(), coordinateKey(x, y), ...positive];
}

/** Checks only the four axes crossing the changed cell; it never enumerates the sparse board. */
export function findCompletedLines(
	board: Readonly<TBoard>,
	x: number,
	y: number,
	player: TPlayer,
): TCoordinateKey[][] {
	if (board[coordinateKey(x, y)] !== player) return [];
	return DIRECTIONS
		.map(([dx, dy]) => collectDirection(board, x, y, dx, dy, player))
		.filter(line => line.length >= 5);
}

export function placeStone(model: Readonly<TGameModel>, x: number, y: number): TGameModel {
	if (!canPlace(model, x, y)) return model as TGameModel;
	const player = model.currentPlayer;
	return mergeModelObject(model as TGameModel, {
		board: setModelProperty(model.board, coordinateKey(x, y), player),
		lastAction: { kind: 'place', player, x, y, cleared: 0 },
		notice: `${player === 'aurora' ? 'Aurora' : 'Umbra'} placed a star at ${x}:${y}.`,
	});
}

export function resolveCompletedLines(
	model: Readonly<TGameModel>,
	x: number,
	y: number,
): TGameModel {
	const player = model.currentPlayer;
	const lines = findCompletedLines(model.board, x, y, player);
	if (lines.length === 0) return model as TGameModel;

	const clearedKeys = new Set(lines.flat());
	const board = { ...model.board };
	for (const key of clearedKeys) delete board[key];
	const scores = setModelProperty(model.scores, player, model.scores[player] + lines.length);
	const nova = setModelProperty(model.nova, player, model.nova[player] + lines.length);

	return mergeModelObject(model as TGameModel, {
		board,
		scores,
		nova,
		lastAction: { kind: 'place', player, x, y, cleared: clearedKeys.size },
		notice: `${player === 'aurora' ? 'Aurora' : 'Umbra'} completed ${lines.length} line${lines.length === 1 ? '' : 's'} and charged Nova.`,
	});
}

export function finishTurn(model: Readonly<TGameModel>): TGameModel {
	return mergeModelObject(model as TGameModel, {
		currentPlayer: otherPlayer(model.currentPlayer),
		turn: model.turn + 1,
	});
}

export function applyPlacement(model: Readonly<TGameModel>, x: number, y: number): TGameModel {
	if (!canPlace(model, x, y)) return model as TGameModel;
	return finishTurn(resolveCompletedLines(placeStone(model, x, y), x, y));
}

function hasAdjacentStone(
	board: Readonly<TBoard>,
	x: number,
	y: number,
	player: TPlayer,
): boolean {
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			if (dx === 0 && dy === 0) continue;
			if (board[coordinateKey(x + dx, y + dy)] === player) return true;
		}
	}
	return false;
}

export function canCastNova(model: Readonly<TGameModel>, x: number, y: number): boolean {
	if (!isBoardCoordinate(x) || !isBoardCoordinate(y)) return false;
	const player = model.currentPlayer;
	return model.nova[player] > 0
		&& model.board[coordinateKey(x, y)] === otherPlayer(player)
		&& hasAdjacentStone(model.board, x, y, player);
}

export function applyNova(model: Readonly<TGameModel>, x: number, y: number): TGameModel {
	if (!canCastNova(model, x, y)) return model as TGameModel;
	const player = model.currentPlayer;
	const board = removeModelProperty(model.board, coordinateKey(x, y)) as TBoard;
	const nova = setModelProperty(model.nova, player, model.nova[player] - 1);
	return finishTurn(mergeModelObject(model as TGameModel, {
		board,
		nova,
		lastAction: { kind: 'nova', player, x, y, cleared: 1 },
		notice: `${player === 'aurora' ? 'Aurora' : 'Umbra'} collapsed the rival star at ${x}:${y}.`,
	}));
}

export function toGameSnapshot(model: Readonly<TGameModel>): TGameSnapshot {
	return {
		board: model.board,
		currentPlayer: model.currentPlayer,
		scores: model.scores,
		nova: model.nova,
		turn: model.turn,
	};
}

export function hydrateGameSnapshot(
	model: Readonly<TGameModel>,
	snapshot: TGameSnapshot,
): TGameModel {
	return mergeModelObject(model as TGameModel, {
		...snapshot,
		lastAction: null,
		notice: 'Savegame restored.',
	});
}

export function migrateSnapshotV1(snapshot: TGameSnapshotV1): TGameSnapshot {
	const board: TBoard = {};
	for (const cell of snapshot.cells) {
		if (isBoardCoordinate(cell.x) && isBoardCoordinate(cell.y) && PLAYERS.includes(cell.player)) {
			board[coordinateKey(cell.x, cell.y)] = cell.player;
		}
	}
	return {
		board,
		currentPlayer: snapshot.currentPlayer,
		scores: snapshot.scores,
		nova: { aurora: 0, umbra: 0 },
		turn: snapshot.turn,
	};
}
