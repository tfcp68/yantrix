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
-   `mult(avg(#listValue), $count)`

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

## Built-Ins: Arithmetics

| Function(s) | Argument Type               | Argument Value  | Return Type | Return Value                                                               |
| ----------- | --------------------------- | --------------- | ----------- | -------------------------------------------------------------------------- |
| `add`       | **Number**, [**Number**...] | any numbers     | **Number**  | sum of arguments                                                           |
| `diff`      | **Number**, **Number**      | two numbers     | **Number**  | the second number reduced by the first number                              |
| `mult`      | **Number**, [**Number**...] | any numbers     | **Number**  | product arguments                                                          |
| `div`       | **Number**, **Number**      | two numbers     | **Number**  | the first number divided by the second number                              |
| `pow`       | **Number**, **Number**      | base and power  | **Number**  | exponentiation of two numbers                                              |
| `inc`       | **Number**                  | a single number | **Number**  | shortcut for `add(number,1)`                                               |
| `dec`       | **Number**                  | a single number | **Number**  | shortcut for `add(number,-1)`                                              |
| `neg`       | **Number**                  | a single number | **Number**  | shortcut for `mult(number,-1)`                                             |
| `inv`       | **Number**                  | a single number | **Number**  | shortcut for `div(1,number)`                                               |
| `mod`       | **Number**, **Number**      | two numbers     | **Number**  | first number [modulo](https://en.wikipedia.org/wiki/Modulo) the second one |
| `trunc`     | **Number**                  | a single number | **Number**  | a nearest integer less than the argument                                   |
| `ceil`      | **Number**                  | a single number | **Number**  | a nearest integer greater than the argument                                |
| `round`     | **Number**                  | a single number | **Number**  | mathematically rounded argument                                            |

## Built-Ins: Special Maths

| Function(s) | Argument Type          | Argument Value  | Return Type | Return Value                             |
| ----------- | ---------------------- | --------------- | ----------- | ---------------------------------------- |
| `sin`       | **Number**             | a single number | **Number**  | sine of the argument                     |
| `cos`       | **Number**             | a single number | **Number**  | cosine of the argument                   |
| `sqrt`      | **Number**             | a single number | **Number**  | square root of the argument              |
| `log`       | **Number**, **Number** | number and base | **Number**  | logarithm of the number to the base      |
| `ln`        | **Number**             | number          | **Number**  | logarithm of the number to the _e_ base  |
| `lg`        | **Number**             | number          | **Number**  | logarithm of the number to the _10_ base |
| `deg`       | **Number**             | number          | **Number**  | converts degrees to radians              |
| `rad`       | **Number**             | number          | **Number**  | converts radians to degs                 |

## Built-Ins: Statistics

| Function(s)  | Argument Type               | Argument Value                                    | Return Type | Return Value                                                               |
| ------------ | --------------------------- | ------------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `max`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | maximum of passed values                                                   |
| `max`        | **List**                    | list of numbers                                   | **Number**  | maximum of passed list                                                     |
| `min`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | minimum of passed values                                                   |
| `min`        | **List**                    | list of numbers                                   | **Number**  | minimum of passed list                                                     |
| `avg`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | average of passed values                                                   |
| `avg`        | **List**                    | list of numbers                                   | **Number**  | average of passed list                                                     |
| `med`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | median of passed values                                                    |
| `med`        | **List**                    | list of numbers                                   | **Number**  | median of passed list                                                      |
| `sum`        | **List**                    | list of numbers                                   | **Number**  | sum of passed list                                                         |
| `sumsq`      | **List**                    | list of numbers                                   | **Number**  | sum of passed list                                                         |
| `sumProduct` | **List**, [**List**...]     | Any amount of Lists, each being a list of numbers | **any**     | sum of the products of corresponding values in two or more supplied arrays |

## Built-Ins: List Transformers

| Function(s) | Argument Type                 | Argument Value                                         | Return Type | Return Value                                                                                                                                      |
| ----------- | ----------------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `len`       | **List**                      | - List                                                 | **Number**  | quantity of items in the List                                                                                                                     |
| `lookup`    | **List**, **any**             | - List<br/>- search element                            | **any**     | the second argument, if it's present in the **List**, `Null` otherwise                                                                            |
| `filterBy`  | **List**, **String**, **any** | - List of objects<br/>- property name<br/>- seek value | **List**    | returns new **List** with objects from the passed the **List**, which have the named **property** equal to passed **seek value**                  |
| `find`      | **List**, **String**, **any** | - List of objects<br/>- property name<br/>- seek value | **List**    | returns new the first object from the passed the **List**, which have the named **property** equal to passed **seek value**, `Null` if none found |
| `left`      | **List**, **Number**          | - List<br/>- Length<br/>                               | **String**  | first N items in the List                                                                                                                         |
| `right`     | **List**, **Number**          | - List<br/>- Length<br/>                               | **String**  | last N items in the List                                                                                                                          |
| `indexOf`   | **List**, **any**             | - List<br/>- List                                      | **any**     | the index of search element, if it's present in the List, `-1` otherwise                                                                          |

## Built-Ins: String Transformers

| Function(s) | Argument Type                         | Argument Value                                   | Return Type | Return Value                                                                                                                                              |
| ----------- | ------------------------------------- | ------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `substr`    | **String**, **Number** [, **Number**] | - String<br/>- Start position<br/>- End position | **String**  | a substring of given String, see JS [String.Substring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring) |
| `len`       | **String**                            | - List                                           | **Mumber**  | quantity of symbols in the string                                                                                                                         |
| `left`      | **String**, **Number**                | - String<br/>- Length<br/>                       | **String**  | first N symbols of the string                                                                                                                             |
| `right`     | **String**, **Number**                | - String<br/>- Length<br/>                       | **String**  | last N symbols of the string                                                                                                                              |
| `indexOf`   | **String**, **String**                | - String<br/>- search substring                  | **any**     | the index of search substring, if it's present in the first string, `-1` otherwise                                                                        |
