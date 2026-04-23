# Branch Changelog: feat-codegen-eta-template-engine → main

## Summary

This branch delivers a major overhaul of `@yantrix/codegen`, replacing the
legacy inline string-concatenation serializers with a hierarchical **Eta
template engine**, and merges the `feat-internals-context` refactor that
changes how automata-internal variables are exposed to generated context
reducers.

---

## Breaking Changes

### `@yantrix/codegen` — Eta template engine

The code-generation backend was rewritten from scratch. Instead of assembling
output via serializer classes with inline template strings (using `%PLACEHOLDER%`
syntax), the engine now uses [Eta](https://eta.js.org/) external `.eta` template
files composed through `include()` directives.

**Entry point is unchanged** — `generateAutomataFromStateDiagram()` signature
and behaviour are preserved. Only the internal implementation differs.

### `@yantrix/functions` — Removed `internalFunctions` state/action closures

`packages/functions/src/internals.ts` was deleted. The following runtime
closures are **no longer exported**:

- `internalFunctions.currentStateId(cls)`
- `internalFunctions.currentStateName(cls, dict)`
- `internalFunctions.currentActionId(cls)`
- `internalFunctions.currentActionName(cls, dict)`
- `internalFunctions.currentCycle(cls)`

These are now injected at **codegen time** as direct runtime expressions inside
context reducers (see "Internals context injection" below).

`internalFunctions` still exists and exports `{ currentTimestamp, currentTime, random, weightedRandom }`.

---

## New Features

### Eta template engine (`@yantrix/codegen`)

- All code generation is now driven by `.eta` template files under
  `packages/codegen/src/core/templates/`.
- Template hierarchy: `js/module.eta` and `ts/module.eta` are the root entry
  points; they compose `shared/`, `js/`, and `ts/` sub-templates.
- Post-build step (`copyTemplates.sh`) copies templates to `dist/templates/`
  so they are available at runtime.

### Template consolidation

- Reduced template count from **120 → 62 files** by inlining all
  independent templates under 10 LoC into their same-level `module.eta`
  files, and collapsing single-include pass-through modules.

### Internals context injection (`refactor(internals)!`)

Instead of registering internal functions in the `FunctionDictionary` at
runtime, codegen now injects automata-internal values as direct expressions
inside context reducers:

| Yantrix expression | Generated expression |
|---|---|
| `currentEpoch()` | `getEpoch()` |
| `currentStateId()` | `automata.state` |
| `currentStateName()` | `Object.keys(statesDictionary).find(...)` |
| `currentActionId()` | `automata.lastAction` |
| `currentActionName()` | `Object.keys(actionsDictionary).find(...)` |
| `currentCycle()` | `automata.currentCycle` |

`getEpoch()` / `incrementEpoch()` are module-level functions defined in the
generated file; the `epoch` counter is global across all automata instances.

### Cycle counter moved to base class

`GenericAutomata.dispatch()` now calls `this.incrementCycle()` directly
(previously called from the generated rootReducer). The generated rootReducer
no longer emits `this.incrementCycle()`.

### Action hash collision fix

Fixed a bug where `[*] --> State: ActionA` and `AnotherState --> State: ActionB`
targeting the same state caused `ActionB` to be silently dropped because the
`actionToStartStateMatrix` spread overwrote existing `actionsPath` entries.
Transitions are now merged rather than replaced.

### New `IInternalsContext` types (`@yantrix/automata`)

Added `packages/automata/src/types/internalsContext.ts` with:
- `ILoopInternalsContext` — `currentEpoch`
- `IAutomataInternalsContext` — `currentStateId`, `currentStateName`, `currentCycle`
- `IActionInternalsContext` — `currentActionId`, `currentActionName`
- `IInternalsContext` — combines all three

---

## Other Changes

- **`@yantrix/react`**: Migrated tests from deprecated React 18 `act()` to
  `@testing-library/react`.
- **`comparison/01-feedback-machine`**: Added yantrix implementation alongside
  the existing xstate version, with smoke tests.
- **`examples/`**: Removed stale pre-generated automata fixtures (they are
  regenerated at build time).
- **Build chain**: Updated `turbo.json`, root `package.json` scripts, and
  `pnpm-lock.yaml` to support the new build order and example packages.
- **`packages/yantrix-parser`**: Normalized generated grammar/module files to
  LF line endings.
