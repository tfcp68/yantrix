---
title: Pure Dialects API
---

# Pure Dialects API

This page covers the generated API for `pure-javascript` and `pure-typescript` dialects.
These dialects emit self-contained output with no `@yantrix/core` or `@yantrix/automata` import in the generated file.
The `javascript` and `typescript` class-based API is documented in [Javascript API](150_JSAPI.html).
The `python` dialect API is documented in [Python API](170_pythonAPI.html).

---

## `generateAutomataFiles`

Multi-file dialects (`pure-javascript`, `pure-typescript`) require `generateAutomataFiles` instead of `generateAutomataFromStateDiagram`, because they emit more than one file.

```typescript
import { generateAutomataFiles } from '@yantrix/codegen';

const files: Record<string, string> = await generateAutomataFiles(diagram, {
  outLang: 'pure-javascript',
  className: 'TrafficLight',
});

// files = {
//   'TrafficLight.js': '...',   // automata + runtime, single self-contained file
// }
```

For `pure-typescript`:

```typescript
const files = await generateAutomataFiles(diagram, {
  outLang: 'pure-typescript',
  className: 'Counter',
});

// files = {
//   'Counter.js':   '...',  // runtime + automata logic
//   'Counter.d.ts': '...',  // TypeScript declarations
// }
```

Single-file output (all other dialects) can still use `generateAutomataFromStateDiagram`, which returns a `string`.

---

## Pure JavaScript / Pure TypeScript

### Module exports

Every generated file exports the following at module level:

```javascript
// Numeric id lookup
export const statesDictionary: Record<string, number>
export const actionsDictionary: Record<string, number>
export const eventDictionary: Record<string, number>

// Reverse (id -> name) maps
export const statesMap: Record<string, string>
export const actionsMap: Record<string, string>

// Function registry (Map-based, no class dependency)
export const functionDictionary: { get, register, call, has }

// Helpers
export function getState(name: string): number
export function getAction(name: string): number
export function createAction(name: string, payload: object | null): { action: number; payload: object | null }
export function hasState(instance: TFSMInstance, name: string): boolean

// Event bus factory
export function createEventBus(id: string, fsms: WeakMap): object
```

The factory function is also the default export:

```javascript
export default createClassName;
export function createClassName(): TFSMInstance
```

### Factory instance (`TFSMInstance`)

The factory returns a plain closure object (not a class instance):

```javascript
import { createTrafficLight, statesDictionary, actionsDictionary } from './TrafficLight.js';

const fsm = createTrafficLight();

fsm.state          // current state id (number, read-only)
fsm.lastAction     // last dispatched action id, or null
fsm.currentCycle   // dispatch count (number)

fsm.getContext()   // { state: number, context: Record<string, unknown> }
fsm.dispatch({ action: actionsDictionary.Switch, payload: {} })
   // returns { state, context }; updates fsm.state
```

### Lifecycle

```javascript
fsm.pause()        // queues future dispatches instead of processing them
fsm.resume()       // flushes the queue and resumes normal operation
fsm.disable()      // drops dispatches (queue not preserved)
fsm.enable()       // re-enables dispatch processing
fsm.destroy()      // clears internal queue and drops event adapter reference
```

### Event adapter

Each instance exposes an `eventAdapter` object for wiring up an event bus:

```javascript
const bus = createEventBus('app', new Map());

fsm.eventAdapter.addEventEmitter(bus)          // FSM listens to events from bus
fsm.eventAdapter.addEventListener(event, fn)   // attach a handler for a specific event id
```

### Pure TypeScript declarations

`pure-typescript` output includes a `.d.ts` file alongside the `.js` file.
The declarations expose typed versions of all module exports and the factory function:

```typescript
import type { createTrafficLight, TTrafficLightInstance } from './TrafficLight.js';

const fsm: TTrafficLightInstance = createTrafficLight();
```

State and action literal types are derived directly from the dictionaries:

```typescript
type TStateId = (typeof statesDictionary)[keyof typeof statesDictionary]
type TActionId = (typeof actionsDictionary)[keyof typeof actionsDictionary]
```
