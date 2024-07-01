---
title: Syntax
---

## Mermaid

Yantrix extends [MermaidJS](https://mermaid.js.org/) syntax to describe business logic, which is then transpiled into one of popular programming languages. This allows to effortlessly visualize data flow and control states, blending well into [Documentation-As-Code](https://www.writethedocs.org/guide/docs-as-code/) and [Everything-As-Code](https://hackernoon.com/everything-as-code-explained-0ibg32a3) paradigms.

Yantrix currently supports [State Diagrams](https://mermaid.js.org/syntax/stateDiagram.html) and aims to support [Sequence Diagrams](https://mermaid.js.org/syntax/sequenceDiagram.html) and [Class Diagrams](https://mermaid.js.org/syntax/classDiagram.html) as well.

## Subsyntax

There's a embedded subsyntax to describe data flow, effects and event model, which makes Yantrix itself a programming language that requires a bit of learning to use efficiently. The syntax reflects the state-machine lifecycle and mostly translates to or from fold reducers implemented via code generation.

Subsyntax is extendable in a functional way, and comes with most programming primitives typical for reactive (event-driven) functional frameworks:

-   [Constants](constants.html)
-   [Variables](variables.html)
-   [Expressions](expressions.html)
-   [Functions](functions.html)
-   [Events](events.html)
-   [Side Effects](effects.html)

## Expressions

Expressions are function chains applied to particular values, most often during transitions. Expressions can include [Transformers](#transformers) and [Predicates](#predicates), and are generally just nested function calls around some property key, so Expression is either a `<PROPERTY_NAME>`, a `<FUNC_OPERATOR>(<PROPERTY_NAME>[,<CONSTANT_ARGS>...])` or a `<FUNC_OPERATOR>(<FUNC_OPERATOR>)`, i.e.

-   `index` : returns value of `index` key in a related source object
-   `sum(index,2)` : returns arithmetic result `index+2`, where `index` is converted to decimal
-   `round(sum(index,2))` : return the rounded result of a previous operation

In any case, an `Expression` has a primary operand which is hereby called `Bound Property`. The `Property` is always the first (leftmost) argument in the tree of calls.

## Recursion

Using recursion is allowed, however, maximum depth of stack in any `Expression` is 8. This limitation is intentional, forcing you to explicitly define complex composition of functions as a new function.

## Multiple properties

An `Expression` can reference more than one property as arguments of functions, but all except for the leftmost one are not considered `Bound Properties`

## Null Property

If the most deeply nested function of an `Expression` does not require a parameter, the `Bound Property` is considered to equal `Null` for the sake of unification. This value would be passed as an argument to the function if its definition does actually have a parameter. Example:

-   `random()`: returns `Math.random()` value, compare to `random`, which would be a property reference
-   `if(greater(random(),0.5),f1(some_property),f2(some_property))`: applies one of two functions `f1`,`f2` to `some_property` randomly with 50% chance. However, since the leftmost argument is absend, the `Bound Property` is `Null`

## Key Lists

Many operations revolve around mapping data objects, which is achieved by enumerating affected source and target object keys (properties) and their transformations. Key list is defined as the following:

```
KEY_ITEM::=<TARGET_PROPERTY>[=<SOURCE_EXPRESSION>]
KEY_LIST::=KEY_ITEM[,KEY_ITEM...]
```

`SOURCE_EXPRESSION` is an `Expression` derived from source object properties, bound to any of them. The particular meaning of _"source"_ and _"target"_ here is contextual and depends on where the Key List is used. Examples:

-   `id,name` : copies corresponding fields from a source object to target
-   `id,name=trim(name)` : does the same, but applies `String.trim()` to source value
-   `id,name=concat(trim(name),' ',trim(lastname))`: extracts two properties from the source object, trims them and joins them with a predefined string constant

## State Transformers

To project values between `Action Paylowd` and `State Context` the following syntax is used:

-   `#{<KEY_LIST>}<=(<KEY_LIST>)` : maps `Payload` to `Context`, where `Payload` keys referenced on the right side, and `Context` keys are referenced on the left side- `#(<KEY_LIST>)<=(<KEY_LIST>)` : maps previous `Context` to `Context`, where the previous `Context` keys referenced on the right side

## Event Subscriptions

`subscribe/<EVENT_NAME> => <ACTION_NAME> [(<KEY_LIST>)]`

## Event Emitters

`emit/<EVENT_NAME> [<= (<KEY_LIST>)]`

## Side Effects

`effect/<EFFECT_NAME> [<= (<KEY_LIST>)]`
