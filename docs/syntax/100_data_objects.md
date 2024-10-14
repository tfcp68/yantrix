---
title: Data Objects
---

# Data Objects

Yantrix implies that business logic is deterministic and is built upon a single anemic `Data Model`. Framework control objects, meanwhile, operate on small atomic "data blocks", interpreted as `Record`-like type (i.e. `Object` in JS, `Dictionary` in Python, and so on). The Most important "data blocks" are

-   `Context`: current condition of a `FSM`, including it's control state and various meta fields
-   `Payload`: a useful data transferred to a `FSM` with each dispatched `Action`, including its id and various meta
    fields
-   `Event Meta`: the same as `Payload` but for `Events` &mdash; messages dispatched through `Event Bus` between `FSMs`

Each of those is represented as a keyed object (dictionary, record, etc.) with each key being processed as a separate var.
In most cases, variables are immutable, and their names are basically labels for the results
of [Expressions](130_expressions.html) calculation assignment.

## Declaring States

Each node of MermaidJS State diagram creates a State and must hava an unique name. It's allowed to use note aliases, bit
they are ignored by Yantrix, and `States` are named with node's literal name.

```mermaid
stateDiagram-v2
	B: RenamedNode (identified as "B")
	A --> B
```
Therefore, this diagram will create a `FSM` with two `States` **A** and **B**, regardless of node **B** title.

State Naming Rules and Conventions:
- Name **must** start with a letter.
- Name **must** contain only letters, digits or underscore characters.
- Name **must** not be longer than 255 characters.
- Name of the state should *unambigiously* convey the current status of the machine, to avoid confusion.
- Names should be kept as clear and concise as possible.
- Name of the state is best represented by a noun or an adjective.

## Declaring Actions

In fact, an `Action` is created automatically with every transition between `States`. If not specified, it's given a
descriptive name based on its starting and ending `State`. However, it's wiser to specify names for transitions. They
will then be exported as [`ActionDictionary`](../API-Reference/automata/interfaces/IActionDictionary.html), allowing
for better typing and [Integrations](../integrations/). `Actions` can be dispatched directly into `FSM` API, or be generated automatically by the attached `Event Adapter`, that translates an `Event` from `Event Bus` to an `Action` with `Payload`.

```mermaid
stateDiagram-v2
	direction LR
	A --> B: AtoB
	A --> A: Loop
	B --> C: BtoC
	[*] --> A: Reset
```

This diagram is exported as `FSM` with 4 `Actions`:

-   **AtoB**
-   **BtoC**
-   **Loop**
-   **Reset**

## Creating Context

To access the `Context` of a given `State`, one should create a `note` for this `State` and
use [`Reducers`](110_reducers.html).

Whenever you list a value on the left side of a `Reducer`, it is added to a `Context` of an attached `State`:

```mermaid
stateDiagram-v2
	A
	note left of A
		#{value}
	end note
```

Every `State` has its own shape of `Context`, but if they are explicitly listed and have identical names &ndash; they
are copied by default. Members that are not mentioned are not copied

```mermaid
stateDiagram-v2
	direction TB
	A --> B: ACTION
	B --> A: ACTION
	note left of A
		''' value1 is copied, value3 is lost
		#{ value1, value2 = '' }
	end note
	note right of B
		''' value1 is copied, value2 is lost
		#{ value1, value3 = 0 }
	end note
```

## Default Context

If you define a member on a default node (`[*]`), it will be copied through every transition and present for
every `State`. The default node also usually leads to a default `State` with a reset-like `Action`, that can be fired
from every other `State`. The following diagram behaves identical to the previous one.

**Tip:** It's a good practice to assign default values to `Context` members, and even more important to do so for the
default `Context`

```mermaid
stateDiagram-v2
	direction TB
	[*] --> A: RESET
	A --> B: ACTION
	B --> A: ACTION
note left of [*]
#{ value1 = 0 }
end note
note left of A
#{ value2 = '' }
end note
note right of B
#{ value3 = 0 }
end note
```

## Creating Payload

