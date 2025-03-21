---
title: Values and Constants
---

# Values and Constants

## Type system

As of now, data contracts in diagrams do not have typings.

When exporting Typescript code, they are declared as `any`. However, FSM itself (it's `States` and `Actions`) is typed
along with [Automata](../API/automata) instance.

For other languages, Yantrix aims to provide compatibility with elementary types, existing in most of them:

### Number
Most of state values in a typical app are numeric. Every enumerable list should also be mapped to a number for sake of portability.

Yantrix internals also use numbers as a communication language, with all States, Actions and Events names being stored as numerical codes.

In produced code, integer and float values are processed as similarly as possible for a given language

### Strings
A string is an ordered sequence of characters, i.e. numbers within a certain codepage. All strings in Yantrix are in UTF-8.

Strings are processed as immutables, i.e. every string function should return a new string rather than modify any of its arguments

### Lists (Tuples)
A list is an ordered sequence of same-type values. Lists are used when order matters, but not the position and quantity.
Most oftenly used **Lists** are [**Collections** ](#collection).

A tuple is an ordered sequence of values, that could potentially be of different type, and thus the position in the list defines the semantics of value.
Tuples are used to store values of different nature that are "bound" together by common meaning, and they are usually of fixed length. A good example of a tuple
would be a vector or a message in most binary protocols.

While having different purpose, Lists and Tuples are pretty much identical syntactically, and are processed as similarly as possible in the produced code, assuming they are of most common iterable type for that language.
They also are immutable and can only be a read-only argument of the calling function.
The difference only exists in semantics, i.e. if you use a mapper on a **Tuple** rather than on a **List**, the results might be unexpected.

### Objects

An object, usually called a **Dictionary**, is a _presumably_ unordered set of key-value combinations. Keys are always strings, while values may have arbitrary types. In other words, a dictionary is a one-to-one map between
a **List** and a **Collection**. Keys are unique and can't be empty, making **Objects** a good option to store database records by their primary keys, but also any structured object, basically.

The implementation is highly language-dependent and aims to reproduce the behaviour of Typescript [`Record`](./automata/interfaces/IAutomata.html) implementation as closely as possible.
This also means that keys of an **Object** might have intrinsic enumeration sequence, so order matters. For safety, one should never rely on order of properties in a dictionary,
and only resolve dictionary values by their corresponding key.

**Object** arguments in `Functions` are  immutable and read-only.

## Special types

### Binary
A special type that is used for conditional logic. It is essentially a **Number** but is interpreted as a boolean by the following rules:
-   If the value is `Null` or unset, the `Binary` is falsy
-   If the value is 0 or less, the `Binary` is falsy
-   If the value is 1 or greater, the `Binary` is truthy
-   Otherwise, the value is rounded by mathematic rules and then is compared again

### Collection

This is essentialy a **List** of **Objects**, used to store homogenous structures without an index. This is what is typically returned by REST APIs, database queries and various data sources.
Despite translating to the same type as **List** in the output code, in Yantrix this type is pronounced descretely, and passing a non-compliant **Tuple**/**List** (i.e., having non-homogenous members)
to a function that is explicitely designed to work with **Collections** will throw an error

### Function
Special type exists for [Functions](140_functions.html), when they are used as another `Function` parameter, such as in `map`- and `filter`-style iterators. This only works
when building for languages where callables are [first-class citizens](https://en.wikipedia.org/wiki/First-class_citizen). As of now, all output languages supported by Yantrix do qualify.

## Properties

Properties are named members of [`Data Objects`](100_data_objects.html). Inside Yantrix intestines `Payload`,`Context`
and `Event Meta` are [`Objects`](#objects), and top-level properties of them can be extracted by name. Deeper nested values (i.e., when property is of `Object` type) are extracted with special [`Functions`](140_functions.html)

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

Default values are assigned to vars when the requested property is absent in `Data Object` or equals to `Null` (an empty pointer). To assign a default value
the `KEY_ITEM` is followed by `=` and a [`Constant`](#constant-declaration) or [`Expression`](130_expressions.html). For instance:

```
#{anyValue, stringValue = 'foobar', numericValue = cos(div(%%pi,6))}
```

Default values can be used both in `Source Objects` and in `Target Objects` in `Reducers`, but they behave differently on either side of `<=` token: left-side defaults are used when corresponding right side expression converges to `Null`, while right-side defaults are used when attached references are absent in `Data Object` or equal to `Null`.

In the following example `value1` and `value2` will not be set to `1` if they already have values, but they will acquire `1` as a starting value when the Context is created for the first time

```
#{value1, value2} <= #value1 = 1, #value2 = 1
''' same as
#{value1 = 1, value2 = 1} <= #value1, #value2
''' same as shortcut
#{value1 = 1, value2 = 1 }
```

a difference emerges is there's a `Function` in `Expression`:

```
''' in this example, value2 can become Null after the computation
''' if "funcValue" call returns Null, even though value2 has a default value
#{value1, value2} <= #value1 = 1, funcValue(#value2 = 1)

''' however, if also assigned on the left side, it resolves to a default value
#{value1, value2 = 1} <= #value1 = 1, funcValue(#value2 = 1)
```

When used on both sides of a `Reducer`, the `Source Object` execution takes precedence when assigning default values, i.e., the
code `#{a = 1} <= $b = func(2)` is processed in the following manner:

-   `b` is read from `Payload`. If it's absent or `Null`, the `func` is invoked with a parameter of `2`. The resulting value is assigned to `$b`.
-   if the value is set, it's assigned to `a` property of the resulting `Context`. If the expressions resolves to `Null`, that property is filled with value of `1`

Thus, if no `Payload` was given, or it doesn't have `b` key, `Context`.`a` contents will depend on what is returned by `func(2)` call.

## Constant declaration

All but **Object** types can be created in-place, as the default value of `Context` or `Payload` property or as
a `Function` argument

-   `1` or `1.05` is the way to create a **Number**. Other numeric representations (e.g. hex, exponential, etc.) are
    supported
    as long as the target language supports them. Numbers are automatically typecasted to **Binary** if needed
-   `'foo'` creates a **String** primitive
-   `[]` creates an empty List
-   `%%foo` is a compile-time Constant, that is passed to a Codegen along with a diagram, primarily being used for behaviors that are dependent on environment and/or CI/CD operations.

## Examples

`#{a, b, c}` describes a `Context` with named properties `a`,`b` and `c`. This notation is a syntactic sugar
for `#{a, b, c} <= #a, #b, #c`, meaning that values are plain copied from the preceding `Context` during the transaction

`#{a, b} <= $a, $b` is similar but copies values from `Payload`, received by a transaction.

It could be `#{a, b} <= $c, $d`, in which case the properties are
copied in the correspoding order: `Context.a` receives the value of `Payload.c`, and `Context.b` is updated
with `Payload.d`.

The same is possible with `Context` too, and basically every `Expression` can be used on the right side of reducer: `#{newA,newB} <= someFunction(#oldA), #oldB = 2` does the following:

1. passes `previousContext.oldA` to `someFunction` and puts the output value to `newContext.newA`
2. assigns `previousContext.oldB` value to `newContext.newB`, or uses `2` numeric primitive instead,
   if `previousContext.oldB` was not defined or set to `Null`

More lifelike examples:

-   `#{id, name}` : copies corresponding fields from previous `Context`
-   `#{id, name} <= #id, trim(#name)` does the same, but applies `String.trim()` to source value
-   `#{id, name} <= #id, concat(trim(#name),' ',trim(#lastname))`: extracts two properties from the source object, trims
    them and joins them with a predefined string constant
-   `#{counter} <= add(#counter, $increment)`: adds `increment` property of a `Payload` to the `Context`'s `counter`
    property
