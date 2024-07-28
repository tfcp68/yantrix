---
title: Values and Constants
---

# Values and Constants

## Type system

As of now, data contracts in diagrams do not have typings.

When exporting Typescript code, they are declared as `any`. However, FSM itself (it's `States` and `Actions`) is typed
along with [Automata](../API-reference/automata/) instance.

For other languages, Yantrix aims to provide compatibility with elementary types, existing in most of them:

-   **Numbers**: integer and floats are processed as similarly as possible for a given language
-   **Strings**: strings are processed as immutables, i.e. every string function should return a new string rather than
    modify one of its arguments
-   **Lists (Tuples)**: Lists and Tuples are processed as similarly as possible for a given language. They also are
    immutable and can only be a read-only argument of the calling function
-   **Objects(Dictionaries)**: implementation is highly language-dependent and aims to reproduce the behaviour of
    Typescript [`Record`](../API-reference/automata/interfaces/IAutomata.html) implementation as closely as possible.
    For `Functions` implementation **Object** arguments should be defined as immutable and read-only.
-   **Binary** &mdash; a special type that is used for conditional logic. It is essentially a **Number** but is interpreted
    as a boolean by the following rules:
    -   If the value is `Null` or unset, the `Binary` is falsy
    -   If the value is 0 or less, the `Binary` is falsy
    -   If the value is 1 or greater, the `Binary` is truthy
    -   Otherwise, the value is rounded by mathematic rules and then is compared again
-   A special **Function** type exists for [Functions](140_functions.html), when they are used as another `Function` parameter, such as in `map`- and `filter`-style iterators.

## Properties

Properties are named members of [`Data Objects`](100_data_objects.html). Inside Yantrix intestines `Payload`,`Context`
and `Event Meta` are dictionaries, and top-level properties of them can be extracted by name. Deeper nested values (i.e., when property is of `Object` type) are extracted with special [`Functions`](140_functions.html)

The properties extracted from `Data Objects`, which are destructured from them based on their Keys. Listing Keys is like
declaring variables, which are members of a dereferenced Data Object.
Key list is defined as the following:

```
KEY_ITEM::=<TARGET_PROPERTY>[=<EXPRESSION>]
KEY_LIST::=KEY_ITEM[,KEY_ITEM...]
```

`Expression` is derived from `Data Object` properties, bound to any of them, see [Expressions](130_expressions.html)

## Referencing Data Objects

The choice of `Data Object` to attach a property is defined by the directive.

### Context

`#varName` references a property of `Context` inside any `Expression`. If the `Context` with given name is not available
in the calling
directive, the property reference is set to `Null`, unless provided with a [default value](#default-values)

`#{KEY_LIST}` is used to reference numerous properties of `Context`, mostly in [`Reducers`](110_reducers.html)
and [`Event Emitters`](220_emit.html).

```
''' declare a Context with three members
#{a,b,c}
''' Declare a Context with three more members, that copy value from previous ones
#{oldA, oldB, oldC} <= #a,#b,#c
''' fire an Event with a numeric property, derived from a function applied to those
emit/someEvent (eventCode) <= #{encode(oldA, oldB, oldC)}
```

### Payload

`$varName` references a property of `Payload` inside any `Expression`. If the `Payload` with given name is not available
in the calling
directive, the property reference is set to `Null`, unless provided with a [default value](#default-values)

`(KEY_LIST)` is used to reference numerous properties of `Payload` on the left side of `<=`
of [`subscribe`](210_subscribe.html) directives

```
''' Expression that invokes a Function upon a Payload property
func($payloadValue)
''' assign three Payload properties to respective Context properties
#{a,b,c} <= $payloadA, $payloadB, $payloadC
''' Translate an Event with its Meta to Action with Payload
subscribe/someEvent SomeAction ( payloadValue ) <= ( eventMetaValue )
```

## Default values

Default values are assigned to vars when the requested property is present in a `Data Object` but equals to `Null` (
an empty pointer). To assign a default value
the `KEY_ITEM` is followed by `=` and a [`Constant`](constants.html) or [`Expression`](expressions.html). For instance:

```
#{anyValue, stringValue = 'foobar', numericValue = cos(div(%%pi,6))}
```

Default values can be used both in `Source Objects` and in `Target Objects`, but they are assigned only if the
referenced key exists in it. For example:

````
''' here `value1` and `value2` will not be set to 1 the first time Context is created
#{value1, value2} <= #value1 = 1, #value 2 = 1

``` and here they will
#{value1 = 1, value2 = 1} <= #value1, #value2

''' likewise, Payload default values are not applied, if there's no such property in Payload
#{value1, value2} <= $value1 = 1, $value2 = 1
````

When used on both sides of a transaction, the `Source Object` default value takes priority. i.e. the
code `#{a = 1} <= $b = 2` is processed in the following manner:

-   `b` is read from `Payload`. If it's there but `Null`, the expressions resolves to `2`. Otherwise it's an unset value
-   the result of expression is assigned to `newContext.a`. If it's an unset value, it resolves to `1`

Thus, if no `Payload` was given, or it doesn't have `b` key, `Context`.`a` will resolve to `1`

## Constant declaration

All but **Object** types can be created in-place, as the default value of `Context` or `Payload` property or as
a `Function` argument

-   `1` or `1.05` is the way to create a **Number**. Other numeric representations (e.g. hex, exponential, etc.) are
    supported
    as long as the target language supports them. Numbers are automatically typecasted to **Binary** if needed
-   `'foo'` creates a **String** primitive
-   `[]` creates an empty List
-   `%%foo` is a compile-time Constant, that is passed to a Codegen along with a Mermaid diagram, primarily being used
    for behaviour that is dependent on environment and/or CI/CD operations.

## Examples

`#{a, b, c}` describes a `Context` with named properties `a`,`b` and `c`. This notation is a syntactic sugar
for `#{a, b, c} <= #a, #b, #c`, meaning that values are plain copied from the preceding `Context` during the transaction

`#{a, b} <= $a, $b` is similar but copies values from `Payload`, received by a transaction.

It could be `#{a, b} <= $c, $d`, in which case the properties are
copied in the correspoding order: `Context.a` receives the value of `Payload.c`, and `Context.b` is updated
with `Payload.d`.

The same is possible with `Context` too, and basically every `Expression` can be used inside right-side
object: `#{newA,newB} <= someFunction(#oldA), #oldB = 2` does the following:

1. passes `previousContext.oldA` to `someFunction` and puts the output value to `newContext.newA`
2. assigns `previousContext.oldB` value to `newContext.newB`, or uses `2` numeric primitive instead,
   if `previousContext.oldB` was not defined

More lifelike examples:

-   `#{id, name}` : copies corresponding fields from previous `Context`
-   `#{id, name} <= #id, trim(#name)` does the same, but applies `String.trim()` to source value
-   `#{id, name} <= #id, concat(trim(#name),' ',trim(#lastname))`: extracts two properties from the source object, trims
    them and joins them with a predefined string constant
-   `#{counter} <= add(#counter, $increment)`: adds `increment` property of a `Payload` to the `Context`'s `counter`
    property
