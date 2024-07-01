---
title: Variables
---

# Variables

## Data Objects

Yantrix implies that business logic is deterministic and is built upon a single anemic `Data Model`. Framework
controller, meanwhile, consists of small building blocks described as Dictionaries/Records. Most notable of those blocks
are

- `Context`: current condition of a `FSM`, including it's control state and various meta fields
- `Payload`: a useful data transferred to a `FSM` with each dispatched `Action`, including its id and various meta
  fields
- `Event Meta`: the same as `Payload` but for `Events` &mdash; messages dispatched through `Event Bus` between `FSMs`

Each of those is represented as keyed object (dictionary, record, etc.) with each key being processed as a separate var.
In most cases variables are immutable and their names are basically labels for the `Expressions` assignment.

## Destructuring Key Lists

The properties extracted from `Data Objects`, which are destructured from them based on their keys. Listing Keys is like
declaring variables Key list is defined as the following:

```
KEY_ITEM::=<TARGET_PROPERTY>[=<EXPRESSION>]
KEY_LIST::=KEY_ITEM[,KEY_ITEM...]
```

`Expression` is derived from `Data Object` properties, bound to any of them.

If there're more properties in `Target Object` than in `Source Object` , excessive`Target Object` properties are left
empty.

If there're more properties in `Source Object` than in `Target Object`, such a diagram will throw an Error

### Examples

- `id,name` : copies corresponding fields from a source object to target
- `id,name=trim(name)` : does the same, but applies `String.trim()` to source value
- `id,name=concat(trim(name),' ',trim(lastname))`: extracts two properties from the source object, trims them and joins
  them with a predefined string constant

## Assignments

Many operations revolve around mapping `Data Objects`, which is achieved by enumerating affected source and target
object keys (properties) and their transformations.

Essentially, every operation on data in Yantrix is transactional by nature and is represented as a reduction (fold)
function: `(previousContext, Payload) => newContext`. Thus, every transaction is built as a set of one-liners, each
describing rules to map values from `Source Object` to `Target Object`. The whole set of rules for a given transaction
is described inside Mermaid constructions: `notes` and `transition` descriptors.

Every transaction inside a `note` starts with a directive, the simplest one being `#`. The possible transaction is
described as the following:

```
#{var = 0}
```

This creates a property in a `newContext`, that is copied from `previousContext`, if present, or assigned `0` (as a
Number) otherwise

But the most used scenario for transactions is mapping values:

```
#{var} <= {anotherVar}
```

This will set `newContext.var` equal to `previousContext.anotherVar`, if the latter is present. IF not, `newContext.var`
will be left empty

The direction of mapping is represented as `<=` or `=>` arrow. The `Object` on the pointing side of arrow is
called `Target Object`, and the one on the other side of arrow is a `Source Object`. The specific cases are described in
corresponding sections.

## Default values

Default values are assigned to vars when the requested property is missing in a `Data Object`. To assign a default value
the `KEY_ITEM` is followed by `=` and a [`Constant`](constants.html) or [`Expression`](expressions.html). For instance:

```
#{anyValue, stringValue = 'foobar', numericValue = 3.14}
```

Default values can be used both in `Source Objects` and in `Target Objects`

When used on both sides of a transaction, the `Source Object` default value takes priority. I.e. the
code `#{a = 1} <= {b = 2}` is processed in the following manner:

- `b` is read from the `previousContext`. If it's not there, the expressions resolves to `2`
- the result of expression is assigned to `newContext.a`. If it was not there, it would save as `1`. However, it would have already be assigned `2` from the right side.

## Referencing objects

The choice of [Data Object](#data-object) to destructure is defined with the following syntax:

- `{KEY_LIST}` describes a `Context` and its properties
- `<= (KEY_LIST)` describes a `Payload`
- `=> (KEY_LIST)`  depends on the directive it's used with:
    - `emit/` directive: `KEY_LIST` references the generated `Event Meta`
    - `subscribe/` directive: `KEY_LIST` references the generated `Payload`
- `(KEY_LIST) =>` is used in `subscribe/` directive and references `Event Meta` of the incoming `Event`

### Examples

`#{a, b, c}` describes a `Context` with named properties `a`,`b` and `c`. This notation is a syntactic sugar
for `#{a, b, c} <= #{a, b, c}`, meaning that values are plain copied from the preceding `Context` during the transaction

`#{a, b} <= (a, b)` is similar but copies values from `Payload`, received by a transaction. This implies that the
property names are not necessarily identical, i.e. it could be `#{a, b} <= #(c, d)`, in which case the properties are
copied in the correspoding order: `Context.a` receives the value of `Payload.c`, and `Context.b` is updated
with `Payload.d`.

The same is possible with `Context` too, and basically every `Expression` can be used inside right-side
object: `#{newA,newB} <= {someFunction(oldA), oldB = 2}` does the following:

- passes `previousContext.oldA` to `someFunction` and puts the output value to `newContext.newA`
- assigns `previousContext.oldB` value to `newContext.newB`, or uses `2` numeric primitive instead,
  if `previousContext.oldB` was not defined


