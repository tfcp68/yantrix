# Changelog

## Table of Contents

- [v0.4.0](#v040)
  - [Breaking Changes](#breaking-changes-3)
  - [New Features](#new-features-3)
  - [Other Changes](#other-changes-3)
- [v0.3.0](#v030)
  - [Breaking Changes](#breaking-changes-2)
  - [New Features](#new-features-2)
  - [Other Changes](#other-changes-2)
- [v0.2.1](#v021)
  - [New Features](#new-features-1)
  - [Fixes](#fixes-1)
- [v0.2.0](#v020)
  - [Breaking Changes](#breaking-changes-1)
  - [New Features](#new-features-0)
  - [Other Changes](#other-changes-0)
- [v0.1.0](#v010)
  - [Breaking Changes](#breaking-changes-0)
  - [New Features](#new-features)
  - [Other Changes](#other-changes)
- [v0.0.2](#v002)
- [v0.0.1](#v001)

---

## [v0.4.0]

This release delivers a major overhaul of `@yantrix/codegen`, replacing the legacy
inline string-concatenation serializers with a hierarchical **Eta template engine**,
and merges the `feat-internals-context` refactor that changes how automata-internal
variables are exposed to generated context reducers.

### Breaking Changes

#### `@yantrix/codegen` - Eta template engine

The code-generation backend was rewritten from scratch. Instead of assembling output
via serializer classes with inline template strings (using `%PLACEHOLDER%` syntax), the
engine now uses [Eta](https://eta.js.org/) external `.eta` template files composed
through `include()` directives.

**Entry point is unchanged** - `generateAutomataFromStateDiagram()` signature and
behaviour are preserved. Only the internal implementation differs.

#### `@yantrix/functions` - Removed `internalFunctions` state/action closures

`packages/functions/src/internals.ts` was deleted. The following runtime closures are
**no longer exported**:

- `internalFunctions.currentStateId(cls)`
- `internalFunctions.currentStateName(cls, dict)`
- `internalFunctions.currentActionId(cls)`
- `internalFunctions.currentActionName(cls, dict)`
- `internalFunctions.currentCycle(cls)`

These are now injected at **codegen time** as direct runtime expressions inside context
reducers (see "Internals context injection" below).

`internalFunctions` still exists and exports `{ currentTimestamp, currentTime, random, weightedRandom }`.

### New Features

#### Eta template engine (`@yantrix/codegen`)

- All code generation is now driven by `.eta` template files under
  `packages/codegen/src/core/templates/`.
- Template hierarchy: `js/module.eta` and `ts/module.eta` are the root entry points;
  they compose `shared/`, `js/`, and `ts/` sub-templates.
- Post-build step (`copyTemplates.sh`) copies templates to `dist/templates/` so they
  are available at runtime.

#### Template consolidation

- Reduced template count from **120 to 62 files** by inlining all independent templates
  under 10 LoC into their same-level `module.eta` files, and collapsing single-include
  pass-through modules.

#### Internals context injection

Instead of registering internal functions in the `FunctionDictionary` at runtime,
codegen now injects automata-internal values as direct expressions inside context
reducers:

| Yantrix expression | Generated expression |
|---|---|
| `currentEpoch()` | `getEpoch()` |
| `currentStateId()` | `automata.state` |
| `currentStateName()` | `Object.keys(statesDictionary).find(...)` |
| `currentActionId()` | `automata.lastAction` |
| `currentActionName()` | `Object.keys(actionsDictionary).find(...)` |
| `currentCycle()` | `automata.currentCycle` |

`getEpoch()` / `incrementEpoch()` are module-level functions defined in the generated
file; the `epoch` counter is global across all automata instances.

#### Cycle counter moved to base class

`GenericAutomata.dispatch()` now calls `this.incrementCycle()` directly (previously
called from the generated `rootReducer`). The generated `rootReducer` no longer emits
`this.incrementCycle()`.

#### Action hash collision fix

Fixed a bug where `[*] --> State: ActionA` and `AnotherState --> State: ActionB`
targeting the same state caused `ActionB` to be silently dropped because the
`actionToStartStateMatrix` spread overwrote existing `actionsPath` entries. Transitions
are now merged rather than replaced.

#### New `IInternalsContext` types (`@yantrix/automata`)

Added `packages/automata/src/types/internalsContext.ts` with:

- `ILoopInternalsContext` - `currentEpoch`
- `IAutomataInternalsContext` - `currentStateId`, `currentStateName`, `currentCycle`
- `IActionInternalsContext` - `currentActionId`, `currentActionName`
- `IInternalsContext` - combines all three

### Other Changes

- **`@yantrix/react`**: Migrated tests from deprecated React 18 `act()` to
  `@testing-library/react`.
- **`comparison/01-feedback-machine`**: Added yantrix implementation alongside the
  existing xstate version, with smoke tests.
- **`examples/`**: Removed stale pre-generated automata fixtures (they are regenerated
  at build time).
- **Build chain**: Updated `turbo.json`, root `package.json` scripts, and
  `pnpm-lock.yaml` to support the new build order and example packages.
- **`packages/yantrix-parser`**: Normalized generated grammar/module files to LF line
  endings.

---

## [v0.3.0]

This release rewrites `@yantrix/yantrix-parser` on top of the Langium grammar toolchain,
replacing the hand-rolled Jison parser with a generated, type-safe grammar and module
pipeline. `@yantrix/automata` gains a formal `setEventAdapter` API, and `@yantrix/core`'s
`CoreLoop` is updated to use it. Several method and parameter renames break the public API.

### Breaking Changes

- `reduceQueue()` renamed to `stateWithContext()` in the automata dispatch interface -
  callers assembling the next state-context pair must update the call site.
- The action parameter in dispatch-related signatures was renamed from `action` to
  `actionWithPayload` throughout `@yantrix/automata` and `@yantrix/core`.
- Generated automata and example packages updated to import from `@yantrix/core` instead
  of package-local paths - any manually maintained generated files must be regenerated.

### New Features

#### Langium parser rewrite (`@yantrix/yantrix-parser`)

The entire parser was rewritten using [Langium](https://langium.org/). The grammar is
now declared in `.langium` files, and the module, AST types, and parser are all
generated by the Langium toolchain. This resolves a class of ambiguity and
operator-precedence bugs that were difficult to fix in the Jison grammar, and provides
a typed AST for downstream consumers.

#### `setEventAdapter` on `GenericAutomata`

`GenericAutomata` now exposes a `setEventAdapter(adapter)` method for registering or
replacing the event adapter at any point in the automata lifecycle. Previously the
adapter field had to be assigned directly. `CoreLoop` was updated to call
`setEventAdapter` instead of writing the field, and its event adapter handling lifecycle
was improved to correctly tear down and re-initialize when the adapter changes.

#### FSM type guards and initialization

`fix: refactor FSM initialization and type guards` - the factory functions for creating
FSM instances now perform stricter runtime type guards, preventing invalid initial states
from being accepted silently.

#### Context typing generics in `@yantrix/react`

`useFSM` and `useFSMWithSelector` now accept a context type generic parameter, so the
inferred type of `context` inside selector functions no longer falls back to `unknown`.

#### Parser test coverage

- Enhanced `keyItem` handling tests with new fixtures covering edge cases.
- Parser tests extended with additional cases for context declarations and key item
  defaults.
- `validateFunctionNesting` call added to the parser validation pass to reject
  illegally nested function expressions at parse time.

### Other Changes

- **docs**: Architecture diagrams for the Yantrix runtime event flow and code generation
  pipeline added to the docs site (two separate PRs, `#44` and `#45`).
- **fix**: Removed an unnecessary `--host` flag from example `package.json` dev-server
  scripts.
- **fix**: Updated generated automata imports in the React example package to use
  `@yantrix/core`.

---

## [v0.2.1]

A focused patch release for `@yantrix/react`. The `useFSM` hook gains a selector
variant and versioned store updates; `GenericAutomata` gets initial context support.
Several type-level fixes round out the React integration.

### New Features

#### `useFSMWithSelector` (`@yantrix/react`)

New hook for memoized sub-state selection from FSM context. Accepts a selector function
and only triggers re-renders when the selected slice of context changes, not on every
dispatch. Internally keyed on `currentCycle` - subscribers re-render only when the
automata cycle counter increments, not on every render pass.

#### Initial context on `GenericAutomata`

`GenericAutomata` now accepts an `initialContext` object at construction time and merges
it into the context of the first state. This allows pre-populating context before the
first dispatch without a synthetic initial action.

### Fixes

- **`fix: add dispatchWrapper`** - dispatch in `useFSM` and `useFSMWithSelector` is now
  wrapped to guarantee that context-change detection is bypassed for void/no-op actions,
  eliminating spurious re-renders.
- **`fix: removing context change checks in dispatchWrapper`** - a prior check inside
  the wrapper caused unnecessary re-renders when dispatch returned a context object that
  was referentially different but structurally identical.
- **`fix: refine type definitions for dispatch`** - `dispatch` in `useFSM` and
  `useFSMWithSelector` is now typed to accept the full union of valid action types.
- **`fix(core): reserved internal function name check`** - codegen now rejects automata
  definitions that declare a user function with the same name as a built-in internal
  (`currentStateId`, `currentCycle`, etc.); adds `automata` as an implicit argument to
  generated reducers.
- **`fix: separate store per FSM`** - each `useFSM` call now creates an isolated Zustand
  store; previously all instances shared a single store, causing cross-automata state
  leaks.
- **`build(deps): remove use-sync-external-store`** - the explicit polyfill dependency
  was removed from `@yantrix/react`; React 18's built-in version is used instead.

---

## [v0.2.0]

This release introduces `CoreLoop` and the event bus integration layer in
`@yantrix/core`, alongside `DataSource`/`DataDestination` adapter types for wiring
automata to external data endpoints. `EventBusAwareEventAdapter` is removed and replaced
by `AutomataEventAdapter`. Two new examples (clock and weather report) demonstrate the
full CoreLoop-driven flow.

### Breaking Changes

#### `EventBusAwareEventAdapter` removed (`@yantrix/core`)

`EventBusAwareEventAdapter` has been removed from the public exports of `@yantrix/core`
and from the `buildAdapter` factory function. Replace usages with `AutomataEventAdapter`,
which provides the same contract with a cleaner lifecycle.

### New Features

#### `CoreLoop` (`@yantrix/core`)

New class that drives a `GenericAutomata` instance on a repeating event loop, connecting
it to an `EventBus`. Key methods:

- `publishToBus(event, meta?)` - dispatches an event onto the bus from within the loop
  body.
- Events emitted during a state transition are queued internally and re-dispatched on
  the next tick, preventing re-entrancy.

#### `DataSource` and `DataDestination` adapters (`@yantrix/core`)

Two new adapter types for connecting automata to external read/write data endpoints.
`DataSource` feeds data into an automata's action payload; `DataDestination` receives
context snapshots on each dispatch. Both integrate with `buildAdapter`.

#### `uniqId` utility

`waitForState`, `waitForEventOnce`, and related async helpers received JSDoc annotations;
a `uniqId()` helper was added for generating stable correlation IDs used inside
`CoreLoop`.

#### Examples

- **clock example** - demonstrates a time-based automata driven by `CoreLoop`, updating
  a context field on each tick.
- **weather report example** - end-to-end walkthrough of `CoreLoop`, `EventBus`,
  `DataSource`, and context reducers implemented as a `WeatherReportAutomata`. Includes
  packet-level automata tests for `WeatherReportAutomata` and `CoreLoop` behavior with a
  stubbed automata.

### Other Changes

- **`fix: internals in TS codegen`** - TypeScript-target codegen now correctly emits
  references to `internalFunctions` closures; the JS target was already correct.
- **`fix: test race condition`** - an async teardown race in `CoreLoop` tests was
  resolved by awaiting the loop's stop promise before assertions.
- **`fix: UI_RENDER event type`** - the event payload type was changed from an empty
  object literal to a plain `object` to prevent spurious type errors in consumers.
- **`docs: architecture`** - the architecture section of the docs site was expanded with
  more detail on the event bus and adapter lifecycle.

---

## [v0.1.0]

This release establishes `@yantrix/core` as a dedicated package, expands the built-in
function library with internal state introspection functions and Python-parity math/stats
functions, and adds `inject()` syntax to the Yantrix DSL so raw host-language expressions
can be embedded in context reducers. The VitePress docs site gains full-screen Mermaid
diagram support.

### Breaking Changes

#### `@yantrix/core` package introduced

Utilities that were previously scattered across `@yantrix/automata` and `@yantrix/codegen`
are now consolidated into a dedicated `@yantrix/core` package. Consumers that imported
from the old locations must update their import paths.

### New Features

#### Internal functions (`@yantrix/functions`)

A new `internalFunctions` export provides runtime closures for reading automata-internal
state from within context reducers:

- `currentStateId(cls)` - returns the numeric state enum value of the active state
- `currentStateName(cls, dict)` - returns the string key of the active state
- `currentActionId(cls)` - returns the numeric action enum value of the last dispatched
  action
- `currentActionName(cls, dict)` - returns the string key of the last dispatched action
- `currentCycle(cls)` - returns the current dispatch cycle counter
- `currentTimestamp()`, `currentTime()` - wall-clock helpers
- `random()`, `weightedRandom(weights)` - moved from math category into internals

`GenericAutomata` gains two new fields to support these closures:

- `currentCycle` - incremented on every `dispatch()` call
- `lastAction` - stores the most recently dispatched action ID after each transition

A module-level epoch counter is introduced with `getEpoch()` / `incrementEpoch()`
wrappers; the epoch is global across all automata instances in a module.

#### `inject()` syntax in the Yantrix DSL (`@yantrix/yantrix-parser`, `@yantrix/codegen`)

A new `inject/` prefix in the Yantrix grammar allows embedding raw host-language
expressions directly into context reducers. The codegen backend emits the injected
expression verbatim into the generated reducer body, bypassing the normal function-call
translation. Additional parser tests cover inject expressions in state note declarations.

#### Built-in function library expansion (`@yantrix/functions`)

- **Python-parity replacements**: TypeScript implementations of `pydash`/`lodash`
  functions replaced with custom pure-TS versions for tree-shaking compatibility.
- `refactor(maths): mult()` - fixed multiplication overloads for mixed-type arguments.
- `perf: function performance` - hot-path arithmetic and predicate functions optimized.
- `fix: sumProduct` - incorrect accumulation when argument lists contained mixed numeric
  types.
- `fix(functions): lookup` - two separate edge-case fixes for the lookup predicate when
  the search value is `null` or the list contains object entries.
- `chore(functions): len` - `len()` now throws on non-iterable arguments instead of
  returning `NaN`.
- `choose()` added to the conditionals category.
- New test files: `maths.test.ts`, `special_maths.test.ts`, `predicates.test.ts`,
  `transformers.test.ts`, `conditionals.test.ts`.

#### VitePress full-screen diagrams

Mermaid diagrams in the docs site now render with a full-screen toggle button,
making large state diagrams usable in the documentation.

### Other Changes

- **`fix: node < 20 compatibility`** - replaced Node 20-only `Array.prototype.at()` and
  `structuredClone()` calls in the parser with compatible equivalents.
- **`fix: TypeScript declaration inference`** - the inferred return type of the default
  export in several packages triggered `the inferred type of 'default' cannot be named
  without a reference to '*'`; fixed by adding explicit type annotations.

---

## [v0.0.2]

Post-release documentation and CI hardening. No API changes.

- **`feat: @yantrix/cli readme`** - added a simple usage scenario with a worked example
  showing the full `yantrix codegen` invocation.
- **`feat: @yantrix/codegen readme`** - expanded with more example code illustrating
  generated automata class structure.
- **`feat: npm badges`** - version and license badges added to each package readme for
  npm registry display.
- **`feat: set-swap-space in CI`** - added a swap-space provisioning step to the GitHub
  Actions check workflow to prevent out-of-memory failures on large monorepo builds.
- **`feat: concurrency groups in CI`** - workflows now cancel outdated runs for the same
  branch, preventing queue buildup on rapid pushes.
- **`fix: TypeScript declaration inference`** - `the inferred type of 'default' cannot
  be named without a reference to '*'` resolved with explicit type annotations on
  affected exports.
- **`fix: remove unnecessary concurrency`** from the test pipeline step that was causing
  sequential test shards to run in parallel unintentionally.
- **`fix: replace image paths with URLs`** in package readmes so images render correctly
  on the npm registry (which does not serve relative paths).
- **`fix: add missing deps installation`** step added to the CI workflow that was running
  before the `pnpm install` step completed.

---

## [v0.0.1]

Initial public release. Yantrix is a TypeScript framework for building automata-driven
applications through declarative code generation. Business logic is expressed as
Mermaid state diagrams annotated with a purpose-built DSL; the CLI and codegen engine
emit fully-typed, runnable automata classes. The framework ships ten packages covering
the FSM runtime, parser, code generator, CLI, function library, and integrations for
React and Redux.

### Packages

#### `@yantrix/automata` - FSM runtime

The execution engine for finite state machines. The central class is `GenericAutomata`,
constructed via the `createAutomata<StateType, ActionType, EventType, ContextType,
PayloadType, EventMetaType>()` factory function. Public API:

- **State and context**: `getState()`, `setState()`, `getContext()`, `setContext()`
- **Dispatch**: `dispatch(action)` - runs the action through the `rootReducer` and
  updates state and context atomically
- **Action queue**: `clearActionQueue()`, `collapseActionQueue()`, `consumeAction(count)`
  for batching and replaying action sequences
- **Lifecycle**: `enable()`, `disable()`, `pause()`, `resume()`, `isEnabled()`,
  `isPaused()`
- **Event adapter**: `getEventAdapter()`, `setEventAdapter()`
- **Function registry**: `getFunctionRegistry()`, `setFunctionRegistry()`

Supporting containers follow the Dictionary pattern: `ActionDictionary`,
`StateDictionary`, `EventDictionary`, `FunctionDictionary`. The automata itself is
assembled from composable mixins (`BasicValidatorContainer`, `BasicActionContainer`,
`BasicEventContainer`, etc.), so capabilities can be extended without modifying the base
class.

#### `@yantrix/codegen` - Code generation

Transforms a parsed `TStateDiagramMatrix` into a runnable automata class for multiple
target languages. Single entry point: `generateAutomataFromStateDiagram(diagram,
options)`. Options:

- `outLang: ModuleNames` - target language: `TypeScript` (default), `JavaScript`,
  `Python`, `Java`
- `constants` - JSON-stringified key-value pairs injected as typed constants into the
  generated file

State notes in the Mermaid diagram are parsed as Yantrix DSL declarations and compiled
into context reducer logic inside the generated class.

#### `@yantrix/functions` - Built-in function library

70+ pure functions for use inside Yantrix DSL expressions (context reducers, event
payload transforms). Categories:

- **Conditionals**: `if(condition, trueVal, falseVal)`, `case(...)`, `coalesce(...)`
- **Binary predicates**: `and(...)`, `or(...)`, `not(x)`, `none(...)`
- **Numeric predicates**: `isEven`, `isOdd`, `isInteger`, `isEqual`, `isGreater`,
  `isLess`, `isNegative`, `isPositive`
- **Lookup predicates**: `contains(collection, value)`, `has(obj, key)`, `isNull(x)`
- **Arithmetic**: `add`, `diff`, `mult`, `div`, `pow`, `inc`, `dec`, `neg`, `inv`,
  `mod`, `trunc`, `ceil`, `round`
- **Special math**: `sin`, `cos`, `sqrt`, `log`, `ln`, `lg`, `deg`, `rad`
- **Statistics**: `max`, `min`, `avg`, `med`, `sum`, `sumsq`, `sumProduct`
- **List transformers**: `len`, `lookup`, `indexOf`, `filterBy`, `find`, `left`, `right`
- **String transformers**: `substr`, `strlen`, `strLeft`, `strRight`, `strIndexOf`

#### `@yantrix/cli` - `yantrix codegen` command

Interactive CLI for diagram-to-code generation. Usage:

```
yantrix codegen [diagramFile]
  --language, -l    TypeScript | JavaScript | Python | Java
  --outfile, -o     output file path
  --className, -c   generated class name
  --constants, -j   JSON string of constants to inject
  --constantFile, -J  path to JSON constants file
  --eval, -e        evaluate a diagram string inline (no file needed)
  --verbose         verbose output
  --interactive, -i step-by-step interactive mode
```

#### `@yantrix/yantrix-parser` - Yantrix DSL

Jison-based parser for the Yantrix expression language used in state diagram notes.
Statement types: `INITIAL_STATE`, `CONTEXT_STATEMENT`, `EMIT_STATEMENT`,
`SUBSCRIBE_STATEMENT`, `DEFINE_STATEMENT`. Expressions support function calls, data
objects, conditionals, payload/context/constant references, and literal values.

#### `@yantrix/mermaid-parser` - Diagram parsing

Parses Mermaid state diagram syntax into a `TStateDiagramMatrix` - a typed AST of
states, transitions, and action chains that feeds the codegen pipeline.

#### `@yantrix/react` - React integration

`useFSM()` hook for integrating a `GenericAutomata` instance into a React component
tree, backed by a Zustand store for subscription and re-render scheduling.

#### `@yantrix/redux` - Redux integration

`connectReduxAutomata(id, automata, dispatch)` wires a `GenericAutomata` instance into a
Redux store. `useReduxAutomata(id)` retrieves the connected instance by ID. Middleware
translates automata state-transition events into Redux actions.

#### `@yantrix/utils`

Shared type casts, type guards, predicate helpers, and test fixtures used across the
monorepo.
