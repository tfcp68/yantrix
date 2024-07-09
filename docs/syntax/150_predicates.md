---
title: Predicates
---

# Predicates

`Predicates` are functions that return a Boolean value and are used to fork the flow of operations inside `FSMs`.
All `Predicates` are high-order functions that allow composition.

## Built-in Predicates

Bundled within Yantrix grammar, they are used to combine other `Predicates` and implement logical operations
like `not`, `and` and so on.

### Examples

- check the oddity of value: `isEven(value)`
- compare two numbers: `isGreater(value, reference)`
- compare with a constant: `isLowerOrEqual(value, 0)`
- test if a sample is in the set: `includes(listValue, sample)`
- test if any condition succeeds:

```
oneOf(isGreater(value, 0), not(includes(listValue, 'sample')), isGreater(len(stringValue), 0))
```

## Model Predicates

Are declared as a part of `Data Model` are supposed to implement conditions that rely on the current state
of `Application`. They can be written in the language of integration and injected into `FSM`s at runtime. This can be
useful to taylor primitives to a specific Integration

### Examples

- `isUserAuthorized(user_id)`
- `isEqual(getHeader(headers, 'Origin'), %%allowed_origin))`
- `effect/colorize <= #{if(isEven(counter), 'red','green'}}`

## Context Predicates

Are declared within a `Slice` and its `State Dictionary`, and have a `State`/`Context` pair as a dependency. It's
designed to create decision branching within `Forks` and create domain-specific logic

### Examples

- `isRequestComplete()`
- `isFocused(input_id)`
- `hasItemsinQueue(queue)`
