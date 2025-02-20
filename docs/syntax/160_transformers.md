---
title: Transformers
---

# Transformers

`Transformers` are projection-type functions that are bundled with `Slice` and translate types between each other.

## Generic Transformers

There are built-in pure functions that operate on any contract type and map the values. They are the basic building
blocks of data manipulation. They can be user-defined and are injected at build-time

### Examples

-   `add($value1, $value2)`
-   `find(#listValue, 'id', 4)`
-   `mult(avg(#listValue), $count)`

## Context Transformers

They translate `Contexts` between each other and are used inside [`Reducers`](110_reducers.html) to update internal data
of the `FSM` when changing `States`. They are defined as a part of `State Dictionary` and can be injected at compile
time.

### Examples

-   `#{stepIndex} <= nextStep(#stepIndex)`
-   `#{email, password, input_error} <= sanitize(#email), sanitize(#password), validate(#email, #password)}`

## Reducer Transformers

Function that translate from `State`+`Action/Payload` to `State/Context` can be injected into `FSM`s at compile time.

-   `#{propertyA, propertyB} = reducerA(#propertyA, $payloadA, reducerB(#propertyB, $payloadB)`

## Model Transformers

Model transformers are a subtype of `Effects` that are context-free and are basically functions that mutates
the `Data Model`.

-   `#{counter} <= add(№counter, increaseGlobalCounter($value))`

They can be composed with `Predicates` to create conditional mutations, but this approach is not recommended, since it
splits the responsibility of `Effects`.

## Built-Ins: Arithmetics

