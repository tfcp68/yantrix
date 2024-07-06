---
title: Functions
---

# Functions

Functions are [first-class citizens](https://en.wikipedia.org/wiki/First-class_citizen) used
in [Expressions](130_expressions.html). Being a first-class citizen means that a `Function` can be an argument of
another `Function`, leading to [composition](https://en.wikipedia.org/wiki/Function_composition) and generally allowing
for [higher-order functions](https://en.wikipedia.org/wiki/Higher-order_function), similar to most functional languages,
Excel formulas included.

Almost every `Function` used in Yantrix is a [pure function](https://en.wikipedia.org/wiki/Pure_function), i.e. it does
not mutate its arguments or whatsoever, with the only exception being [`Model Transformers`](160_transformers.md).

## Function Classes

The purpose of functions is to provide declarative and deterministic way of transforming data in `FSM` and `Model`
during transitions. Functions are categorized into three varieties:

* `Higher-Order Functions` or just `HOF`s are mostly built-in and are used to control the execution flow, taking place
  of **operators** and **keywords** in imperative programming languages.
* `Predicates` &mdash; `Functions` that have a binary output and validate some condition. Most often than not they are
  used to introduce cyclomatic complexity and logic branching.
* `Transformers` &mdash; are `Functions` that project one data space to another, like mapping
  between `Payload`, `Context`, `Event Meta` or primitive types.

## Polymorphism

`Functions` can implement parameter polymorphism, i.e. they can declare several similar signatures operating different
types. However a function can not have polymorphic return type, and it has limited options depending on which class
the `Function` belongs to:

* `Higher-Order Functions` can return any primitive type
* `Predicates` return **Binary**
* `Transformers` can return any primitive type

### Examples

`contains` is a [`Predicate`](150_predicates.html) that always returns a **Binary**, but can be called with different
argument types:

```
''' if "var" is an Object, checks if a "keyName" property exists in it
contains(var, keyName = 'propertyName')

''' if "var" is a List, it checks for an index existence instead
contains(var, index = 1) 

''' if "var" is a String, checks if it contains a substring
contains(var, substring = 'searchString')
```

## Built-Ins: Conditional operations

| Function(s) |                       Signature                       |                                      Arguments                                      | Returns                                                                                                  |
|:------------|:-----------------------------------------------------:|:-----------------------------------------------------------------------------------:|----------------------------------------------------------------------------------------------------------|
| `if`        |             (**Binary**, any, any) => any             | a condition to check, a value to return if it's truthy, a value to return otherwise | the first argument, if condition is truthy; the second argument in the other case                        |
| `case`      | (**Binary**, any, [**Binary**, any], ..., any) => any |        condition 1, return value 1, condition 2, return value 2, ... , else         | the result of the expression, following a truthy condition; or the latest expression, if none is present |
| `coalesce`  |                   (any, ..) => any                    |                           any collection of `Expressions`                           | first non-Null value in the list of arguments                                                            |
| `random`    |                   () => **Number**                    |                                                                                     | a uniform random number between 0 and 1, that is easily used as a **Binary**                             |
| `random`    |        (**Number**, **Number**) => **Number**         |                                                                                     | a uniform random number between the first and the second arguments                                       |

## Built-Ins: Binary Operations

Most elementary logic is builtin into Yantrix, i.e. those functions can be used in any `Reducer` or `Expression`:

| Function(s)  |                 Signature                  |        Arguments         | Returns                             |
|:-------------|:------------------------------------------:|:------------------------:|-------------------------------------|
| `and`, `all` | (**Binary**, **Binary**, ..) => **Binary** | Any number of conditions | a boolean conjuction of conditions  |
| `or`, `any`  | (**Binary**, **Binary**, ..) => **Binary** | Any number of conditions | a boolean disjunction of conditions |
| `not`        |         (**Binary**) => **Binary**         |    A single condition    | a boolean negation                  |
| `none`       | (**Binary**, **Binary**, ..) => **Binary** | Any number of conditions | equivalent to `not(and(...))`       |

## Built-Ins: Numeric comparison

| Function(s)        |               Signature                |    Arguments    | Returns                                                               |
|:-------------------|:--------------------------------------:|:---------------:|-----------------------------------------------------------------------|
| `isEven`           |       (**Number**) => **Binary**       | A numeric value | truthy if the number is even                                          |
| `isOdd`            |       (**Number**) => **Binary**       | A numeric value | truthy if the number is odd                                           |
| `isInteger`        |       (**Number**) => **Binary**       | A numeric value | truthy if the number is integer                                       |
| `isEqual`          |        (any, any) => **Binary**        |   Any values    | truthy if the arguments are of the same type and have identical value |
| `isGreater`        | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 > number2                                 |
| `isGreaterOrEqual` | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 > number2                                 |
| `isLess`           | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 < number2                                 |
| `isLessOrEqual`    | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 <= number2                                |
| `isNegative`       |       (**Number**) => **Binary**       | A numeric value | truthy if the number is less than 0                                   |
| `isPositive`       |       (**Number**) => **Binary**       | A numeric value | truthy if the number is greater or equal to 0                         |

## Built-Ins: Key/Value lookup

| Function(s) |               Signature                |                    Arguments                    | Returns                                                                             |
|:------------|:--------------------------------------:|:-----------------------------------------------:|-------------------------------------------------------------------------------------|
| `contains`  | (**String**, **String**) => **Binary** |                   two strings                   | truthy if the string1 includes string2, compared bytewise                           |
| `contains`  |     (**List**, any) => **Binary**      |  an array-like structure and a value to search  | truthy if the the **List** includes the second value, compared by type and bytewise |
| `contains`  | (**Object**, **String**) => **Binary** | A dictionary-like structure and a search string | truthy if the the **Object** has a _value_ with a name of the **String** parameter  |
| `has`       |  (**List**, **Number**) => **Binary**  |   an array-like structure and a search index    | truthy if the the **List** has an _index_ equal to **Number**                       |
| `has`       | (**Object**, **String**) => **Binary** | A dictionary-like structure and a search string | truthy if the the **Object** has a _key_ with a name of the **String** parameter    |