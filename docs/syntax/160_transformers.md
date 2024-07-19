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

### Arithmetics

| Function(s) | Argument Type               | Argument Value  | Return Type | Return Value                                                               |
| ----------- | --------------------------- | --------------- | ----------- | -------------------------------------------------------------------------- |
| `add`       | **Number**, [**Number**...] | any numbers     | **Number**  | sum of arguments                                                           |
| `diff`      | **Number**, **Number**      | two numbers     | **Number**  | the second number reduced by the first number                              |
| `mult`      | **Number**, [**Number**...] | any numbers     | **Number**  | product arguments                                                          |
| `div`       | **Number**, **Number**      | two numbers     | **Number**  | the first number divided by the second number                              |
| `pow`       | **Number**, **Number**      | base and power  | **Number**  | exponentiation of two numbers                                              |
| `inc`       | **Number**                  | a single number | **Number**  | shortcut for `add(**Number**,1)`                                           |
| `dec`       | **Number**                  | a single number | **Number**  | shortcut for `add(**Number**,-1)`                                          |
| `neg`       | **Number**                  | a single number | **Number**  | shortcut for `mult(**Number**,-1)`                                         |
| `inv`       | **Number**                  | a single number | **Number**  | shortcut for `div(1,**Number**)`                                           |
| `mod`       | **Number**, **Number**      | two numbers     | **Number**  | first number [modulo](https://en.wikipedia.org/wiki/Modulo) the second one |
| `trunc`     | **Number**                  | a single number | **Number**  | a nearest integer less than the argument                                   |
| `ceil`      | **Number**                  | a single number | **Number**  | a nearest integer greater than the argument                                |
| `round`     | **Number**                  | a single number | **Number**  | mathematically rounded argument                                            |
| `sqrt`      | **Number**                  | a single number | **Number**  | square root of the argument                                                |

### Advanced maths

| Function(s) | Argument Type          | Argument Value  | Return Type | Return Value                             |
| ----------- | ---------------------- | --------------- | ----------- | ---------------------------------------- |
| `sin`       | **Number**             | a single number | **Number**  | sine of the argument                     |
| `cos`       | **Number**             | a single number | **Number**  | cosine of the argument                   |
| `log`       | **Number**, **Number** | number and base | **Number**  | logarithm of the number to the base      |
| `ln`        | **Number**             | number          | **Number**  | logarithm of the number to the _e_ base  |
| `lg`        | **Number**             | number          | **Number**  | logarithm of the number to the _10_ base |

### Statistical functions

| Function(s) | Argument Type               | Argument Value | Return Type | Return Value             |
| ----------- | --------------------------- | -------------- | ----------- | ------------------------ |
| `max`       | **Number**, [**Number**...] | any numbers    | **Number**  | maximum of passed values |
| `min`       | **Number**, [**Number**...] | any numbers    | **Number**  | minimum of passed values |
| `avg`       | **Number**, [**Number**...] | any numbers    | **Number**  | average of passed values |
| `med`       | **Number**, [**Number**...] | any numbers    | **Number**  | median of passed values  |

## Built-Ins: List Transformers

| Function(s) | Argument Type                 | Argument Value                                                         | Return Type | Return Value                                                                                                                     |
| ----------- | ----------------------------- | ---------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `lookup`    | **List**, **any**             | - Array-like structure<br/>- search value                              | **any**     | the second argument, if it's present in the **List**, `Null` otherwise                                                           |
| `filterBy`  | **List**, **String**, **any** | - Array-like structure of objects<br/>- property name<br/>- seek value | **List**    | returns new **List** with objects from the passed the **List**, which have the named **property** equal to passed **seek value** |
