# `@yantrix/automata`

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Reference finite state machine (FSM) implementation for [Yantrix](https://github.com/tfcp68/yantrix/) framework. This package provides foundational building blocks for creating and managing state machines with type-safe transitions and event handling in Typescript

<p>
	<a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/automata"><img src="https://img.shields.io/npm/v/@yantrix/automata.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/automata"><img src="https://img.shields.io/npm/dt/@yantrix/automata.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>

## 📖 Usage

Install the primary package using your prefered package manager. All the secondary dependencies will be installed automatically.

```bash
# Via NPM
$ npm install @yantrix/automata

# Via Yarn
$ yarn add @yantrix/automata

# Via PNPM
$ pnpm install @yantrix/automata

# ✨ Auto-detection
$ npx nypm install @yantrix/automata
```

> We suggest using `pnpm`

### Data Model and Effects

`ModelStore` owns the current application snapshot. `EffectScheduler` collects
Events during a Main Loop iteration and applies all matching Effects with at
most one model commit when the iteration is flushed:

```typescript
import { CoreLoop, EffectScheduler, ModelStore } from '@yantrix/automata';

enum AppEvent {
	Increment = 1,
}

interface IEventMeta extends Record<AppEvent, unknown> {
	[AppEvent.Increment]: { amount: number };
}

interface IModel {
	count: number;
}

const model = new ModelStore<IModel>({ count: 0 });
const effects = new EffectScheduler<IModel, AppEvent, IEventMeta>({
	store: model,
	matrices: [{
		[AppEvent.Increment]: [
			(event, current) => ({
				...current,
				count: current.count + (event.meta?.amount ?? 0),
			}),
		],
	}],
});

effects.enqueue({ event: AppEvent.Increment, meta: { amount: 2 } });
effects.flush();
```

For application wiring, pass the scheduler to `CoreLoop`. The loop enqueues only
Events emitted by registered FSM Event Adapters, waits for the full EventBus
cascade, and flushes the batch before updating Data Destinations:

```typescript
const loop = new CoreLoop<AppEvent, IEventMeta, IModel>({ effectScheduler: effects });

// Register configured FSMs (or an AutomataSlice), then dispatch input Events.
// Only Events emitted by their Event Adapters are translated to Effects.
await loop.whenIdle();
```

Direct `enqueue()` and `flush()` remain available for custom Main Loop drivers.

For the exact lifecycle, Effect ordering, failure guarantees and the scope of
`CoreLoop.whenIdle()`, see the
[Core Runtime API](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html).

Model Predicates and Model Transformers can be scoped to a selected model value
and composed into an Effect without exposing the whole application model to a
domain operation:

```typescript
import {
	createModelPredicate,
	createModelTransformer,
	whenModel,
} from '@yantrix/automata';

interface ICounterModel {
	counter: { value: number; limit: number };
}

const canIncrement = createModelPredicate<
	ICounterModel,
	ICounterModel['counter'],
	AppEvent.Increment,
	IEventMeta
>(
	(current: Readonly<ICounterModel>) => current.counter,
	(event, counter) => counter.value + (event.meta?.amount ?? 0) <= counter.limit,
);
const increment = createModelTransformer<
	ICounterModel,
	ICounterModel['counter'],
	AppEvent.Increment,
	IEventMeta
>(
	(current: Readonly<ICounterModel>) => current.counter,
	(current, counter) => ({ ...current, counter }),
	(event, counter) => ({ ...counter, value: counter.value + (event.meta?.amount ?? 0) }),
);
const incrementWhenAllowed = whenModel(canIncrement, increment);
```

`ModelStore` can also enable opt-in development diagnostics. They are disabled
by default and do not add work to production commits:

```typescript
const model = new ModelStore(initialModel, {
	development: {
		freeze: true,
		validateSerializable: true,
	},
});
```

### Storage and persistence

`Storage` is separate from `ModelStore`: adapters load and save serializable
snapshots, `hydrateModel()` builds the initial Data Model, and an independent
`StorageSyncLoop` persists committed changes without blocking the Main Loop.

```typescript
import {
	hydrateModel,
	LocalStorageAdapter,
	ModelStore,
	StorageSyncLoop,
} from '@yantrix/automata';

interface IModel {
	count: number;
	transientMessage: string | null;
}

const counterStorage = new LocalStorageAdapter<{ count: number }>({
	id: 'counter',
	key: 'yantrix:counter',
});
const storageBindings = [{
	storage: counterStorage,
	select: (model: Readonly<IModel>) => ({ count: model.count }),
	hydrate: (model: Readonly<IModel>, snapshot: { count: number }) => ({
		...model,
		count: snapshot.count,
	}),
}];

const hydration = await hydrateModel<IModel>(
	{ count: 0, transientMessage: null },
	storageBindings,
);
const model = new ModelStore(hydration.model);
const storageSync = new StorageSyncLoop({
	store: model,
	bindings: storageBindings,
	debounceMs: 250,
	onError: failure => console.error(failure),
}).start();

// Optional initial write stores defaults and migrated snapshots.
storageSync.requestSync();
await storageSync.whenIdle();
```

`InMemoryStorageAdapter` is the reference/test adapter.
`IndexedDBStorageAdapter` stores structured-clone-compatible snapshots, while
`VersionedStorageAdapter` decorates any adapter with ordered schema migrations.
Multiple bindings may project and hydrate independent subsets of one Data Model;
loads happen concurrently and successful snapshots are composed in registration
order.

Then, see the docs:

- [Learn about finite state machines](https://tfcp68.github.io/yantrix/concepts/200_FSM.html)
- [See sample Yantrix designs](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
- [See the API reference](https://tfcp68.github.io/yantrix/API/automata/interfaces/IAutomata.html)

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
