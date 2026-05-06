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
