---
title: Transformers
---

# Transformers

`Transformers` are projection-type functions that are bundled with `Slice` and translate types between each other.

## Generic Transformers

There are built-in pure functions that operate on any contract type and map the values. They are the basic building
blocks of data manipulation. They can be user-defined and are injected at build-time

### Examples

- `add(value1, value2)`
- `find(listValue, 'id', 4)`
- `mult(mean(listValue), ${count})`

## Context Transformers

They translate `Contexts` between each other and are used inside [`Reducers`](110_reducers.html) to update internal data
of the `FSM` when changing `States`. They are defined as a part of `State Dictionary` and can be injected at compile
time.

### Examples

- `#{stepIndex} <= {nextStep(stepIndex)}`
- `#{email, password, input_error} <= {sanitize(email), sanitize(password), validate(email,password)}`

## Reducer Transformers

Function that translate from `State`+`Action/Payload` to `State/Context` can be injected into `FSM`s at compile time.

- `#{propertyA, propertyB} = {reducerA(propertyA, $(payloadA), reducerB(propertyB, $(payloadB))}`

## Model Transformers

Model transformers are a subtype of `Effects` that are context-free and are basically functions that mutates
the `Data Model`.

- `#{counter} <= { add(counter, increaseGlobalCounter($(value))) }`

They can be composed with `Predicates` to create conditional mutations, but this approach is not recommended, since it
splits the responsibility of `Effects`.
