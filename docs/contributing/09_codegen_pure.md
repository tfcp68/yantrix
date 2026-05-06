---
title: PureJS / PureTS Dialect Template Reference
---

# PureJS / PureTS Dialect Template Reference

PureJavaScript and PureTypeScript generate self-contained output with no imports from
`@yantrix/core`. All built-in functions are bundled inline at build time by
`scripts/buildBuiltins.mjs`.

PureTypeScript runs the same code generation as PureJavaScript (same `buildTemplateModel`,
same JS templates), and additionally generates a `.d.ts` declaration file from
`pure-ts/declarations.eta`.

The `it` object extends the JS/TS base with one extra field:

```
it = {
  // ...all base JS/TS fields...
  builtins,    // string - pre-bundled @yantrix/functions source, inlined verbatim
}
```

**Entry: `pure-js/module.eta`** (9 includes in order):

| Step | Template | Purpose |
|------|----------|---------|
| 1 | `js/shared/imports/namespace` | Namespace import (only when `functionFilePath` is set) |
| 2 | `<%~ it.builtins %>` | Inlined functions bundle (raw string, no include) |
| 3 | `pure-js/runtime/module` | `createFunctionRegistry()`, `createEventAdapter()` |
| 4 | `pure-js/functions/module` | Function dictionary, user defines, inject registrations |
| 5 | `js/shared/forks/module` | Predicate map for fork/choice states |
| 6 | `pure-js/dictionaries/module` | `statesDictionary`, `actionsDictionary`, `eventDictionary`, `epoch`/`incrementEpoch`/`getEpoch` |
| 7 | `pure-js/events/module` | `eventAdapter`, `createEventBus()` factory |
| 8 | `js/context/module` | `reducer`, `getDefaultContext` (shared with class-based) |
| 9 | `pure-js/factory/module` | `create<ClassName>()` factory + `getState`/`getAction`/`createAction`/`hasState` helpers |

**Entry: `pure-ts/declarations.eta`** (`.d.ts` only):

- Declares all exports: `statesDictionary`, `actionsDictionary`, `eventDictionary`, helpers, factory, `createEventBus`
- Defines `T<ClassName>Instance` type with all instance methods and getters
- Defines `TActions<ClassName>` union type

**Module-level exports:**

| Export | Type | Description |
|--------|------|-------------|
| `statesDictionary` | `Record<string, number>` | State name to hash mapping |
| `actionsDictionary` | `Record<string, number>` | Action name to hash mapping |
| `eventDictionary` | `Record<string, number>` | Event name to hash mapping |
| `actionsMap`, `statesMap` | `Record<string, string>` | Identity name maps |
| `functionDictionary` | `{ get, register, call, has }` | Inline function registry |
| `epoch` | `{ val: number }` | Shared epoch counter (module-level) |
| `incrementEpoch()` | `() => void` | Increments epoch on each dispatch |
| `getEpoch()` | `() => number` | Returns current epoch value |
| `getState(name)` | `(name: string) => number` | Lookup state value by name |
| `getAction(name)` | `(name: string) => number` | Lookup action value by name |
| `createAction(name, payload)` | `(name, payload) => { action, payload }` | Build action payload |
| `hasState(instance, state)` | `(inst, name) => boolean` | Check FSM state by name |
| `createEventBus(id, factories)` | `(id, Record<string, factory>) => [EventBus, automatas, cleanup]` | Wire FSM instances to a shared event bus |
| `create<ClassName>()` | `() => Instance` | Factory function |
| `default` | same as factory | Re-export of factory |
