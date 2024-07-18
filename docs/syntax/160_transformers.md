---
title: Transformers
---

# Transformers

`Transformers` are projection-type functions that are bundled with `Slice` and translate types between each other.

## Generic Transformers

There are built-in pure functions that operate on any contract type and map the values. They are the basic building
blocks of data manipulation. They can be user-defined and are injected at build-time

### Examples

-   `add($value1, $value2)`
-   `find(#listValue, 'id', 4)`
-   `mult(mean(#listValue), $count)`

## Context Transformers

They translate `Contexts` between each other and are used inside [`Reducers`](110_reducers.html) to update internal data
of the `FSM` when changing `States`. They are defined as a part of `State Dictionary` and can be injected at compile
time.

### Examples

-   `#{stepIndex} <= nextStep(#stepIndex)`
-   `#{email, password, input_error} <= sanitize(#email), sanitize(#password), validate(#email, #password)}`

## Reducer Transformers

Function that translate from `State`+`Action/Payload` to `State/Context` can be injected into `FSM`s at compile time.

-   `#{propertyA, propertyB} = reducerA(#propertyA, $payloadA, reducerB(#propertyB, $payloadB)`

## Model Transformers

Model transformers are a subtype of `Effects` that are context-free and are basically functions that mutates
the `Data Model`.

-   `#{counter} <= add(№counter, increaseGlobalCounter($value))`

They can be composed with `Predicates` to create conditional mutations, but this approach is not recommended, since it
splits the responsibility of `Effects`.

## Built-Ins: Number Transformers

| Function(s) |                  Signature                  |         Arguments         | Returns                                                                      |
| :---------- | :-----------------------------------------: | :-----------------------: | ---------------------------------------------------------------------------- |
| `add`       | (**Number**, **Number**, ...) => **Number** | Any amount of **Numbers** | sum of passed values                                                         |
| `inc`       |         (**Number**) => **Number**          | A single **Number** value | shortcut for `add(value,1)`                                                  |
| `dec`       |         (**Number**) => **Number**          | A single **Number** value | shortcut for `add(value,-1)`                                                 |
| `pow`       |   (**Number**, **Number**) => **Number**    |      Two **Numbers**      | first argument to the power of the second one                                |
| `mult`      | (**Number**, **Number**, ...) => **Number** | Any amount of **Numbers** | product of passed values                                                     |
| `neg`       |         (**Number**) => **Number**          | A single **Number** value | shortcut for `mult(value,-1)`                                                |
| `diff`      |   (**Number**, **Number**) => **Number**    |      Two **Numbers**      | first argument substracted from the second one                               |
| `div`       |   (**Number**, **Number**) => **Number**    |      Two **Numbers**      | first argument divided by the second one                                     |
| `inv`       |         (**Number**) => **Number**          | A single **Number** value | shortcut for `div(1, value)`                                                 |
| `mod`       |   (**Number**, **Number**) => **Number**    |      Two **Numbers**      | first argument [modulo](https://en.wikipedia.org/wiki/Modulo) the second one |
| `trunc`     |         (**Number**) => **Number**          | a single **Number** value | a nearest integer less than the argument                                     |
| `ceil`      |         (**Number**) => **Number**          | a single **Number** value | a nearest integer greater than the argument                                  |
| `round`     |         (**Number**) => **Number**          | a single **Number** value | mathematically rounded argument                                              |
| `sqrt`      |         (**Number**) => **Number**          | a single **Number** value | sinus of argument                                                            |
| `sin`       |         (**Number**) => **Number**          | a single **Number** value | sinus of argument                                                            |
| `cos`       |         (**Number**) => **Number**          | a single **Number** value | sinus of argument                                                            |

## Built-Ins: List Transformers

| Function(s) |                  Signature                  |                            Arguments                             | Returns                                                                                                             |
| :---------- | :-----------------------------------------: | :--------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------- |
| `lookup`    |       (**List**, **any**) => **any**        |            An Array-like structure and a search value            | returns the second argument if it's present in the **List**, `Null` otherwise                                       |
| `filter`    | (**List**, **String**, **any**) => **List** | An Array-like structure of objects, property name and seek value | returns new **List** with objects from the passed the **List**, which have the named property equal to passed value |
