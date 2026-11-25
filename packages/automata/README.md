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

### `Data Model` and `Effects`

`ModelStore` owns the current `Data Model` snapshot. `EffectScheduler` collects
`Events` across an entire `Event Bus` cascade, including follow-up `Events`. When the
`Event Bus` becomes idle, `CoreLoop` flushes the batch and commits one `Data Model` snapshot if
any changes remain.

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
console.log(model.get().count); // 2
```

For application wiring, pass the `EffectScheduler` to `CoreLoop`. Built-in `FSMs`
notify the `Main Loop` when a transition commits, including a self-transition or a
queued `Action` consumed on resume. The `Main Loop` collects the `Events` emitted
by the `Event Adapter`, waits for the `Event` cascade, and flushes the batch before
updating matching `Destinations` with the committed snapshot. Custom `FSMs` can
provide `onEmittedEvents` for the same behavior. For an `FSM` without that hook,
the `Main Loop` asks its `Event Adapter` for `Events` after dispatching an `Action`
while the `FSM` is enabled and unpaused.

```typescript
const loop = new CoreLoop<AppEvent, IEventMeta, IModel>({ effectScheduler: effects });

// Register configured FSMs (or an AutomataSlice), then dispatch input Events.
// Only Events emitted by their Event Adapters are translated to Effects.
await loop.whenIdle();
```

Direct `enqueue()` and `flush()` remain available for custom `Main Loop` drivers.
A batch processes `Events` from `Event Adapters` in the order the `EffectScheduler`
received them. Each `Event` matches against the `Effect Matrix` of every registered
`Slice`. The `Effect Matrices` run in registration order, and the `Effects` within
each run in declaration order. Each `Effect` receives the `Data Model` returned by
the previous `Effect`. Return the same reference for a no-op so `ModelStore` can
skip notifying its subscribers. If a pure `Effect` throws, `flush()` discards that
batch and `ModelStore` retains its previous snapshot.

With the built-in `AutomataSlice`, `registerSlice(slice)` connects the `Slice`'s
`FSMs` and `Effect Matrix` to the `Main Loop`. Adding or removing an `FSM` on that
`Slice` updates its `Event` subscriptions. `unregisterSlice(slice.id)` disconnects
the `Slice`'s current `FSMs` and removes its `Effect Matrix`. A custom `Slice`
with mutable membership can implement `IAutomataSlice.onMachinesChanged` to
notify the `Main Loop` of additions and removals. Without that hook the `Main Loop`
wires the `FSMs` returned by `getMachines()` at registration.

### `Storage` and persistence

`Storage` is separate from `ModelStore`: adapters load and save serializable
snapshots, `hydrateModel()` builds the initial `Data Model`, and an independent
`StorageSyncLoop` persists committed changes without blocking the `Main Loop`.

Pass the session returned by `hydrateModel()` to the `Sync Loop`. If a `Storage` fails to load or hydrate, the loop reports the failure through `onError` and keeps saving to healthy connectors. Retry `hydrateModel()` with the same session to restore writes to that `Storage`. Pass `session: null` for a write-only loop.

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
	session: hydration.session,
	bindings: storageBindings,
	debounceMs: 250,
	onError: failure => console.error(failure),
}).start();

// Optional initial write stores defaults and migrated snapshots.
storageSync.requestSync();
await storageSync.whenIdle();
```

During continuous commits, `maxWaitMs` bounds how long the `Sync Loop` waits to start a save. With a positive `debounceMs`, the default is the greater of one second and `debounceMs`. If a save is already running, the next one starts when it finishes.

`InMemoryStorageAdapter` is the reference/test adapter.
`IndexedDBStorageAdapter` stores structured-clone-compatible snapshots, while
`VersionedStorageAdapter` decorates any adapter with ordered schema migrations.

`VersionedStorageAdapter` runs migrations on load. IndexedDB and in-memory connectors check the stored schema and save atomically. Connectors with only `load()` and `save()` use a best-effort schema check.

Multiple bindings may project and hydrate independent subsets of one `Data Model`;
loads happen concurrently and successful snapshots are composed in registration
order.

Then, see the docs:

- [Learn about finite state machines](https://tfcp68.github.io/yantrix/concepts/200_FSM.html)
- [See sample Yantrix designs](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
- [See the API reference](https://tfcp68.github.io/yantrix/API/automata/interfaces/IAutomata.html)

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