| Function(s) | Argument Type               | Argument Value  | Return Type | Return Value                                                               |
| ----------- | --------------------------- | --------------- | ----------- | -------------------------------------------------------------------------- |
| `add`       | **Number**, [**Number**...] | any numbers     | **Number**  | sum of arguments                                                           |
| `diff`      | **Number**, **Number**      | two numbers     | **Number**  | the second number reduced by the first number                              |
| `mult`      | **Number**, [**Number**...] | any numbers     | **Number**  | product arguments                                                          |
| `div`       | **Number**, **Number**      | two numbers     | **Number**  | the first number divided by the second number                              |
| `pow`       | **Number**, **Number**      | base and power  | **Number**  | exponentiation of two numbers                                              |
| `inc`       | **Number**                  | a single number | **Number**  | shortcut for `add(number,1)`                                               |
| `dec`       | **Number**                  | a single number | **Number**  | shortcut for `add(number,-1)`                                              |
| `neg`       | **Number**                  | a single number | **Number**  | shortcut for `mult(number,-1)`                                             |
| `inv`       | **Number**                  | a single number | **Number**  | shortcut for `div(1,number)`                                               |
| `mod`       | **Number**, **Number**      | two numbers     | **Number**  | first number [modulo](https://en.wikipedia.org/wiki/Modulo) the second one |
| `trunc`     | **Number**                  | a single number | **Number**  | a nearest integer less than the argument                                   |
| `ceil`      | **Number**                  | a single number | **Number**  | a nearest integer greater than the argument                                |
| `round`     | **Number**, [**Number**]    | - Number</br>- Precision = `0` | **Number**  | mathematically rounded `Number` to `Precision` digits. `Precision` must be a non-negative integer   |

## Built-Ins: Special Maths

| Function(s) | Argument Type          | Argument Value  | Return Type | Return Value                             |
| ----------- | ---------------------- | --------------- | ----------- | ---------------------------------------- |
| `sin`       | **Number**             | a single number | **Number**  | sine of the argument                     |
| `cos`       | **Number**             | a single number | **Number**  | cosine of the argument                   |
| `sqrt`      | **Number**             | a single number | **Number**  | square root of the argument              |
| `log`       | **Number**, **Number** | - Number<br/>- Base | **Number**  | logarithm of the `Number` to the `Base`      |
| `ln`        | **Number**             | number          | **Number**  | logarithm of the number to the _e_ base  |
| `lg`        | **Number**             | number          | **Number**  | logarithm of the number to the _10_ base |
| `deg`       | **Number**             | number          | **Number**  | converts degrees to radians              |
| `rad`       | **Number**             | number          | **Number**  | converts radians to degs                 |

## Built-Ins: Statistics

| Function(s)  | Argument Type               | Argument Value                                    | Return Type | Return Value                                                               |
| ------------ | --------------------------- | ------------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `max`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | maximum of passed values                                                   |
| `max`        | **List**                    | list of numbers                                   | **Number**  | maximum of passed list                                                     |
| `min`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | minimum of passed values                                                   |
| `min`        | **List**                    | list of numbers                                   | **Number**  | minimum of passed list                                                     |
| `avg`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | average of passed values                                                   |
| `avg`        | **List**                    | list of numbers                                   | **Number**  | average of passed list                                                     |
| `med`        | **Number**, [**Number**...] | any numbers                                       | **Number**  | median of passed values                                                    |
| `med`        | **List**                    | list of numbers                                   | **Number**  | median of passed list                                                      |
| `sum`        | **List**                    | list of numbers                                   | **Number**  | sum of passed list                                                         |
| `sumsq`      | **List**                    | list of numbers                                   | **Number**  | sum of passed list                                                         |
| `sumProduct` | **List**, [**List**...]     | Numeric lists of the same length | **Number**     | sum of the products of corresponding values in two or more supplied lists |

## Built-Ins: List Transformers

| Function(s) | Argument Type                 | Argument Value                                         | Return Type | Return Value                                                                                                                                      |
| ----------- | ----------------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `len`       | **List**                      | - List                                                 | **Number**  | quantity of items in the `List`                                                                                                                     |
| `lookup`    | **List**, **any**             | - List<br/>- search element                            | **any**     | the `search element`, if it's present in the `List`, `Null` otherwise                                                                            |
| `left`      | **List**, **Number**          | - List<br/>- Length<br/>                               | **String**  | first `Length` items in the `List`                                                                                                                         |
| `right`     | **List**, **Number**          | - List<br/>- Length<br/>                               | **String**  | last `Length` items in the `List`                                                                                                                          |
| `first`      | **List**          | - List<br/>                               | **any**  | first element in the `List`                                                                                                                         |
| `last`     | **List**          | - List<br/>>                               | **any**  | last element in the `List`                                                                                                                          |
| `indexOf`   | **List**, **any**             | - List<br/>- Value                                      | **any**     | zero-based index of `Value`, if it's present in the `List`, `-1` otherwise                                                                          |
| `concat`    | **List**, [**List**...]       | - Lists<br/>                            | **List**     | joins all passed `Lists` consequently and returns a new **List**
| `sample`      | **List**, **Number** | - List<br/>- item count<br/> | **List**    | returns new **List**, containing `N` random items from `List`, without dublicates. `N` is `item count`, if `item count >= 1`. If `item count` is a fraction, `N` is the percentage of total quantity, rounded down |
| `every`      | **List**, **Number**, [**Number**] | - List<br/>- N<br/>- _offset = 0_ | **List**    | returns new **List**, containing every `N`th item items from `List`, starting with `offset` |
| `shuffle`      | **List** | - List<br/> | **List**    | a new **List** that contains the same items as the original `List` but in randomized order |
| `repeat`      | **Number**, **any** | - Quantity<br/>- Value sample | **List** (or **Collection**)    | new **List**, containing `Quantity` replicated instances of `Value sample` |
| `pick`      | **List**, **List** | - Source List<br/>- Keys | **List**    | returns new **List** containing values from `Source List` with indeces in `Keys`, in order of appearance in original `List` |
| `pick`      | **List**, **Number** | - Source List<br/>- Index | **any**    | returns a value from `Source List` at position `Index` |
| `reverse`      | **List** | - Source List<br/> | **List**  | returns a new **List** comprised of `Source List` elements in reverse order |
| `sort` | **List** | - Source List | **List** | returns a new **List** comprised of `Source List` elements in ascending order | 

## Built-Ins: String Transformers

| Function(s) | Argument Type                         | Argument Value                                   | Return Type | Return Value                                                                                                                                              |
| ----------- | ------------------------------------- | ------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `substr`    | **String**, **Number** [, **Number**] | - String<br/>- Start position<br/>- _End position_ | **String**  | a substring of given String, see JS [String.Substring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring) |
| `len`       | **String**                            | - String                                           | **Mumber**  | quantity of symbols in the `String`                                                                                                                         |
| `left`      | **String**, **Number**                | - String<br/>- Length<br/>                       | **String**  | first `Length` symbols of the `String`                                                                                                                             |
| `right`     | **String**, **Number**                | - String<br/>- Length<br/>                       | **String**  | last `Length` symbols of the `String`                                                                                                                              |
| `indexOf`   | **String**, **String**                | - String<br/>- Search substring                  | **any**     | the index of `Search substring`, if it's present in the `String`, `-1` otherwise   
| `concat`    | **String**, [**String**...]       | - Strings<br/>                            | **String**     | joins all passed `Strings` consequently and returns a new **String** |
| `sample`      | **String**, **Number** | - String<br/>- characters count<br/> | **String**    | returns new **String**, containing `N` random symbols from `String`, while every symbol position of input `String` is used at most once. `N` is `character count`, if `character count >= 1`. If `character count` is a fraction, `N` is the percentage of total quantity, rounded down |
| `shuffle`      | **String** | - String<br/> | **String**    | a new **String** that contains the same items as the original `String` but in randomized order |
| `padLeft`      | **String**, **Number**, **String** | -String<br/> - target length<br/>- pattern<br/> | **String**    | prepends `String` with `pattern` repeatedly to approach `target length` as close as possible, without exceeding it. If original `String` is longer than `target length`, returns it immediately |
| `padRight`      | **String**, **Number**, **String** | -String<br/> - target length<br/>- pattern<br/> | **String**    | appends `pattern` to `String` repeatedly to approach `target length` as close as possible, without exceeding it. If original `String` is longer than `target length`, returns it immediately|
| `reverse`      | **String** | - Source String<br/> | **String**  | returns a new **String** comprised of `Source String` characters in reverse order |

## Built-Ins: Object Transformers

| Function(s) | Argument Type                 | Argument Value                                         | Return Type | Return Value                                                                                                                                      |
| ----------- | ----------------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `keys`       | **Object**              | - Object<br/>                      | **List**  | a **List** containing all defined keys of `Object` in enumeration order
| `values`       | **Object**              | - Object<br/>                      | **List**  | a **List** containing all defined values of `Object` in enumeration order
| `zip`       | **List**, **List**              | - Keys list<br/>- Value list                      | **Object**  | new **Object** which keys are created from the `Key list` and values - from the `Value list`. Both **Lists** should be of equal length and contain only **String** and/or **Number** values (or none) |
| `setAttr`       | **Object**, **String**, **any**              | - Object<br/>- Key string<br/>- Value                      | **Object**  | a clone of `Object`, but with its `Key string` property set to `Value` |
| `unsetAttr`       | **Object**, **String**              | - Object<br/>- Key string                      | **Object**  | a clone of `Object`, but with its `Key string` property removed | 
| `merge`       | **Object**, [**Object**...]              | - Destination<br/>- Source objects                      | **Object**  | new **Object** that clones `Destination` with all keys from all `Source objectы` and their respective values copied. When multiple `Source Objects` are passed, eponymous properties are overwritten from right to left, i.e. the latest `Source Object` with given property name takes priority | 
| `intersect`       | **Object**, [**Object**...]              | - Source Objects                      | **Object**  | new **Object** that contains only properties that exist in all provided `Source Objects`. Eponymous properties are overwritten from right to left, i.e. the latest `Source Object` with given property name takes priority | 
| `pick`      | **Object**, **List** | - Source Object<br/>- Keys<br/> | **Object**    | returns new **Object** containing values from `Source List` with keys listed in `Keys`, in order of appearance in original `Object` |
| `pick`      | **Object**, **String** | - Source Object<br/>- Key<br/> | **any**    | returns a single value from `Source Object` with key  `Key` |

## Built-Ins: Collection Transformers

> [!NOTE]
> These functions are meant to work with [Collections](120_value_and_constants.html#collection). Hereby **Collection** type name is explicitely used as type to distinguish from any other **List**, while in the built code those would be the same interface.

| Function(s) | Argument Type                 | Argument Value                                         | Return Type | Return Value                                                                                                                                      |
| ----------- | ----------------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filterBy`  | **Collection**, **String**, **any** | - Collection<br/>- property name<br/>- seek value | **Collection**    | returns new **Collection** that includes only those items from input `Collection` , which have the `property name` attribute equal to `seek value`                  |
| `omit`  | **Collection**, **String**, **any** | - Collection<br/>- property name<br/>- seek value | **Collection**    | returns new **Collection** which excludes items from input `Collection` with `property name` attribute equal to `seek value`                  |
| `find`      | **Collection**, **String**, **any** | - Collection<br/>- property name<br/>- seek value | **Object**    | returns new the first item from the `Collection`, which have the `property name` attribute equal to `seek value`. `Null` is returned if none is found |
| `pluck`      | **Collection**, **String** | - Collection<br/>- property name<br/> | **List**    | returns new **List**, that is comprised of all `property name` attribute values of items in the  `Collection`, in the order of appearance |
| `sort` | **Collection**, [**String**], [**any**] | - Collection<br/>- Key Name = `id`<br/>- Default Value = `Null` | **Collection** | returns a new **Collection** comprised of `Collection` elements, sorted ascendingly by `Key Name` field. If the field is absent, it fallbacks to `Default Value` |

