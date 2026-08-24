import {
	composeModelTransformers,
	createModelPredicate,
	createModelTransformer,
	whenModel,
} from '@yantrix/core';

import {
	eventDictionary,
	TInfiniteConstellationsEventMeta,
	TInfiniteConstellationsModelTransformers,
} from '../generated/InfiniteConstellations';
import {
	applyNova,
	canCastNova,
	canPlace,
	createInitialGameModel,
	finishTurn,
	placeStone,
	resolveCompletedLines,
	TGameModel,
} from './gameModel';

const selectGame = (model: Readonly<TGameModel>) => model;
const replaceGame = (_model: Readonly<TGameModel>, game: TGameModel) => game;
const eventCoordinate = (value: unknown): number => typeof value === 'number' ? value : Number.NaN;

export function createGameModelTransformers(): TInfiniteConstellationsModelTransformers<TGameModel> {
	const mayPlace = createModelPredicate<
		TGameModel,
		TGameModel,
		typeof eventDictionary.stonePlaced,
		TInfiniteConstellationsEventMeta
	>(selectGame, (event, model) => canPlace(
		model,
		eventCoordinate(event.meta?.x),
		eventCoordinate(event.meta?.y),
	));
	const addStone = createModelTransformer<
		TGameModel,
		TGameModel,
		typeof eventDictionary.stonePlaced,
		TInfiniteConstellationsEventMeta
	>(selectGame, replaceGame, (event, model) => placeStone(
		model,
		eventCoordinate(event.meta?.x),
		eventCoordinate(event.meta?.y),
	));
	const scoreLines = createModelTransformer<
		TGameModel,
		TGameModel,
		typeof eventDictionary.stonePlaced,
		TInfiniteConstellationsEventMeta
	>(selectGame, replaceGame, (event, model) => resolveCompletedLines(
		model,
		eventCoordinate(event.meta?.x),
		eventCoordinate(event.meta?.y),
	));
	const advanceAfterPlace = createModelTransformer<
		TGameModel,
		TGameModel,
		typeof eventDictionary.stonePlaced,
		TInfiniteConstellationsEventMeta
	>(selectGame, replaceGame, (_event, model) => finishTurn(model));

	const mayCastNova = createModelPredicate<
		TGameModel,
		TGameModel,
		typeof eventDictionary.novaCast,
		TInfiniteConstellationsEventMeta
	>(selectGame, (event, model) => canCastNova(
		model,
		eventCoordinate(event.meta?.x),
		eventCoordinate(event.meta?.y),
	));
	const castNova = createModelTransformer<
		TGameModel,
		TGameModel,
		typeof eventDictionary.novaCast,
		TInfiniteConstellationsEventMeta
	>(selectGame, replaceGame, (event, model) => applyNova(
		model,
		eventCoordinate(event.meta?.x),
		eventCoordinate(event.meta?.y),
	));
	const reset = createModelTransformer<
		TGameModel,
		TGameModel,
		typeof eventDictionary.gameReset,
		TInfiniteConstellationsEventMeta
	>(selectGame, replaceGame, () => createInitialGameModel());

	return {
		stonePlaced: whenModel(mayPlace, composeModelTransformers(addStone, scoreLines, advanceAfterPlace)),
		novaCast: whenModel(mayCastNova, castNova),
		gameReset: reset,
	};
}
