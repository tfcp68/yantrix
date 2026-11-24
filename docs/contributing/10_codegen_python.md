---
title: Python Dialect Template Reference
---

# Python Dialect Template Reference

Python generates a single self-contained `.py` file. Built-in functions are concatenated
from `packages/functions/src/python/` at build time. There are no external dependencies -
only Python standard library (`math`, `random`, `typing`) is used.

**`it.python` object** (built in `PythonCodegen.buildTemplateModel()`):

```typescript
python: {
  builtins: string,            // filtered builtins from builtins.py.tpl (only functions used in diagram;
                               // unfiltered when inject file is provided)
  eventBusRuntime: string,     // contents of event_bus.py.tpl (_EventBus, _EventAdapter classes)
  functionDict: Array<{        // filtered to only functions used in the diagram
                               // (all functions emitted when inject file is provided)
    key: string;               // Yantrix key (e.g. 'coalesce')
    pyName: string;            // Python binding (e.g. 'coalesce' or '_if')
  }>,
  snakeName: string,           // snake_case factory name (e.g. 'traffic_light')
  initialContext: Record<string, null>,  // all context keys initialised to None
  reducers: Array<{
    stateValue: number;
    bodyLines: string[];       // Python assignment lines for _result dict
  }>,
  transitions: Array<{         // action_to_state_from_state_dict structure
    fromStateValue: number;
    actions: Array<{
      actionValue: number;
      targetStateValues: number[];
    }>;
  }>,
  defaultContextLines: string[],  // Python lines for _get_default_context body
  defines: Array<{             // user define/fn() => expr directives
    identifier: string;
    args: string[];
    body: string;              // Python lambda body expression
  }>,
  injectedCode: string | null, // raw .py inject file content, or null
  events: {
    hasEvents: boolean;        // true if any emitters or listeners present
    emitters: Array<{
      stateId: string;
      stateValue: number;
      events: Array<{ eventIdentifier: string; metaLines: string[] }>;
    }>;
    listeners: Array<{
      eventIdentifier: string;
      actionName: string;
      payloadLines: string[];
    }>;
  },
}
```

**Entry: `python/module.eta`** (7 includes in order):

| Step | Template | Purpose |
|------|----------|---------|
| 1 | `python/runtime/module` | Emits `it.python.builtins` + `it.python.eventBusRuntime` (pure-Python built-ins and event classes) |
| 2 | `python/forks/module` | Fork/predicate helpers |
| 3 | `python/dictionaries/module` | `states_dictionary`, `actions_dictionary`, `action_to_state_from_state_dict`, `event_dictionary` |
| 4 | `python/functions/module` | `function_dictionary`, lambda defines, injected code |
| 5 | `python/context/module` | `_reducer_N()` functions, `reducer` dict, `_get_default_context()` |
| 6 | `python/factory/module` | Helper functions + `create_<name>()` factory (includes event adapter setup inside body) |
| 7 | `python/events/bus/module` | Module-level `create_event_bus()` function |

**Event adapter sub-templates** (included by `factory/module` and `events/bus/module`):

```text
python/events/adapter/module.eta        - creates _EventAdapter() or None inside factory body
python/events/adapter/emit/entry.eta    - one add_event_emitter() call per emitting state
python/events/adapter/listen/entry.eta  - one add_event_listener() call per subscribed event
python/events/bus/module.eta            - create_event_bus(bus_id, factories) at module level
python/runtime/event_bus.py.tpl         - _EventBus and _EventAdapter class definitions
```

**Module-level exports:**

| Export | Description |
|--------|-------------|
| `states_dictionary` | `{ 'StateName': hash, ... }` |
| `actions_dictionary` | `{ 'ActionName': hash, ... }` |
| `event_dictionary` | `{ 'EventName': hash, ... }` |
| `actions_map`, `states_map` | Identity name dicts |
| `action_to_state_from_state_dict` | Nested `{ fromState: { action: { 'state': [targets] } } }` |
| `function_dictionary` | `{ 'fnName': callable, ... }` |
| `reducer` | `{ stateValue: _reducer_N, ... }` |
| `get_state(name)` | Lookup state value by name |
| `get_action(name)` | Lookup action value by name |
| `create_action(name, payload)` | Build action payload dict |
| `has_state(instance, state_value)` | Check FSM state |
| `create_<name>()` | Factory returning instance dict |
| `create_event_bus(bus_id, factories)` | Wires N automatas to a shared `_EventBus`; returns `(bus, automatas, cleanup)` |

**Instance shape** (dict returned by `create_<name>()`):

```python
{
    'state':         lambda: _state[0],
    'context':       lambda: dict(_context[0]),
    'last_action':   lambda: _last_action[0],
    'current_cycle': lambda: _current_cycle[0],
    'dispatch':      dispatch,
    'get_context':   get_context,
    'pause':         pause,
    'resume':        resume,
    'enable':        enable,
    'disable':       disable,
    'destroy':       destroy,
    'event_adapter': event_adapter,  # _EventAdapter instance, or None if no events
}
```

## Python runtime parity plan

Generated Python already wires multiple FSMs to one bus with `create_event_bus()`. The
`eventBusOrder` codegen option defaults to `fifo` and accepts `lifo`. If A and B are
queued together and the first handler emits C, Python delivers A, B, C in FIFO mode
and B, C, A in LIFO mode. The codegen tests execute both traces in Python.

The Python bus currently calls the adapter after dispatching an action. For example, a
paused receiver can emit its old state's event, then resume and enter its new state
without emitting the corresponding event. The first step below addresses that gap.

The following work brings the generated runtime up to the TypeScript model and effect contracts.

| Step | Implementation | Acceptance test |
| --- | --- | --- |
| 1. Committed events | Wire adapter emissions to committed FSM transitions, including direct dispatch and queued actions consumed on resume. | A paused, disabled, or ignored action produces no immediate event. An explicit self-transition and a replayed transition each emit once. |
| 2. Shared model and effects | Add an application model store with subscriptions and an effect scheduler. Run matching effects from all registered matrices in registration and declaration order. | Two registered matrices handle the same event. Returning the original snapshot preserves its identity. A failed effect leaves the model intact and a later batch succeeds. |
| 3. Loop and slice lifecycle | Connect committed emissions to the scheduler through one shared bus. Register and unregister slice machines and effect matrices together. Commit after the whole cascade drains, then notify matching destinations. | Run the TypeScript Checkout/Audit scenario in generated Python for both orders. Both slices handle `OrderPlaced`, a follow-up joins the same commit, observers see one final snapshot, and unregistering Audit removes its effects. |

Once TypeScript supports generating effect matrices and slice factories from diagrams,
extend the Python generator to emit the equivalent wiring. Run the Checkout/Audit fixture
with that generated wiring as well as with the manually registered matrices.

Use the same input diagrams and expected event traces, snapshots, and subscriber counts for
TypeScript and Python. Keep the Python coverage in `packages/codegen-tests/src/python.test.ts`
so it exercises the emitted module in a Python interpreter.
