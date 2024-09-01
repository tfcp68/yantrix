---
title: Introduction
---

# Yantrix

Yantrix is a TypeScript framework that provides a set of tools to create robust and self-documented functional applications by code generation.
The business logic is represented by declarative, event-driven [finite state machines](https://en.wikipedia.org/wiki/Finite-state_machine), while the application state is an [Anemic Domain Model](https://en.wikipedia.org/wiki/Anemic_domain_model), making it great a counterpart to any traditional state manager like [Redux](https://redux.js.org/), while allowing devs to focus on describing contracts and workflows, rather than writing and debugging the
actual code.

Lends itself perfectly to [Architecture-as-Code](https://jondavid-black.github.io/AaC/) paradigm and no-code/less-code tools for developers, like [n8n](https://github.com/n8n-io/n8n).

## Quick Start

Let's build a slider component. First, we need a diagram for a State Machine describing its behaviour. The diagram is written in [Yantrix subsyntax](./syntax/) of [Mermaid](https://mermaid.js.org/) and can be visualized directly with that awesome library. Click on `<>` button to see the source code:

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
	note left of ENABLED
		+Init
		#{min, max}<=$min, $max
	end note
	note right of SETTING
		+ByPass
		#{value}<=min(#max,max(#min,$value))
	end note
	note right of INCREMENT
		+ByPass
		#{value}<=min(#max,max(#min,add(#value,$by))
	end note
	note right of DECREMENT
		+ByPass
		#{value}<=min(#max,max(#min,diff($by,#value))
	end note
note right of [*]
#{min, max, value}
end note
```

The details of what's going on here are explained [below](#syntax-breakdown). For now, assume it's saved to a file named `slider.mermaid`. Then, we pass that source to a code generator and choose a language we need

```shell
$ yantrix codegen ./slider.mermaid --outfile slider_controller.js --language Javascript --className Slider
```

Now, we import the generated file into your projects:

```javascript
import Slider from './slider_controller.js';

const SLIDER_MAX = 1000;
const SLIDER_MIN = -1000;

const SliderController = new Slider();

SliderController.dispatch(
	Slider.createAction('RESET', {
		min: SLIDER_MIN,
		max: SLIDER_MAX,
	}),
); // adjusted to local needs

/*
 * ...somewhere later on at UI ...
 */

// bind these to buttons and/or keys
const rightHandler = () => SliderController.dispatch(Slider.createAction('INCREASE', { by: 50 }));
const leftHandler = () => SliderController.dispatch(Slider.createAction('DECREASE', { by: 50 }));

// bind this to a click handler, using relative coordinate
const setHandler = (percentage) =>
	SliderController.dispatch(
		Slider.createAction('SET', {
			value: SLIDER_MIN + percentage * (SLIDER_MAX - SLIDER_MIN),
		}),
	);

// use this to display value in the GUI
const getSliderValue = () => SliderController.getContext().value;

// and this - to prevent UI from changing the slider value
const isDisabled = () => Slider.hasState(SliderConroller, 'DISABLED');
```

Or you can use one of the available [Integrations](./integrations/) with a framework of your choice, i.e. [Redux](./integrations/200_redux.html)

## Syntax Breakdown

Let's see what's happening in depth. The diagram describes an [`FSM`](concepts/200_FSM.html), &mdash; a finite state machine, a control object that is characterized by a limited set of `States`, and it always resides in one and only one of them.

### States

Every `State` is independent on another and difference between `States` is _qualitative_, i.e. they represent some scenarios in App that are independent on each other and never happen simultaneously:

-   Slider is usable and idle (enabled)
-   Slider can't be interacted with (disabled)
-   Slider is being switched to a particular position
-   Slider is being nudged left or right

```mermaid
stateDiagram-v2
	direction TB
	ENABLED
	DISABLED
	SETTING
	INCREMENT
	DECREMENT
```

### Actions

To change the `State` of the machine, an `Action` must be invoked. Every `Action` has a unique name, and the first layer of diagram is essentially a graph that depicts which `Actions` lead to which `States`.

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
```

Also note that not every `Action` can be invoked from every `State` by default. A `[*]` node is used to define an `Action` that can be invoked from every `State`. The binding between `States` and `Action` define a [many-to-many relation](https://en.wikipedia.org/wiki/Incidence_matrix), called `Transition Matrix`, that is another way to define the `FSM`. Every item in this matrix is either null or an `Action` name, while columns and rows correspond to `States` in the same order.

| From/To      | ENABLED | DISABLED |
| ------------ | ------- | -------- |
| _any_        | RESET   |          |
| **ENABLED**  |         | DISABLE  |
| **DISABLED** | ENABLE  |          |

### Payload

Every `Action` can carry a `Payload`, which is a plain data object that represents some meta-information about the change requested by it. For instance, when resetting (instantiating) a Slider, it's wise to provide its min and max values. `Payload` is represented with a list of parameters in parentheses, each possible having a default value:

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
```

Technically, nudging Slider can be processed the same way as setting it directly, by an only `Action`, carrying a polymoprhic `Payload`, allowing to either adjust value or to set it directly:

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> ENABLED: MODIFY(value, diff)
```

However, different behaviours are better to be represented with different `States`.

### Intermediary States

While `FSM` is transactional and synchronous (i.e. no further computation is done until the invoked `Action` has been processed), most interactions are asynchronous by nature, and they have some in-between state, usually called "pending" in this context.

In fact, even synchronous operations could have an intermediate `State` which actually does computations, and this would be an advised design pattern. As you can guess, those operations then could be easily plugged in with async functionality, behaving as a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
```

here we define 3 `Actions` and 3 corresponding intermediate `States` for them:

-   `SET (value)` &ndash; a direct assignment of the Slider value, leading to **SETTING** `State` and carrying new value in `Payload`
-   `INCREASE (by)` &ndash; an increment of the Slider value, leading to **INCREMENT** `State` and carrying a difference in `Payload`
-   `DECREASE (by)` &ndash; a decrement of the Slider value, leading to **DECREMENT** `State` and carrying a difference in `Payload`

Here we use `[-]` labels on `Actions`, which is a special symbol for [ByPass](/syntax/100_data_objects.html#bypass) `Action`. Now, to emphasize that we need to add _Notes_ to `States` to describe their behaviour:

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
	note right of SETTING
		+ByPass
	end note
	note right of INCREMENT
		+ByPass
	end note
	note right of DECREMENT
		+ByPass
	end note
```

Our Transition Matrix now looks like this:

| From/To   | ENABLED  | DISABLED | INCREMENT | DECREMENT | SETTING |
| --------- | -------- | -------- | --------- | --------- | ------- |
| _any_     | RESET    |          |           |           |         |
| ENABLED   |          | DISABLE  | INCREASE  | DECREASE  | SET     |
| DISABLED  | ENABLE   |          |           |           |         |
| INCREMENT | INCREASE |          |           |           |         |
| DECREMENT | DECREASE |          |           |           |         |
| SETTING   | SET      |          |           |           |         |

### Context

Now, we need to define `Context` &mdash; values that are stored within `FSM` along with the current `State` and represent some of its _quantitative_ properties. We define it with [Reducers](./syntax/110_reducers.html) along with `State`, and they are calculated whenever the `FSM` is switched to that `State`. The `Reducers` defined at `[*]` node are run on **every** transition, and the `Context` properties found there are persistent through every `Action`, unless specified otherwise.

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
	note right of SETTING
		+ByPass
	end note
	note right of INCREMENT
		+ByPass
	end note
	note right of DECREMENT
		+ByPass
	end note
note left of [*]
#{min, max, value}
end note
```

here we have defined 3 `Context` properties, that are copied from the previous values with every `Action`:

-   **value** stores current Slider position
-   **min** stores minimal selectable value
-   **max** stores maximal selectable value

### Initial Context

When **RESET** `Action` is invoked, a new **min** and **max** values can be set with `Payload`. Since that `Action` resolves to **ENABLED** `State`, that's where the related `Reducer` belongs:

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
	note left of ENABLED
		+Init
		#{min, max} <= $min, $max
	end note
	note right of SETTING
		+ByPass
	end note
	note right of INCREMENT
		+ByPass
	end note
	note right of DECREMENT
		+ByPass
	end note
note right of [*]
#{min, max, value}
end note
```

Here we have also specified that **ENABLED** is the starting `State` of the `FSM` with [Init flag](/syntax/100_data_objects.html#init).

### Operations on data

Now we specify the arithmetics for intermediate "nudge" `States` **INCREMENT** and **DECREMENT**, which will add or substract, respectively, the provided `Payload` property **by** to/from stored **value** in `Context` :

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
	note left of ENABLED
		+Init
		#{min, max}<=$min, $max
	end note
	note right of SETTING
		+ByPass
	end note
	note right of INCREMENT
		+ByPass
		#{value}<=min(#max,max(#min,add(#value,$by))
	end note
	note right of DECREMENT
		+ByPass
		#{value}<=min(#max,max(#min,diff($by,#value))
	end note
note right of [*]
#{min, max, value}
end note
```

Note that we use built-in [Transformer Functions](./syntax/160_transformers.html) `min`,`max`,`add` and `diff` here in such a manner, that the resulting **value** always stays within **min** and **max** bounds.

Finally, we write a simple assignment `Reducer` for **SETTING** intermediate `State`, that will copy **value** from `Paylod` to `Context`, and we are done:

```mermaid
stateDiagram-v2
	direction LR
	[*] --> ENABLED: RESET (min=0, max=100)
	ENABLED --> DISABLED: DISABLE
	DISABLED --> ENABLED: ENABLE
	ENABLED --> SETTING: SET (value)
	SETTING --> ENABLED: [-]
	ENABLED --> INCREMENT: INCREASE (by=1)
	INCREMENT --> ENABLED: [-]
	ENABLED --> DECREMENT: DECREASE (by=1)
	DECREMENT --> ENABLED: [-]
	note left of ENABLED
		+Init
		#{min, max} <= $min, $max
	end note
	note right of SETTING
		+ByPass
		#{value} <= min(#max, max(#min, $value))
	end note
	note right of INCREMENT
		+ByPass
		#{value} <= min(#max, max(#min, add(#value, $by))
	end note
	note right of DECREMENT
		+ByPass
		#{value} <= min(#max, max(#min, diff($by, #value))
	end note
note right of [*]
#{min, max, value}
end note
```

Now, it's only about dispatching proper `Payloads` to the `FSM`.

## What's next?

-   See [Sample FSM Designs](./concepts/999_design_examples.html) and [generate some code](./API-Reference/codegen/)
-   Learn Yantrix [Syntax](./syntax) and try making an `FSM` of your own
-   Try some [Integrations](./integrations) with your favorite frameworks to achieve fast results
-   Read more on [framework architecture](./concepts) and how to expand beyond one `FSM` into `Slice`s and built a whole `Application` on Yantrix
-   If you like what you get, consider [Contributing](./contributing) or resolving some [Issues](https://github.com/tfcp68/yantrix/issues)
