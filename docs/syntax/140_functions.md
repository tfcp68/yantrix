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
Regardless of whether it's a `Transformer` or a `Predicate`, this function can be used anywhere in the same diagram or a `Slice`, including "before" the definition in the source code

Custom function can reference any type of functions, including itself, other inline functions, built-ins and injected functions. They are calculated just-in-time and exhibit little difference to built-ins

### Injecting functions

Sometimes native syntax is just not enough. In this case you can implement certain functions in a target programming language (or few) or even use existing APIs in your system to plug the business logic into diagrams, allowing for fast and easy.

To import a function, its signature must be explicitely defined with an `inject` directive

```
inject/<FUNCTION_NAME>
```

This instructs the codegen to lookup for an external function dictionary in parameters:

```bash
yantrix codegen ./input.mermaid --functionFile functions.ts -o ./output.ts -c MyFSM -l typescript
```
The path to the function file must be provided relative to the automaton generation path. This path is used to import the functions during code generation, so it must be accessible from the location where the generated code will be placed.

Obviously, injected functions must be implemented in target language. When trying to build from diagram that ncludes injected functions, which have not been provided, codegen will throw a build-time error.

Typically a function file should contain a dictionary with named functions, stored as first-class citizens in a given language. When building for language, that does not support storing functions in object keys, modularization tecnhiques should be used. JS/TS users can benefit from both worlds and, even more so, they can import built-in functions directly into their custom implementations:

```typescript
// functions.ts

import { coalesce } from '@yantrix/functions';

export const customFunction = x => coalesce (x, 0);
export const anotherFunction = (a, b) => a > 0 ? a : b;
export default {
	customFunction,
	anotherFunction
};
```

Since the reflection of provided functions is generally not possible, type signature is not checked and can mismatch, as always when passing "external" data into expressions. In typed languages, notably in Typescript, this could potentially lead to build-time type error, which is a relatively good situation to be in. In untyped produced code, if injected function throws the error is caught by Yantrix, and the current reduction cycle typically fails. If you want to handle these situtations predictably, make sure to handle runtime interface mismatches and type exceptions within your function, degrading gracefully whenever possible.

All that said, this approach lacks versatility, as diagrams are language-agnostic by design and is based on contracts rather than implentations. Its advised not to use it until you're 100% sure you will never need to solve the problem, that you are solving at the moment, for another languages. In the former case, however, injected functions can dramatically improve your performance with Yantrix and are a must-go for all sorts of API integration pipelines. Worst case, you have to reimplement few (or maybe more) functions, containing the business logic, which you would anyways do when migrating stacks.

### Limitations

Any expression is limited by stack depth, and custom functions are not exception. However, when using Injected functions, its stack is not managed, so it's crucially important to avoid any dubios practices, like long synchronous calls, loops and side effects. It's best to keep all injected functions (if not all your code) in [pure functions](https://en.wikipedia.org/wiki/Pure_function).

Both inline and injected functions only support finite number arguments. If you need lists - use them explicitly.

For the sake of compatibility, prefer using only "plain-text" data as arguments, avoiding language-specific runtime entities, like object instances, `Set`/`Map`, `Blob` and other fancy stuff. Remember: _Keep it stupidly simple_

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
| `if`        |             (**Binary**, any, any) => any             | - Condition<br/>- Yes option<br>- No option| `Yes option`, if `Condition` is truthy, or `No option` otherwise |
| `case`      | (**Binary**, any, [**Binary**, any], ..., any) => any | - Condition 1<br/>- Option 1<br/>- Condition 2<br/>- Option 2</br>- ...<br/>- Default  | `Option N`, if `Condition N` is truthy, or `Default` if none are |
| `coalesce`  |                   (any, ..) => any                    | any collection of `Expressions` | first non-Null value in the list of arguments|
| `choose`    |                   (**Number**, [any,...]) => any         | - Index<br/>- Option 1<br/>- Option 2<br/>- ...   | Picks `Index+1`th option from arguments, i.e. `choose(0,"a","b")` returns `"a"`. Throws error if index is out of bounds or options are not provided |

## Built-Ins: Internals

| Function(s) |                       Signature                       |                                      Context                                      | Returns                                                                                                  |
| :---------- | :---------------------------------------------------: | :---------------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------- |
| `_currentStateName`  | () => **String**   | `FSM` | returns current state string name, as described in the source diagram |
| `_currentStateId`  | () => **Number**   | `FSM` | returns Current state numeric key, as used in built code |
| `_currentActionName`  | () => **String**   | `FSM` | Current action string name, as described in the surce diagram |
| `_currentActionId`  | () => **Number**   | `FSM` | Current action numeric key, as used in built code |
| `currentEpoch`  | () => **Number**   | `FSM` | Current iteration of reduction cycle for framework core, can be used as a discrete timer |
| `currentCycle`  | () => **Number**   | `FSM` | Current iteration of reduction cycle for current FSM |
| `currentTimestamp`  | () => **Number**   | `FSM` | Current system time in microseconds |
| `currentTime`  | () => **Number**   | `FSM` | Current date and time in ISO-8601 format |
| `random`    |                   () => **Number**                    | any | a uniform random number between 0 and 1, that is easily used as a **Binary** |
| `random`    |        (**Number**, **Number**) => **Number**         | any | a uniform random number between low and upper boundary inclusive |
| `weightedRandom`    |        (**Object**) => **String**         | any | a random key of `Object`, whereby `Object`'s values are interpreted as integer weights. If any of `Object` values is not a **Number**, throws an error |
