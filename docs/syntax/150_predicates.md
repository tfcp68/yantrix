---
title: Predicates
---

# `Predicates`

`Predicates` return a boolean. `Built-in Predicates` and `Context Predicates` can select a branch inside an `FSM`.

## `Built-in Predicates`

Bundled within Yantrix grammar, they are used to combine other `Predicates` and implement logical operations
like `not`, `and` and so on.

### Examples

-   check the oddity of value: `isEven(value)`
-   compare two numbers: `isGreater(value, reference)`
-   compare with a constant: `isLowerOrEqual(value, 0)`
-   test if a sample is in the set: `includes(listValue, sample)`
-   test if any condition succeeds:

```
any(isGreater(value, 0), not(includes(listValue, 'sample')), isGreater(len(stringValue), 0))
```

## `Model Predicates`

A `Model Predicate` tests a read-only `Data Model` snapshot and receives the triggering `Event`, including its `Event Meta`. Use `createModelPredicate` to select the model value the condition needs.

```typescript
const canIncrement = createModelPredicate<AppModel, Counter, AppEvent.Increment, AppEventMeta>(
	model => model.counter,
	(event, counter) => counter.value + (event.meta?.amount ?? 0) <= counter.limit,
);
```

`allModelPredicates`, `anyModelPredicates`, and `notModelPredicate` compose these conditions and preserve normal
short-circuit semantics. A `Model Predicate` can also guard an `Effect` through `whenModel`.

For example, a `Source` can put an authorization decision in `Event Meta`. The `Event Adapter` maps it into the `Action Payload` so the `FSM` can use it when selecting a transition.

## `Context Predicates`

Are declared within a `Slice` and its `State Dictionary`, and have a `State`/`Context` pair as a dependency. It's
designed to create decision branching within `Forks` and create domain-specific logic

### Examples

-   `isRequestComplete()`
-   `isFocused(input_id)`
-   `hasItemsinQueue(queue)`

## Built-Ins: Binary Predicates

Most elementary logic is builtin into Yantrix, i.e. those functions can be used in any `Reducer` or `Expression`:

| Function(s)  |                 Signature                  |        Arguments         | Returns                             |
| :----------- | :----------------------------------------: | :----------------------: | ----------------------------------- |
| `and`, `all` | (**Binary**, **Binary**, ..) => **Binary** | Any number of conditions | a boolean conjuction of conditions  |
| `or`, `any`  | (**Binary**, **Binary**, ..) => **Binary** | Any number of conditions | a boolean disjunction of conditions |
| `not`        |         (**Binary**) => **Binary**         |    A single condition    | a boolean negation                  |
| `none`       | (**Binary**, **Binary**, ..) => **Binary** | Any number of conditions | equivalent to `not(and(...))`       |

## Built-Ins: Numeric Predicates

| Function(s)        |               Signature                |    Arguments    | Returns                                                               |
| :----------------- | :------------------------------------: | :-------------: | --------------------------------------------------------------------- |
| `isEven`           |       (**Number**) => **Binary**       | A numeric value | truthy if the number is even                                          |
| `isOdd`            |       (**Number**) => **Binary**       | A numeric value | truthy if the number is odd                                           |
| `isInteger`        |       (**Number**) => **Binary**       | A numeric value | truthy if the number is integer                                       |
| `isEqual`          |        (any, any) => **Binary**        |   Any values    | truthy if the arguments are of the same type and have identical value |
| `isGreater`        | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 > number2                                 |
| `isGreaterOrEqual` | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 > number2                                 |
| `isLess`           | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 < number2                                 |
| `isLessOrEqual`    | (**Number**, **Number**) => **Binary** |   Two numbers   | truthy if the first number1 <= number2                                |
| `isNegative`       |       (**Number**) => **Binary**       | A numeric value | truthy if the number is less than 0                                   |
| `isPositive`       |       (**Number**) => **Binary**       | A numeric value | truthy if the number is greater or equal to 0                         |

## Built-Ins: Lookup Predicates

| Function(s) |               Signature                |                    Arguments                    | Returns                                                                             |
| :---------- | :------------------------------------: | :---------------------------------------------: | ----------------------------------------------------------------------------------- |
| `contains`  | (**String**, **String**) => **Binary** |                   two strings                   | truthy if the string1 includes string2, compared bytewise                           |
| `contains`  |     (**List**, any) => **Binary**      |  an array-like structure and a value to search  | truthy if the the **List** includes the second value, compared by type and bytewise |
| `contains`  | (**Object**, **String**) => **Binary** | A dictionary-like structure and a search string | truthy if the the **Object** has a _value_ with a name of the **String** parameter  |
| `has`       |  (**List**, **Number**) => **Binary**  |   an array-like structure and a search index    | truthy if the the **List** has an _index_ equal to **Number**                       |
| `has`       | (**Object**, **String**) => **Binary** | A dictionary-like structure and a search string | truthy if the the **Object** has a _key_ with a name of the **String** parameter    |
| `isNull`    |      (`Expression`) => **Binary**      |                 an `Expression`                 | is truthy when the passed `Expression` can not be defined                           |
