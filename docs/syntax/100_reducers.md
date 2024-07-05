---
title: Reducers

---

# Reducers

Reducers are a subset of [fold functions](https://en.wikipedia.org/wiki/Fold_(higher-order_function)) that have signature of 
```
(previousState, action) => newState
```

Most importantly, reducers are [pure functions](https://en.wikipedia.org/wiki/Pure_function). That means the updated data state is dependent solely on the current `State` and whatever data is carried with `Action`  

All `Reducers` are called within `FSM`s, that are generated with code from Yantrix diagrams, and are the essence of the framework and the most important concept to conceive for using Yantrix. They are the carrier of application logic, delivered in tiny bundles, each attached to a certain `State` of the finite state machine and it's possible transitions, which are atomic and transactional.

Reducers in Yantrix starts with `#` directive and are written kinda "backwards":
```
''' Sets "newState" Context value equal to "previousState" value of current Context
#{ newState } <= { previousState }

''' Sets "newState" Context value equal to "actionPayload" of invoked Action
#{ newState } <= ( actionPayload )
```
Here, `{}` braces are dereferencing `State` meta information, usually called a `Context`, while `()` braces are dereferencing `Action` meta information, usually called a `Payload`. 

Because the result of `Reducer` is new `State` and `Context`, braces on the left side of assignment are not technically dereferencing anything, but for the sake of semantics they can only be figured (`{}`), as listed properties must belong to the `Context` interface.

For more info, see [Data Objects](110_data_objects.md)

## Functions and Expressions

As high-order functions, `Reducers` can invoke other `Functions`, including those which can dereference both at the same time

```
''' functions are called by composition. Here we use "foo" property of the `Context`
#{ foo } <= { add(foo, random(0, 1) }

''' any combination of Context or Payload properties can be referenced
#{ foo } <= { add (foo, bar, someFunc(foo, bar)) }
#{ bar, jazz } <= ( sum(payloadA), payloadB )
```

For more info, see [Expressions](130_expressions.html)

## Referencing inside Expressions

There's only dereferencing construction in a reducer, and it's on the right side of `<=` assignment, because more often than not it's enough to use values from either `Context` or `Payload`. However, `Context` and `Payload` properties can be obtained through special functions:
- `${value}` dereferences a `Context` property
- `$(value)` dereferences a `Payload` property
- `$[value]` dereferences a build-time [Constant](120_values_and_constants.md)

```
''' using `Payload` reference in `Context` dereference
#{ accumulatedValue } <= { add(accumulatedValue, $(payloadB) }

''' using `Context` value in `Payload` dereference
#{ binaryValue } <= ( lookup(${accumulatedValue}, payloadB)
```





