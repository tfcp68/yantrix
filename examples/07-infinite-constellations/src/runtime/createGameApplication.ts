import {
	CoreLoop,
	createDataDestinationAdapter,
	EffectScheduler,
	hydrateModel,
	IStorageAdapter,
	ModelStore,
	NamedDataDestination,
	StorageSyncLoop,
	TModelHydrationResult,
	TStorageBinding,
	TStorageFailure,
} from '@yantrix/core';

import {
	createInitialGameModel,
	hydrateGameSnapshot,
	TGameModel,
	TGameSnapshot,
	toGameSnapshot,
} from '../domain/gameModel';
import { createGameModelTransformers } from '../domain/modelTransformers';
import {
	createInfiniteConstellationsSlice,
	eventDictionary,
} from '../generated/InfiniteConstellations';
import { GameCommandSource } from './GameCommandSource';

type TRenderPacket = { model: TGameModel };

const GameRenderDestination = createDataDestinationAdapter<
	number,
	Record<number, unknown>,
	TGameModel,
	TRenderPacket,
	void
>()(NamedDataDestination<TRenderPacket, void>);

export type TCreateGameApplicationOptions = {
	storage: IStorageAdapter<TGameSnapshot>;
	render?: (model: Readonly<TGameModel>) => void;
	persistenceDebounceMs?: number;
	onStorageError?: (failure: TStorageFailure) => void;
	developmentChecks?: boolean;
};

export type TGameApplication = {
	store: ModelStore<TGameModel>;
	loop: CoreLoop<number, Record<number, unknown>, TGameModel>;
	commands: GameCommandSource;
	persistence: StorageSyncLoop<TGameModel>;
	hydration: TModelHydrationResult<TGameModel>;
	flushCommands: () => Promise<void>;
	dispose: () => Promise<void>;
};

export async function createGameApplication({
	storage,
	render,
	persistenceDebounceMs = 40,
	onStorageError,
	developmentChecks = true,
}: TCreateGameApplicationOptions): Promise<TGameApplication> {
	const binding: TStorageBinding<TGameModel, TGameSnapshot> = {
		storage,
		select: toGameSnapshot,
		hydrate: hydrateGameSnapshot,
	};
	const hydration = await hydrateModel(createInitialGameModel(), [binding]);
	for (const failure of hydration.failures) onStorageError?.(failure);

	const store = new ModelStore(hydration.model, {
		development: developmentChecks
			? { freeze: true, validateSerializable: true }
			: undefined,
	});
	const scheduler = new EffectScheduler<TGameModel, number, Record<number, unknown>>({ store });
	const loop = new CoreLoop<number, Record<number, unknown>, TGameModel>({ effectScheduler: scheduler });
	const slice = createInfiniteConstellationsSlice<TGameModel>(createGameModelTransformers());
	const commands = new GameCommandSource();
	const persistence = new StorageSyncLoop({
		store,
		bindings: [binding],
		debounceMs: persistenceDebounceMs,
		onError: onStorageError,
	});

	loop.registerSlice(slice);
	loop.registerSource(commands);
	if (render) {
		const destination = new GameRenderDestination({
			id: 'infinite-constellations-render',
			resolver: async packet => render(packet.model),
		});
		destination.createTrigger([
			eventDictionary.stonePlaced,
			eventDictionary.novaCast,
			eventDictionary.gameReset,
		], (_event, model) => model ? { model } : null);
		loop.registerDestination(destination);
	}
	loop.start();
	persistence.start();

	return {
		store,
		loop,
		commands,
		persistence,
		hydration,
		flushCommands: async () => {
			loop.tick();
			await loop.whenIdle();
		},
		dispose: async () => {
			loop.stop();
			await persistence.stop(true);
		},
	};
}
