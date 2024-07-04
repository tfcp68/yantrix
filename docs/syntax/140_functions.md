---
title: Functions
---

# Functions

Functions come in several flavors:

## Predicates

`Predicates` are functions that return a Boolean value and are used to fork the flow of operations inside `FSMs`.
All `Predicates` are high-order functions that allow composition.

### Built-in Predicates

Bundled within Yantrix grammar, they are used to combine other `Predicates` and implement logical operations
like `not`, `and` and so on.

### Model Predicates

Are declared as a part of `Data Model` are supposed to implement conditions that rely on the current state
of `Application`. They can be written in the language of integration and injected into `FSM`s at runtime. This can be
useful to taylor primitives to a specific Integration

### Context Predicates

Are declared within a `Slice` and its `State Dictionary`, and have a `State`/`Context` pair as a dependency. It's
designed to create decision branching within `Forks` and create domein-specific logic

## Transformers

`Transformers` are projection-type functions that come with `Slice` and translate the same types between each other.

### `Generic Transformers`

There are built-in pure functions that operate on any contract type and map the values. They are the basic building
blocks of data manipulation. They can be user-defined and are injected at build-time

### Context Transformers

They translate `Contexts` between each other and are used inside [`Reducers`](100_reducers.html) to update internal data
of the `FSM` when changing `States`. They are defined as a part of `State Dictionary`

### Reducer Transformers

Function that translate from `State`+`Action/Payload` to `State/Context` can be injected into `FSM`s at runtime.

### Model Transformers

Model transformers are a subtype of `Effects` that are context-free and are basically functions that mutates
the `Data Model`. They can be composed with `Predicates` to produce `Effects`
