# 07 — Infinite Constellations

Infinite Constellations is the reference application for the Yantrix MVP. It is a two-player, endless-board strategy game implemented with every core module delivered in roadmap stages P0–P4.

Aurora and Umbra place stars on a sparse board. A contiguous line of at least five stars scores one point per axis, clears every star in the completed lines and awards the same number of Nova charges. Nova spends one charge to remove an adjacent opponent star. There is no board boundary and no final winning state.

## Run

```sh
# from the repository root
pnpm install
pnpm --filter 07-infinite-constellations dev
```

The example bootstraps missing `@yantrix/cli`, `@yantrix/core` and their transitive workspace builds before code generation, so the command also works after the repository's `pnpm clean`. A compilation error in a workspace dependency is reported directly instead of surfacing later as a missing `dist/index.js` in Vite.

Production build and verification:

```sh
pnpm --filter 07-infinite-constellations test
pnpm --filter 07-infinite-constellations lint
pnpm --filter 07-infinite-constellations build
```

The browser UI renders a 15×15 window over the infinite coordinate space. Use the arrows, mouse wheel, middle-button drag, Shift+arrow keys or the X/Y center fields to navigate. The board itself remains a sparse `Record<"x:y", Player>` and supports negative and large safe-integer coordinates.

## Runtime path

One click takes this route:

```text
GameView
  → GameCommandSource
  → CoreLoop.tick()
  → generated FSM action
  → generated emitted Effect Event
  → generated Effect Matrix
  → Model Predicate + composed Model Transformers
  → one ModelStore commit
  → render Destination + asynchronous StorageSyncLoop
```

The external `placeRequested`, `novaRequested` and `resetRequested` Events never update the model. The generated FSM emits `stonePlaced`, `novaCast` or `gameReset` after its transition; only these Events select Effects. The render Destination is bound to these business Effect Events instead of the wildcard so unrelated technical Events cannot cause duplicate renders.

## Core modules and their documentation

| Module used here | Role in the example | Framework documentation |
| --- | --- | --- |
| Data Model | JSON-safe global game snapshot; no methods or persistence API | [Architecture](https://tfcp68.github.io/yantrix/concepts/100_architecture.html), [Data Flow](https://tfcp68.github.io/yantrix/concepts/400_data_flow.html) |
| `ModelStore` | Owns the in-memory snapshot and makes atomic commits observable | [Core Runtime API](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html#data-model-modelstore-and-storage) |
| Effects and `EffectScheduler` | Apply pure game rules in a deterministic batch with at most one commit | [Side Effects](https://tfcp68.github.io/yantrix/syntax/300_side_effects.html), [Effect batch contract](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html#effect-batch-contract) |
| Model Predicates and Transformers | Reject invalid commands and compose placement, scoring and turn rotation | [Transformers](https://tfcp68.github.io/yantrix/syntax/160_transformers.html), [Core Runtime API](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html) |
| generated `AutomataSlice` | Packages the generated FSM and Effect Matrix for one `registerSlice()` call | [Slice](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html#slice) |
| `CoreLoop` and `whenIdle()` | Connect the Source, FSM, Effects and post-commit Destination; provide a deterministic test boundary | [`CoreLoop.whenIdle()`](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html#coreloop-whenidle) |
| Source | Turns browser/test commands into EventBus Events; drained explicitly by `tick()` | [Event Model](https://tfcp68.github.io/yantrix/concepts/300_event_model.html) |
| Destination | Renders only after a successful model-changing Effect batch | [Data Flow](https://tfcp68.github.io/yantrix/concepts/400_data_flow.html) |
| Storage adapters | Versioned LocalStorage in the browser; InMemory fallback in tests/SSR | [Persistent Todo](https://tfcp68.github.io/yantrix/examples/1000_todo.html) |
| `hydrateModel` / `StorageSyncLoop` | Hydrate before store creation; debounce and coalesce committed snapshots afterwards | [Application lifecycle](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html#application-lifecycle) |
| TypeScript/JavaScript codegen | Generate equivalent Slice and Effect Matrix artifacts from one Mermaid diagram | [JavaScript API](https://tfcp68.github.io/yantrix/integrations/150_JSAPI.html) |

## Persistence lifecycle

The composition root follows the documented lifecycle exactly:

1. create a versioned Storage adapter;
2. call `hydrateModel()` with a v2 snapshot binding;
3. create `ModelStore`, `EffectScheduler` and `CoreLoop` from the hydrated model;
4. register the generated Slice, command Source and render Destination;
5. start `CoreLoop` and then `StorageSyncLoop`;
6. on `pagehide`, stop the loop and flush pending writes with `storageSync.stop(true)`.

The included v1 fixture migrates `{ cells: [...] }` to the v2 sparse-board representation. Hydration and save failures are displayed but do not stop gameplay or roll back successful model commits.

## Project map

- [`src/diagrams/InfiniteConstellations.mermaid`](src/diagrams/InfiniteConstellations.mermaid) — source FSM and Side Effects declarations.
- [`src/generated/`](src/generated/) — TypeScript runtime artifact and JavaScript parity artifact; generated, never hand-edited.
- [`src/domain/gameModel.ts`](src/domain/gameModel.ts) — serializable model, local line scan, placement/Nova rules and v1 migration.
- [`src/domain/modelTransformers.ts`](src/domain/modelTransformers.ts) — Model Predicates and composed Model Transformers injected into the generated Slice.
- [`src/runtime/createGameApplication.ts`](src/runtime/createGameApplication.ts) — composition root and lifecycle.
- [`src/runtime/GameCommandSource.ts`](src/runtime/GameCommandSource.ts) — shared browser/test Source.
- [`src/runtime/storage.ts`](src/runtime/storage.ts) — versioned LocalStorage/InMemory setup.
- [`src/ui/GameView.ts`](src/ui/GameView.ts) — model-driven, virtualized DOM renderer.
- [`DX_AUDIT.md`](DX_AUDIT.md) — API friction and framework follow-ups discovered while building the example.

## Tests

The test suite covers domain rules, reference-preserving no-ops, local rather than full-board line scanning, one commit per Effect batch, the complete runtime path, Destination suppression on no-op, v1 migration, debounce/coalescing, reload, hydration/save failure isolation and TypeScript/JavaScript codegen parity.
