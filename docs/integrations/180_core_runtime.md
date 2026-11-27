---
title: Core Runtime API
---

# Core Runtime API

The TypeScript runtime is available from `@yantrix/core`. The lower-level
`@yantrix/automata` package exports the same `FSM` and runtime primitives, while
`@yantrix/core` is the recommended application entry point.

```ts
import {
	CoreLoop,
	EffectScheduler,
	ModelStore,
} from '@yantrix/core';
```

## `Data Model`, `ModelStore` and `Storage`

| Entity | Responsibility | Contains business rules? | Persistent? |
| --- | --- | --- | --- |
| `Data Model` | The application-global serializable snapshot | No | Only through `Storage` |
| `ModelStore` | Holds the current in-memory snapshot and notifies subscribers after a commit | No | No |
| `Effect` | Calculates the next `Data Model` from an emitted `Event` and current snapshot | Yes, as a pure function | No |
| `Storage Adapter` | Loads, saves and clears one persisted projection | No | Yes |
| `StorageSyncLoop` | Observes committed snapshots and schedules `Storage` writes | No | Through adapters |

`ModelStore` deliberately has no `localStorage`, IndexedDB or network API. This
keeps the `Data Model` portable and lets one application persist different model
projections in independent `Storages`. See [Data Flow](../concepts/400_data_flow.html)
and the [Todo example](../examples/1000_todo.html).

`ModelStore.commit(nextModel)` compares snapshots by reference. Committing the
same reference is a no-op. A new reference is installed before subscribers receive `(nextModel, previousModel)`.

## Application lifecycle

Compose the application in this order.

1. Create `Storage` bindings and call `hydrateModel()` before the `Main Loop` exists.
2. Create one `ModelStore` from the hydrated snapshot.
3. Create one `EffectScheduler` for that store.
4. Create `CoreLoop` with the scheduler.
5. Create generated or hand-written `AutomataSlice` instances and register them.
6. Register `Sources` and `Destinations`, then start the loop.
7. Start `StorageSyncLoop` with the session returned by `hydrateModel()`. Call `requestSync()` when defaults
   or migrated data must be written immediately.
8. Stop accepting commands and stop external `Sources`. Keep the `Main Loop` running and its `Slices` registered
   while awaiting `coreLoop.whenIdle()`. Then disconnect the `Slices`, stop the `Main Loop`, and await
   `storageSync.stop(true)` to persist the final committed snapshot.

Hydration loads `Storages` concurrently but applies successful snapshots in
binding declaration order. A failed `Storage` is reported in the hydration result
and does not prevent independent snapshots from loading.

## `Slice`

Each `AutomataSlice` registered in `CoreLoop` owns one or more `FSM` instances, an `Effect Matrix`,
and its lifecycle and composite `FSM` state.

`registerSlice(slice)` registers all machines and the matrix as one operation.
If registration fails partway through, already registered machines and `Effects`
are removed. `unregisterSlice(id)` is idempotent and stops the `Slice` without
discarding its queued state.

JavaScript and TypeScript codegen supply a `Slice` factory.

```ts
const slice = createCheckoutSlice<IApplicationModel>({
	orderSubmitted: submitOrderTransformer,
});

coreLoop.registerSlice(slice);
```

The application provides `Model Transformers` because the diagram declares `Event`
bindings and `Event Meta`, but does not declare the complete application `Data Model` schema or domain update expressions.

## `Effect` batch contract

An external `Event` from a `Source` can trigger an `Action` in an `FSM`. After a transition, the `Event Adapter`
can emit `Events` for the `Effect Layer`.

The `Event Bus` delivers pending `Events` oldest first by default (FIFO). A bus configured for LIFO delivers
the newest pending `Event` first. The `Effect Scheduler` processes emitted `Events` in the order it receives
them, then runs matching `Effect Matrices` in registration order and their `Effects` in declaration order.

Every `Effect` receives the `Data Model` returned by the preceding `Effect`. The scheduler performs at most one
`ModelStore.commit()` for the complete batch. `ModelStore` compares the root reference. Returning the original
snapshot skips subscriber notifications and model-bound `Destination` updates. Returning a fresh object,
even `{ ...model }` with identical fields, triggers a commit.

`Events` enqueued from inside an `Effect` belong to the next batch. Adding or
removing an `Effect Matrix` during a flush also affects only subsequent batches.

### Failure semantics

If a pure `Effect` throws before commit, the previous snapshot is retained. Returning a non-object value
also fails the batch before commit. In either case the scheduler consumes the failed batch and skips
model-bound `Destination` updates.

`ModelStore.commit()` installs the new `Data Model` and calls every subscriber in registration order.
If subscribers throw, `commit()` finishes notifying the others, then throws an `AggregateError` containing
the original errors in that order. A running `StorageSyncLoop` still receives the snapshot if an earlier
subscriber throws.

During an `Effect` batch, the error propagates through `EffectScheduler.flush()`. `coreLoop.whenIdle()`
rejects, and the `Main Loop` skips model-bound `Destination` updates for that batch. The snapshot stays
committed, and later batches can run.

`Storage` failures are independent. `StorageSyncLoop` collects them and reports them through `onError`.
A successful `Data Model` commit stands and the `Main Loop` continues.

## `CoreLoop.whenIdle()`

`await coreLoop.whenIdle()` waits for the current `Event Bus` cascade to complete in the configured order.
By then the `Main Loop` has collected the `Events` from `FSM` transitions, flushed the corresponding
`Effect` batch, and invoked the synchronous model-bound `Destination` updates for that batch.

It does not wait for external `Destination` I/O, `Storage` writes, future timer ticks
or `Events` dispatched after the observed cascade. Await `storageSync.whenIdle()`
separately when a test or shutdown path requires persisted data.

An automatic `Effect` error is rethrown by `whenIdle()`. This makes the method the
deterministic synchronization and error boundary for commands dispatched by UI,
tests and server handlers.

```ts
coreLoop.getBus().dispatch(command);
await coreLoop.whenIdle();

// The Data Model and synchronous Destinations now reflect this command.
console.info(modelStore.get());
```

## Development checks

Enable development-only mutation and serialization checks when creating `ModelStore`.

```ts
const store = new ModelStore(initialModel, {
	development: {
		freeze: true,
		validateSerializable: true,
	},
});
```

`freeze` recursively freezes accepted snapshots. `validateSerializable` enforces
Yantrix's lossless JSON-safe `Data Model` subset. Neither option is inferred from
`NODE_ENV`, and both are disabled by default.
