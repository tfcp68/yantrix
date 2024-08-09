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

## Function Types

The purpose of functions is to provide declarative and deterministic way of transforming data in `FSM` and `Model`
during transitions. Functions are categorized into three varieties:

-   `Higher-Order Functions` or just `HOF`s are mostly built-in and are used to control the execution flow, taking place
    of **operators** and **keywords** in imperative programming languages.
-   `Predicates` &mdash; `Functions` that have a binary output and validate some condition. More often than not, they are used to introduce cyclomatic complexity and logic branching.
-   `Transformers` &mdash; are `Functions` that project one data space to another, like mapping
    between `Payload`, `Context`, `Event Meta` or primitive types.

## Directive

A `Function` can be defined "inline" at default diagram node or as an injection to Codegen, using built-in functions or previously defined ones:

```
define/isMultiplierOf5 (x) => isEqual(mod(x, 5), 0)
define/tg (x) => div(sin(x), cos(x))
define/coinToss () => if(isLess(random(), 0.5), 1, 0)
```

defined functions can be reused inside any other defined functions regardless of declaration order. The recursion is possible but not recommended

```
define/sq (x) => mult(x,x)
define/sumSq (x,y) => add(sq(x), sq(y))
define/hypot (x,y) => sqrt(sumSq(x, y))
```

## Polymorphism

`Functions` can implement parameter polymorphism, i.e., they can declare several similar signatures operating different
types. However, a function cannot have a polymorphic return type, and it has limited options depending on which class
the `Function` belongs to:

-   `Higher-Order Functions` can return any primitive type
-   `Predicates` return **Binary**
-   `Transformers` can return any primitive type

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

## Built-Ins: Conditional expressions

| Function(s) |                       Signature                       |                                      Arguments                                      | Returns                                                                                                  |
| :---------- | :---------------------------------------------------: | :---------------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------- |
| `if`        |             (**Binary**, any, any) => any             | a condition to check, a value to return if it's truthy, a value to return otherwise | the first argument, if condition is truthy; the second argument in the other case                        |
| `case`      | (**Binary**, any, [**Binary**, any], ..., any) => any |        condition 1, return value 1, condition 2, return value 2, ... , else         | the result of the expression, following a truthy condition; or the latest expression, if none is present |
| `coalesce`  |                   (any, ..) => any                    |                           any collection of `Expressions`                           | first non-Null value in the list of arguments                                                            |
| `random`    |                   () => **Number**                    |                                                                                     | a uniform random number between 0 and 1, that is easily used as a **Binary**                             |
| `random`    |        (**Number**, **Number**) => **Number**         |                                                                                     | a uniform random number between the first and the second arguments                                       |

## Defining functions
