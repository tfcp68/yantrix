---
title: Core Runtime Migration Guide
---

# Core Runtime Migration Guide

This guide migrates applications that used `CoreLoop` only as an EventBus/FSM
orchestrator to the Data Model, Effect and Slice runtime.

## API mapping

| Previous application code | MVP runtime |
| --- | --- |
| Mutable application object or state hidden in FSM Context | Serializable global Data Model in `ModelStore` |
| FSM reducer writes application data | Reducer updates local Context; emitted Event triggers a pure Effect |
| `registerAutomata(machine)` for each FSM | `registerSlice(slice)` for the FSM group and its Effect Matrix |
| UI/API reads FSM internals | Destination or `ModelStore.subscribe()` reads committed Data Model |
| Persistence inside reducer/store callback | Storage Adapter plus independent `StorageSyncLoop` |
| Arbitrary delay after `bus.dispatch()` | `await coreLoop.whenIdle()` |

`registerAutomata()` remains supported for FSM-only use cases. A Slice requires
an `EffectScheduler`; constructing `CoreLoop` without one and then calling
`registerSlice()` is an explicit error.

## 1. Introduce an application Data Model

Move durable application data out of FSM Context. Keep Context limited to local
control state and transient values needed for the next transition.

```ts
interface ApplicationModel {
  cart: { productIds: string[] };
}

const modelStore = new ModelStore<ApplicationModel>({
  cart: { productIds: [] },
});
```

## 2. Move model writes into Effects

Effects must return a new snapshot and must not mutate their `Readonly` input.
Use Model Transformers to isolate domain code from the full application shape.

```ts
const addProduct = createModelTransformer(
  (model: Readonly<ApplicationModel>) => model.cart,
  (model, cart) => ({ ...model, cart }),
  (event, cart) => ({
    ...cart,
    productIds: [...cart.productIds, event.meta!.productId],
  }),
);
```

Returning the current reference denotes a structural no-op.

## 3. Compose a Slice

For generated TypeScript/JavaScript, add `effect/<NAME>` to the state that
represents a completed operation and use the generated factory:

```ts
const cartSlice = createCartSlice<ApplicationModel>({
  productAdded: addProduct,
});
```

For hand-written code, construct `AutomataSlice` with an Effect Matrix and add
its FSMs with stable machine IDs.

## 4. Wire the scheduler and loop

```ts
const effectScheduler = new EffectScheduler({ store: modelStore });
const coreLoop = new CoreLoop({ effectScheduler });

coreLoop.registerSlice(cartSlice);
```

Do not add the same Slice matrix separately to the scheduler: `registerSlice()`
owns both registration and removal.

## 5. Replace timing assumptions

```ts
coreLoop.getBus().dispatch({
  event: eventDictionary.addProduct,
  meta: { productId: 'coffee' },
});

await coreLoop.whenIdle();
expect(modelStore.get().cart.productIds).toContain('coffee');
```

`whenIdle()` is also the boundary where automatic Effect failures are observed.

## 6. Add persistence outside ModelStore

Hydrate before constructing the store, then start `StorageSyncLoop`. Do not add
`load()` or `save()` methods to a ModelStore subclass; persistence is intentionally
an independent lifecycle. See [Core Runtime API](180_core_runtime.html#application-lifecycle).

## Compatibility checklist

- Source Events only drive FSM Actions; only emitted Events trigger Effects.
- EventBus processing is FIFO despite the historical name “Event Stack”.
- Effect order is deterministic and a batch commits at most once.
- A failed Effect leaves the Data Model and model-bound Destinations unchanged.
- Storage errors do not roll back the model and are not retried implicitly.
- Slice, Source, Destination and Storage identifiers are stable and unique.
- Tests await both `coreLoop.whenIdle()` and, when relevant, `storageSync.whenIdle()`.

