---
title: Reducers
---

# Reducers

Reducers are a subset of [fold functions](<https://en.wikipedia.org/wiki/Fold_(higher-order_function)>) that have
signature of

```
(previousState, action) -> newState
```

Most importantly, reducers are [pure functions](https://en.wikipedia.org/wiki/Pure_function). That means the updated
data state is dependent solely on the current `State` and whatever data is carried with `Action`

All `Reducers` are called within `FSM`s, that are generated with code from Yantrix diagrams, and are the essence of the framework and the most important concept to conceive for using Yantrix. They are the carrier of application logic, delivered in tiny bundles, each attached to a certain `State` of the finite state machine. They are defined in a `note` block attached to a certain `State`, and are actually invoked right before the `FSM` transitions to that `State`. Reducers are run in the same order they are mentioned.

## Directive

Reducers in Yantrix starts with `#` directive followed by braces:

```
''' Sets "newState" Context value equal to "previousState" value of current Context
#{ newState } <= #previousState

''' Sets "newState" Context value equal to "actionPayload" of invoked Action
#{ newState } <= $actionPayload
```

Here, `{}` braces group `#` operation, which is a reference to the `State` attribute, usually called a `Context`, while `$` operation is referencing an `Action` meta information, usually called a `Payload`.

Because the result of `Reducer` is new `State` and `Context`, braces on the left side of assignment are not technically referencing anything. However, for the sake of simplicity they allow to not specify a reference symbol for every listed property explicitly, implying all of them only reference `Context` properties.

The `Context` operation is bound to a `State` and is applied when the `FSM` transitions to that `State`. The rules of transitions are defined on higher level of syntax and are processed before `Reducers` are actually calculated.

For more info, see [Data Objects](100_data_objects.md)

## Functions and Expressions

Every `Reducer` can reference any number of variable names on both left and right side of `Reducer`. All required properties are added to the `Context` dynamically, if needed. But each key can be listed only once.

If there are more properties in `Target Object` than in `Source Object` , excessive`Target Object` properties are left empty (`Null`).

If there're more properties in `Source Object` than in `Target Object`, such a diagram will throw an error

```
''' assigns Null to the latter property, and copieis the rest
#{ property1, property2, property 3 } <= #property2, #property3

''' copies values in order of reference
# { property1, property2, property 3 } <= $payloadA, $payloadB, $payloadC

''' throws an error due to excessive properties on the right side
# { property1, property 2} <= $payloadA, $payloadB, $payloadC
```

As high-order functions, `Reducers` can invoke other `Functions`, including those which can dereference both at the same
time

```
''' functions are called by composition. Here we use "foo" property of the `Context`
#{ foo } <=  add(#foo, random(0, 1))

''' any combination of Context or Payload properties can be referenced
#{ foo } <= add (#foo, #bar, someFunc(#foo, #bar))
#{ accumulatedValue } <= add( $payloadValueA, $payloadValueB )
```

For more info, see [Expressions](130_expressions.html) and [`Functions`](140_functions.html)

## Referencing inside Expressions

There's a `#{}` dereferencing construction in a reducer, and it's on the left side of `<=` assignment, because
the `Reducer` is supposed to return `Context` properties. However, `Context` and `Payload` properties can be referenced
in any expressions using symbols:

-   `#prop` dereferences a `Context` property named `prop`
-   `$prop2` dereferences a `Payload` property named `prop2`
-   `%%value` dereferences a build-time [Constant](120_values_and_constants.md) named `value`

```
#{ bar, jazz } <= sum($payloadA), coalesce(#jazz, $payloadB)
#{ value } <= lookup(#accumulatedValue, $payloadB)
```
