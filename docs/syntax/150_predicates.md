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

A `Model Predicate` tests a read-only `Data Model` snapshot and receives the triggering `Event`. Here an `Effect` increments the counter only when the requested amount fits within its limit.

<!-- eslint ts/naming-convention: off -- Use the application's type names in this example. -->

```typescript
import type { TEffectMatrix } from '@yantrix/automata';
import { createModelFunctions } from '@yantrix/automata';

enum AppEvent {
	Increment = 1,
	Reset = 2,
}

type App = { counter: { value: number; limit: number } };
type AppEventMeta = {
	[AppEvent.Increment]: { amount: number };
	[AppEvent.Reset]: { reason: string };
};

const fx = createModelFunctions<App, AppEvent, AppEventMeta>();
const add = fx.forEvent<AppEvent.Increment>();

const canIncrement = add.predicate(
	model => model.counter,
	(event, counter) => counter.value + (event.meta?.amount ?? 0) <= counter.limit,
);
const increment = add.transformer(
	model => model.counter.value,
	(model, value) => ({ ...model, counter: { ...model.counter, value } }),
	(event, value) => value + (event.meta?.amount ?? 0),
);
const effects = {
	[AppEvent.Increment]: [add.when(canIncrement, increment)],
} satisfies TEffectMatrix<App, AppEvent, AppEventMeta>;
```

`forEvent<AppEvent.Increment>()` binds the key at compile time, so `add` receives `AppEventMeta[AppEvent.Increment] | null` as `Event Meta`. On `fx`, `Event Meta` is the union `AppEventMeta[AppEvent] | null`. The `Effect Matrix` key decides when the handler runs.

`add.all`, `add.any`, and `add.not` compose conditions. `add.all` stops at the first false result and `add.any` stops at the first true result.

For a standalone `createModelPredicate` call, an annotated result supplies the same `Event` key and `Event Meta` map. The selector determines the selected type. If you annotate its parameter, use `TReadonlyModel<App>`. A mutable `App` parameter is too narrow when the `Data Model` contains arrays.

```typescript
import type { TModelPredicate, TReadonlyModel } from '@yantrix/automata';
import { createModelPredicate } from '@yantrix/automata';

const withinLimit: TModelPredicate<App, AppEvent.Increment, AppEventMeta> = createModelPredicate(
	(model: TReadonlyModel<App>) => model.counter,
	(event, counter) => counter.value + (event.meta?.amount ?? 0) <= counter.limit,
);
```

Supply all three type arguments to `TEffectMatrix`. Omitting the `Event Meta` map supplies `any` as the contextual type for `event.meta`.

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
