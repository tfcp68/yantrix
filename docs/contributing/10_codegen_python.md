---
title: Python Dialect Template Reference
---

# Python Dialect Template Reference

Python generates a single self-contained `.py` file. Built-in functions are concatenated
from `packages/functions/src/python/` at build time. There is no class, no import of
external packages beyond `pydash`.

**`it.python` object** (built in `PythonCodegen.buildTemplateModel()`):

```typescript
python: {
  builtins: string,            // contents of builtins.py.tpl (pydash-based functions)
  functionDict: Array<{        // all function_dictionary entries
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
}
```

**Entry: `python/module.eta`** (5 includes in order):

| Step | Template | Purpose |
|------|----------|---------|
| 1 | `python/runtime/module` | Emits `it.python.builtins` inline (pydash-based built-in functions) |
| 2 | `python/functions/module` | `function_dictionary = {...}`, lambda defines, injected code |
| 3 | `python/dictionaries/module` | `states_dictionary`, `actions_dictionary`, `action_to_state_from_state_dict` |
| 4 | `python/context/module` | `_reducer_N()` functions, `reducer` dict, `_get_default_context()` |
| 5 | `python/factory/module` | Helper functions + `create_<name>()` factory |

**Module-level exports:**

| Export | Description |
|--------|-------------|
| `states_dictionary` | `{ 'StateName': hash, ... }` |
| `actions_dictionary` | `{ 'ActionName': hash, ... }` |
| `actions_map`, `states_map` | Identity name dicts |
| `action_to_state_from_state_dict` | Nested `{ fromState: { action: { 'state': [targets] } } }` |
| `function_dictionary` | `{ 'fnName': callable, ... }` |
| `reducer` | `{ stateValue: _reducer_N, ... }` |
| `get_state(name)` | Lookup state value by name |
| `get_action(name)` | Lookup action value by name |
| `create_action(name, payload)` | Build action payload dict |
| `has_state(instance, state_value)` | Check FSM state |
| `create_<name>()` | Factory returning instance dict |

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
}
```
