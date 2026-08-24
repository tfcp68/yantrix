---
title: Core Runtime API
---

# Core Runtime API

The TypeScript runtime is available from `@yantrix/core`. The lower-level
`@yantrix/automata` package exports the same FSM and runtime primitives, while
`@yantrix/core` is the recommended application entry point.

```ts
import {
  CoreLoop,
  EffectScheduler,
  ModelStore,
} from '@yantrix/core';
```

## Data Model, ModelStore and Storage

These names describe different responsibilities:

| Entity | Responsibility | Contains business rules? | Persistent? |
| --- | --- | --- | --- |
| Data Model | The application-global serializable snapshot | No | Only through Storage |
| `ModelStore` | Holds the current in-memory snapshot and notifies subscribers after a commit | No | No |
| Effect | Calculates the next Data Model from an emitted Event and current snapshot | Yes, as a pure function | No |
| Storage Adapter | Loads, saves and clears one persisted projection | No | Yes |
| `StorageSyncLoop` | Observes committed snapshots and schedules Storage writes | No | Through adapters |

`ModelStore` deliberately has no `localStorage`, IndexedDB or network API. This
keeps the Data Model portable and lets one application persist different model
projections in independent Storages. See [Data Flow](../concepts/400_data_flow.html)
and the [Todo example](../examples/1000_todo.html).

`ModelStore.commit(nextModel)` compares snapshots by reference. Committing the
same reference is a no-op. A new reference is installed atomically, after which
each subscriber is notified once with `(nextModel, previousModel)`.

## Application lifecycle

The recommended composition order is:

1. Create Storage bindings and call `hydrateModel()` before the Main Loop exists.
2. Create one `ModelStore` from the hydrated snapshot.
3. Create one `EffectScheduler` for that store.
4. Create `CoreLoop` with the scheduler.
5. Create generated or hand-written `AutomataSlice` instances and register them.
6. Register Sources and Destinations, then start the loop.
7. Start `StorageSyncLoop` after hydration; call `requestSync()` only when defaults
   or migrated data must be written immediately.
8. On shutdown, stop Sources/Main Loop and await `storageSync.stop(true)`.

Hydration loads Storages concurrently but applies successful snapshots in
binding declaration order. A failed Storage is reported in the hydration result
and does not prevent independent snapshots from loading.

## Slice

An `AutomataSlice` is the unit registered in `CoreLoop`. It owns:

- one or more FSM instances;
- one Effect Matrix;
- its lifecycle and composite FSM state.

`registerSlice(slice)` registers all machines and the matrix as one operation.
If registration fails partway through, already registered machines and Effects
are removed. `unregisterSlice(id)` is idempotent and stops the Slice without
discarding its queued state.

JavaScript and TypeScript codegen can create this unit directly:

```ts
const slice = createCheckoutSlice<ApplicationModel>({
  orderSubmitted: submitOrderTransformer,
});

coreLoop.registerSlice(slice);
```

The application provides Model Transformers because the diagram declares Event
bindings and Event Meta, but does not declare the complete application Data
Model schema or domain update expressions.

## Effect batch contract

Only Events emitted by an FSM's Event Adapter after a transition are sent to the
Effect Layer. An external Source Event first becomes an Action and cannot update
the Data Model directly.

At the end of an EventBus cascade, `EffectScheduler` processes a batch in this
deterministic order:

1. emitted Event order (FIFO);
2. Slice/Effect Matrix registration order;
3. Effect declaration order inside a matrix.

Every Effect receives the model returned by the preceding Effect. The scheduler
performs no more than one `ModelStore.commit()` for the complete batch. If every
Effect preserves the current reference, the commit is a no-op and model-bound
Destinations are not updated.

Events enqueued from inside an Effect belong to the next batch. Adding or
removing an Effect Matrix during a flush also affects only subsequent batches.

### Failure semantics

An Effect batch is transactional with respect to `ModelStore`: if an Effect
throws or returns a non-object value, the store retains its previous snapshot
and no model-bound Destination is updated. The failed batch is consumed; Yantrix
does not retry business logic implicitly.

Storage failures are independent. They are accumulated by `StorageSyncLoop` and
reported through `onError`; they do not roll back a successful Data Model commit
or block the Main Loop. Yantrix performs no hidden Storage retry.

## CoreLoop.whenIdle()

`await coreLoop.whenIdle()` resolves after:

1. the current FIFO EventBus cascade has completed;
2. all Events emitted by FSM transitions have been collected;
3. the corresponding Effect batch has been flushed;
4. synchronous model-bound Destination updates for that batch have been invoked.

It does not wait for external Destination I/O, Storage writes, future timer ticks
or Events dispatched after the observed cascade. Await `storageSync.whenIdle()`
separately when a test or shutdown path requires persisted data.

An automatic Effect error is rethrown by `whenIdle()`. This makes the method the
deterministic synchronization and error boundary for commands dispatched by UI,
tests and server handlers.

```ts
coreLoop.getBus().dispatch(command);
await coreLoop.whenIdle();

// The Data Model and synchronous Destinations now reflect this command.
console.log(modelStore.get());
```

## Development checks

Development-only mutation and serialization checks are opt-in:

```ts
const store = new ModelStore(initialModel, {
  development: {
    freeze: true,
    validateSerializable: true,
  },
});
```

`freeze` recursively freezes accepted snapshots. `validateSerializable` enforces
Yantrix's lossless JSON-safe Data Model subset. Neither option is inferred from
`NODE_ENV`, and both are disabled by default.

