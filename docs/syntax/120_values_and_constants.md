---
title: Values and Constants
---

# Values and Constants

## Type system

As of now, data contracts in diagrams do not have typings.

When exporting Typescript code, they are declared as `any`. However, FSM itself (it's `States` and `Actions`) is typed
along with [Automata](../API-reference/automata/) instance.

For other languages Yantrix aims to provide compatibility with elementary types, existing in most languages:

- **Numbers**: integer and floats are processed as similarly as possible for a given language
- **Strings**: strings are processed as immutables, i.e. every string function should return a new string rather than
  modify one of its arguments
- **Lists (Tuples)**: Lists and Tuples are processed as similarly as possible for a given language. They also are
  immutable and can only be a read-only argument of the calling function
- **Objects(Dictionaries)**: implementation is highly language-dependent and aims to reproduce the behaviour of
  Typescript [`Record`](../API%-reference/automata/interfaces/IAutomata.html) implementation as closely as possible.
  For `Functions` implementation **Object** arguments should be defined as immutable and read-only.

## Constant declaration

All but **Object** types can be created in-place, as the default value of `Context` or `Payload` property or as a `Function` argument

- `1` or `1.05` is the way to create a Number. Other numeric representations (e.g. hex, exponential, etc.) are supported
  as long as the target language supports them
- `'foo'` creates a String primitive
- `[]` creates an empty List
- `$[foo]` is a compile-time Constant, that is passed to a Codegen along with a Mermaid diagram, primarily being used
  for behaviour that is dependent on environment and/or CI/CD operations.

## Dereferencing with braces

The choice of Data Object to destructure is defined with the following syntax:

- `{KEY_LIST}` describes a `Context` and its properties
- `<= (KEY_LIST)` describes a `Payload`
- `=> (KEY_LIST)`  depends on the directive it's used with:
  - `emit/` directive: `KEY_LIST` references the generated `Event Meta`
  - `subscribe/` directive: `KEY_LIST` references the generated `Payload`
- `(KEY_LIST) =>` is used in `subscribe/` directive and references `Event Meta` of the incoming `Event`
- `$(KEY)` references a single value in `Payload`
- `${KEY}` references a single value in `Context`

## Destructuring Key Lists

The properties extracted from `Data Objects`, which are destructured from them based on their Keys. Listing Keys is like declaring variables, which are members of a dereferenced Data Object.
Key list is defined as the following:

```
KEY_ITEM::=<TARGET_PROPERTY>[=<EXPRESSION>]
KEY_LIST::=KEY_ITEM[,KEY_ITEM...]
```

`Expression` is derived from `Data Object` properties, bound to any of them, see [Expressions](130_expressions.html)

Every `Reducer` can reference any number of variable names both on left and right side of assignment. All required properties are added to the `Context` dynamically, if needed. but each key can be listed only once.

If there're more properties in `Target Object` than in `Source Object` , excessive`Target Object` properties are left
empty.

If there're more properties in `Source Object` than in `Target Object`, such a diagram will throw an Error

```
''' assigns Null to all Context properties
#{ property1, property2, property 3 } <= {} 

''' copies values in order of reference
# { property1, property2, property 3 } <= ( payloadA, payloadB, payloadC )

''' throws an error due to excessive properties on the right side
# { property1, property 2} <= ( payloadA, payloadB, payloadC )
```

## Examples

`#{a, b, c}` describes a `Context` with named properties `a`,`b` and `c`. This notation is a syntactic sugar
for `#{a, b, c} <= #{a, b, c}`, meaning that values are plain copied from the preceding `Context` during the transaction

`#{a, b} <= (a, b)` is similar but copies values from `Payload`, received by a transaction. This implies that the
property names are not necessarily identical, i.e. it could be `#{a, b} <= #(c, d)`, in which case the properties are
copied in the correspoding order: `Context.a` receives the value of `Payload.c`, and `Context.b` is updated
with `Payload.d`.

The same is possible with `Context` too, and basically every `Expression` can be used inside right-side
object: `#{newA,newB} <= {someFunction(oldA), oldB = 2}` does the following:

1. passes `previousContext.oldA` to `someFunction` and puts the output value to `newContext.newA`
2. assigns `previousContext.oldB` value to `newContext.newB`, or uses `2` numeric primitive instead,
   if `previousContext.oldB` was not defined

More lifelike examples:

- `#{id, name}` : copies corresponding fields from previous `Context`
- `#{id, name} <= {id, trim(name)}` does the same, but applies `String.trim()` to source value
- `#{id, name} <= {id, concat(trim(name),' ',trim(lastname))}`: extracts two properties from the source object, trims them and joins them with a predefined string constant
- `#{counter} <= (add(${counter}, increment))`: adds `increment` property of a `Payload` to the `Context`'s `counter` property 

## Languages typings map

| Language | Language Type | Yantrix Type |
|----------|---------------|--------------|
| JS/TS    | String        | String       |
| JS/TS    | Number        | Number       |
| JS/TS    | Array         | List         |
| JS/TS    | Object        | Object       |
| Python   | String        | String       |
| Python   | ??            | Number       |
| Python   | ??            | List         |
| Python   | Dictionary    | Object       |