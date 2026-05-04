---
title: Python API
---

# Python API

This page covers the generated API for the `python` dialect.
The `python` dialect emits a self-contained `.py` file with no npm or third-party package imports
in the generated code itself, but requires `pydash` at Python runtime.

The `javascript` and `typescript` class-based API is documented in [Javascript API](150_JSAPI.html).
The `pure-javascript` and `pure-typescript` functional API is documented in [Pure Dialects API](160_pureAPI.html).

---

## Naming conventions

Python output uses `snake_case` throughout. The `className` option is converted automatically:
`TrafficLight` becomes `traffic_light`.

```python
from traffic_light_generated import (
    create_traffic_light,
    states_dictionary,
    actions_dictionary,
)
```

---

## Module-level names

```python
states_dictionary   # dict[str, int]  - state name -> numeric id
actions_dictionary  # dict[str, int]  - action name -> numeric id
event_dictionary    # dict[str, int]

states_map          # dict[str, str]  - numeric id -> name
actions_map         # dict[str, str]

function_dictionary # dict[str, callable] - built-in + user-defined functions

def get_state(name: str) -> int: ...
def get_action(name: str) -> int: ...
def create_action(name: str, payload: dict | None) -> dict: ...
def has_state(instance: dict, name: str) -> bool: ...
```

---

## Factory and instance

The factory function returns a plain dict of callables (closure-based, no class):

```python
fsm = create_traffic_light()

fsm['state']()           # current state id (int)
fsm['last_action']()     # last dispatched action id, or None
fsm['current_cycle']()   # dispatch count (int)

fsm['get_context']()     # {'state': int, 'context': dict}

fsm['dispatch']({
    'action': actions_dictionary['Switch'],
    'payload': {},
})
# returns {'state': int, 'context': dict}; updates internal state
```

### Lifecycle

```python
fsm['pause']()           # queues future dispatches
fsm['resume']()          # flushes queue, resumes normal operation
fsm['disable']()         # drops dispatches silently
fsm['enable']()          # re-enables dispatch processing
fsm['destroy']()         # clears internal queue
```

---

## Inject functions

User-defined functions can be injected via a `.py` file path passed as `functionFilePath`.
The file is included verbatim in the generated output after the built-in `function_dictionary`.

The inject file must assign callables into `function_dictionary`:

```python
# my_functions.py
function_dictionary['triple'] = lambda x: function_dictionary['mult'](x, 3)
function_dictionary['clamp'] = lambda x, lo, hi: max(lo, min(hi, x))
```

Usage:

```typescript
import { generateAutomataFromStateDiagram } from '@yantrix/codegen';

const code = await generateAutomataFromStateDiagram(diagram, {
  outLang: 'python',
  className: 'TrafficLight',
  functionFilePath: './my_functions.py',
});
```

Injected functions can reference other entries in `function_dictionary`, including built-ins.
The inject file is executed in module scope so it can also define helper `def` functions
before assigning them into `function_dictionary`.

---

## Dependencies

Generated Python code requires `pydash` at runtime:

```
pip install pydash
```
