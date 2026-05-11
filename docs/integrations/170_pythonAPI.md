---
title: Python API
---

# Python API

This page covers the generated API for the `python` dialect.
The `python` dialect emits a self-contained `.py` file with no external package dependencies -
only the Python standard library (`math`, `random`, `typing`) is used.

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
event_dictionary    # dict[str, int]  - event name -> numeric id

states_map          # dict[str, str]  - numeric id -> name
actions_map         # dict[str, str]

function_dictionary # dict[str, callable] - built-in + user-defined functions

def get_state(name: str) -> int: ...
def get_action(name: str) -> int: ...
def create_action(name: str, payload: dict | None) -> dict: ...
def has_state(instance: dict, name: str) -> bool: ...
def create_event_bus(bus_id: str, factories: dict[str, callable]) -> tuple: ...
```

---

## Factory and instance

The factory function returns a plain dict of callables (closure-based, no class):

```python
fsm = create_traffic_light()

fsm['state']()           # current state id (int)
fsm['last_action']()     # last dispatched action id, or None
fsm['current_cycle']()   # dispatch count (int)
fsm['event_adapter']     # _EventAdapter instance (or None if no events in diagram)

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

## Event Bus

Multiple automata can share an event bus for reactive wiring. Each factory that uses
`subscribe/` or `emit/` notes in its diagram will have a wired `event_adapter` in its
instance dict. `create_event_bus()` connects N automata to a shared `_EventBus`.

```python
from automata_a_generated import create_automata_a, event_dictionary
from automata_b_generated import create_automata_b

bus, automatas, cleanup = create_event_bus('my_bus', {
    'a': create_automata_a,
    'b': create_automata_b,
})

# Dispatch an event to the bus; all subscribed automata react
bus.dispatch({'event': event_dictionary['SomeName'], 'meta': {'value': 42}})

# Tear down subscriptions when done
cleanup()
```

`create_event_bus(bus_id, factories)` returns `(bus, automatas, cleanup)`:

- `bus` - `_EventBus` instance; call `bus.dispatch(...)` to inject events
- `automatas` - `dict[str, instance_dict]` of created FSM instances
- `cleanup()` - unsubscribes all handlers

### Diagram syntax

Use standard Yantrix note syntax to wire events:

```text
note left of StateA
  subscribe/EventName ActionName
end note

note left of StateB
  emit/EventName
end note
```

When `StateB` is entered, it emits `EventName` onto the bus. Any automata listening to
`EventName` (via `subscribe/EventName`) will have their `ActionName` action dispatched.

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

## Built-in functions

The generated file includes only the built-in functions actually referenced in the diagram.
All built-ins are pure Python - no external packages required.

---

## Dependencies

Generated Python code has no external dependencies. Only the Python standard library
(`math`, `random`, `typing`) is used in the generated file.
