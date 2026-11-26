---
title: Core Runtime Migration Guide
---

# Core Runtime Migration Guide

This guide migrates applications that used `CoreLoop` only as an `Event Bus`/`FSM`
orchestrator to the `Data Model`, `Effect` and `Slice` runtime.

## API mapping

| Previous application code | MVP runtime |
| --- | --- |
| Mutable application object or state hidden in `FSM` `Context` | Serializable global `Data Model` in `ModelStore` |
| `FSM` `Reducer` writes application data | A `Reducer` updates local `Context`. An emitted `Event` triggers a pure `Effect`. |
| `registerAutomata(machine)` for each `FSM` | `registerSlice(slice)` for the `FSM` group and its `Effect Matrix` |
| UI/API reads `FSM` internals | `Destination` or `ModelStore.subscribe()` reads committed `Data Model` |
| Persistence inside a `Reducer` or store callback | `Storage Adapter` plus independent `StorageSyncLoop` |
| Arbitrary delay after `bus.dispatch()` | `await coreLoop.whenIdle()` |

`registerAutomata()` remains supported for `FSM`-only use cases. A `Slice` requires
an `EffectScheduler`. Calling `registerSlice()` on a `CoreLoop` constructed without one throws an error.

## 1. Introduce an application `Data Model`

Move durable application data out of `FSM` `Context`. Keep `Context` limited to local
control state and transient values needed for the next transition.

```ts
import { CoreLoop, createModelFunctions, EffectScheduler, ModelStore } from '@yantrix/core';
import {
  createCartSlice,
  eventDictionary,
  type TCartEffectEvent,
  type TCartEventMeta,
} from './generated/Cart.js';

interface ApplicationModel {
  cart: { productIds: string[] };
}

const modelStore = new ModelStore<ApplicationModel>({
  cart: { productIds: [] },
});
```

## 2. Move model writes into `Effects`

A pure `Effect` returns a new snapshot when the `Data Model` changes. Use a `Model Transformer` to select
the part of the `Data Model` the domain operation needs.

```ts
const fx = createModelFunctions<ApplicationModel, TCartEffectEvent, TCartEventMeta>();
const productAdded = fx.forEvent<typeof eventDictionary.productAdded>();
const addProduct = productAdded.transformer(
  model => model.cart.productIds,
  (model, productIds) => ({ ...model, cart: { ...model.cart, productIds } }),
  (event, productIds) => {
    const productId = event.meta?.productId;
    return typeof productId === 'string' ? [...productIds, productId] : productIds;
  },
);
```

`forEvent` binds the `Model Transformer` to `productAdded`. The `Event Meta` includes a `productId` field
whose value the `Model Transformer` checks before appending it to the cart.

## 3. Compose a `Slice`

For generated TypeScript/JavaScript, add `effect/<NAME>` to the `State` that
represents a completed operation and use the generated factory.

```ts
const cartSlice = createCartSlice<ApplicationModel>({
  productAdded: addProduct,
});
```

For hand-written code, construct `AutomataSlice` with an `Effect Matrix` and add
its `FSMs` with stable machine IDs.

## 4. Wire the scheduler and loop

```ts
const effectScheduler = new EffectScheduler({ store: modelStore });
const coreLoop = new CoreLoop({ effectScheduler });

coreLoop.registerSlice(cartSlice).start();
```

`registerSlice()` registers the `Slice` and its `Effect Matrix` together. `unregisterSlice()` removes both.

## 5. Replace timing assumptions

```ts
coreLoop.getBus().dispatch({
  event: eventDictionary.addProduct,
  meta: { productId: 'coffee' },
});

await coreLoop.whenIdle();
console.info(modelStore.get().cart.productIds); // ['coffee']
```

`whenIdle()` is also the boundary where automatic `Effect` failures are observed.

## 6. Add persistence outside `ModelStore`

Hydrate before constructing the store, then start `StorageSyncLoop` with the hydration session.
`Storage` adapters own `load()` and `save()` and have an independent lifecycle. See [Core Runtime API](180_core_runtime.html#application-lifecycle).

## Compatibility checklist

- `Sources` produce `Events` that drive `FSM` `Actions`. Emitted `Events` trigger `Effects`.
- The `Event Bus` defaults to FIFO and can be configured for LIFO. See [`Effect` batch contract](180_core_runtime.html#effect-batch-contract) for scheduler ordering.
- `Effect` order is deterministic and a batch commits at most once.
- A failed `Effect` leaves the `Data Model` and model-bound `Destinations` unchanged.
- `Storage` errors do not roll back the model and are not retried implicitly.
- `Slice`, `Source`, `Destination` and `Storage` identifiers are stable and unique.
- Tests await both `coreLoop.whenIdle()` and, when relevant, `storageSync.whenIdle()`.