`Payload` is a set of properties that is attached to an `Action` and has, like `Context`, a unique shape for every
possible `Action` value. Since `Action` name is a primary key, all `Actions` defined in a diagram must provide
identical `Payload` signature, and this signature is enclosed in brackets (`()`)

```mermaid
stateDiagram-v2
	direction TB
	[*] --> INIT: START (counter)
	INIT --> WORKING: [-]
	state isFinished <<choice>>
	WORKING --> isFinished: REDUCE (value)
	isFinished --> END: isGreater($value, #counter)
	isFinished --> WORKING
	note right of INIT
		+ByPass
		+Init
		#{counter} <= $counter = 10
	end note
	note left of WORKING
		#{counter} <= add(#counter, neg($value = 1))
	end note
	note right of END
		#{counter} <= 0
	end note
```

Here, whenever a **START** Action is dispatched into a `FSM`, `Payload` _must_ contain a `counter` property, which
always brings the FSM to **INIT** `State` and sets `Context` property with the same name. **INIT** `State` itself is
in `ByPass` (see [below](#bypass)), so `FSM` will transition through it synchronously. That means, it is never in
that `State`, so receiving a **START** `Action` will trigger the next transition with that `Action` attached.

## Forks

In the last diagram there is a `Fork` following **WORKING** `State`. Dispatching a **REDUCE** `Action` at that state
will transition to one of two `States` depending on the [`Predicate`](150_predicates.html) execution result.
If `isGreater(#value,#counter)` resolves to a truthy **Binary**,
this `Action` will transition the `FSM` into **END** `State`.
If not, the same `Payload` will be invoked upon **WORKING** `State` again.

`Fork` is a special node that allows to transition to different states, depending on whether a certain condition(or a set of conditions) is met.
Condition that checks if it's possible to traverse a certain path is represented by a [`Predicate`](150_predicates.html) that resolves to a **Binary** value.

Any `Fork` can have multiple branching paths attached to it, and one default path that will be accepted if all other conditions aren't met.

```mermaid
stateDiagram-v2

   state Fork <<choice>>

   Fork --> State1: isGreater($value, #counter)
   Fork --> State2: isZero($value)
   Fork --> State3
```
**Notice:** There can be only one default path for any given `Fork`, which means that only one path can be created without an attached [`Predicate`](150_predicates.html).

Conditions for every fork are processed *in order of their **creation in the diagram syntax**, going from top to bottom*.
Default path for every fork is processed *after processing all other conditions for this fork, **regardless of its location in the diagram syntax***.

A `Fork` can even lead to another `Fork` node, as illustrated by the diagram below:

```mermaid
stateDiagram-v2

   state Fork <<choice>>
   state Fork2 <<choice>>
   
   Fork --> State1: isGreater($value, #counter)
   Fork --> State2: isZero($value)
   Fork --> Fork2
   Fork2 --> State3: isNegative(#counter)
   Fork2 --> State4: isPositive(#counter)
   Fork2 --> State5
```
If no condition on any branching path of the `Fork` is met, and the default path is not specified - the `FSM` will not transition into the next `State`, until the dispatching of the next `Action`.

## State Flags

Flags are special modifiers that alter the behavior of the `State` they a attached to.

### +Init

A created `FSM` will have this `State` at initialization. A diagram can't have more than 1 `State` with `+Init` flag

### +ByPass

A bypassed `State` automatically propagates the acquired `Action` to the next `State`, if such connection exists in the
diagram. The attached `Reducers` are run beforehand, and then the reducers of the outbound `State` are run next.

**WARNING:** `Payload` is not propagated through `ByPass` nodes and must be consumed in them.

This is the same as emitting an `Event` and subscribing to it at the same time, except for this is shorter and must be
used whenever a control `State` must be switched through without any information getting out of the `FSM`. Also note,
that a `+ByPass` `State` can have any number of incoming transitions, but only one outgoing, which is not an `Action`, but is rather coded with `[-]` label:

```mermaid
stateDiagram-v2
	direction LR
	A --> BYPASS: Action1
	B --> BYPASS: Action2
	BYPASS --> EXIT: [-]
	note right of BYPASS
		+ByPass
	end note
```
