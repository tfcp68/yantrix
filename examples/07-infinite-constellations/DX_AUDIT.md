# Infinite Constellations DX audit

This audit records friction found while consuming the P0–P4 API as an application author. It does not bypass the public runtime: the example uses generated artifacts and `@yantrix/core` only.

## What worked well

- The generated `createInfiniteConstellationsSlice()` removes all manual FSM/Event Adapter/Effect Matrix registration.
- `whenModel()` preserves the model reference for invalid moves, which automatically suppresses commits, persistence and rendering.
- `composeModelTransformers()` maps naturally to placement → line resolution → turn rotation.
- `CoreLoop.whenIdle()` makes the complete command path deterministic in tests.
- Storage is independent from the game model. The same composition root uses LocalStorage in the browser, InMemory in tests and a deliberately failing adapter for failure tests.
- A versioned decorator plus `hydrateModel()` makes migration happen before any observer sees the model.

## Glue and casts

- The application supplies three domain Model Transformers to the generated Slice. This is intentional because the diagram declares bindings, not application business expressions.
- One Source adapter class and one Destination adapter factory are required. Their lifecycle is owned by `CoreLoop`.
- Generated Effect Meta fields are `unknown`; the composition root performs one explicit numeric normalization function before calling domain rules.
- No application cast is needed for the generated Slice, Effect Matrix, `ModelStore`, `EffectScheduler`, Storage binding or Destination model.
- The generated factory itself widens its narrow Effect Matrix to the framework-wide numeric Event space. That cast lives in generated code rather than application glue.

## Framework follow-ups

### Effects declared in `+ByPass` states are not observable

Generated reducers collapse a bypass state to its final state before `CoreLoop` asks the Event Adapter for emitted Events. An Effect emitter attached to the transient state therefore cannot be selected through the current generated Slice path.

The example uses the same stable-state transition matrix as the documented Todo example. A framework improvement should either collect emitted Events for every intermediate transition or reject `effect/` declarations on bypass states during codegen with a precise diagnostic.

### Browser Sources require an explicit pump

DOM commands are enqueued in a proper `IDataSource`, but a driver still has to call `CoreLoop.tick()` and then await `whenIdle()`. The example wraps this in `flushCommands()`. A future reactive Source driver could reduce this repeated browser glue without changing the deterministic manual API.

### Destination construction is verbose

A synchronous model renderer currently needs `createDataDestinationAdapter()(NamedDataDestination)`, an async resolver and `createTrigger()`. A small `createModelDestination()` convenience factory would preserve the contract while removing generic boilerplate.

### Generated files and repository linting

Generated example artifacts do not follow the repository's handwritten-code style. P5 added `examples/*/src/generated/**` to ESLint ignores so codegen output is treated consistently with other generated fixtures.

Generated class IDs currently include the generation timestamp, so an unchanged diagram still produces a different file on every run. The example therefore follows the repository-wide `**/generated` ignore contract and creates both artifacts in `predev`, `pretest` and `prebuild`. A framework follow-up should derive stable generated IDs from the diagram/class identity, leaving per-instance uniqueness to runtime instances.

### Root cleanup crossed into dependencies

The former `rimraf --glob **/dist` pre-commit cleanup also matched `vitepress/node_modules/typedoc/dist`, corrupting the installed TypeDoc CLI. Broad recursive patterns under comparison workspaces could also follow package-manager links into the pnpm store. P5 scopes every cleanup pattern to known output/source/test roots. Installed dependencies are no longer traversed or modified.

## Manual gameplay/reload checklist

- [ ] Place stars at positive and negative coordinates.
- [ ] Pan away and return to the last move.
- [ ] Complete horizontal, vertical and both diagonal lines.
- [ ] Complete two crossing lines with one placement and receive two points/Nova charges.
- [ ] Cast Nova on an adjacent rival star; verify invalid targets are no-ops.
- [ ] Reload and verify the board, scores, charges, turn and current player.
- [ ] Reset with two-step confirmation and reload the empty universe.
- [ ] Disable LocalStorage and verify the visible memory-fallback status.
- [ ] Simulate a Storage quota error and verify gameplay continues with a visible warning.
- [ ] Check desktop and narrow viewport layouts.
