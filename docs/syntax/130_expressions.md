---
title: Expressions
---

# Expressions

`Expressions` are function chains applied to particular values, most often during transitions. Expressions can
include [Transformers](160_transformers.html) and [Predicates](150_predicates.html), and are generally just nested
function calls around some property key, so `Expression` is either a `<PROPERTY_NAME>`,
a `<FUNC_OPERATOR>(<PROPERTY_NAME>[,<CONSTANT_ARGS>...])` or a `<FUNC_OPERATOR>(<FUNC_OPERATOR>)`, i.e.

- `index` : returns value of `index` key in a related source object
- `sum(index,2)` : returns arithmetic result `index+2`, where `index` is converted to decimal
- `round(sum(index,2))` : return the rounded result of a previous operation

In any case, an `Expression` has a primary operand which is hereby called `Bound Property`. The `Property` is always the
first (leftmost) argument in the tree of calls.

## Recursion

Using recursion is allowed, however, maximum depth of stack in any `Expression` is 8. This limitation is intentional,
forcing you to explicitly define complex composition of functions as a new function.

## Multiple properties

An `Expression` can reference more than one property as arguments of functions, but all except for the leftmost one are
not considered `Bound Properties`

## Null Property

If the most deeply nested function of an `Expression` does not require a parameter, the `Bound Property` is considered
to equal `Null` for the sake of unification. This value would be passed as an argument to the function if its definition
does actually have a parameter. Example:

- `random()`: returns `Math.random()` value, compare to `random`, which would be a property reference
- `if(greater(random(),0.5),f1(some_property),f2(some_property))`: applies one of two functions `f1`,`f2`
  to `some_property` randomly with 50% chance. However, since the leftmost argument is absend, the `Bound Property`
  is `Null`