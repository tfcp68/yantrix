---
title: Javascript API
---

# Javascript API

When generating a JS/TS class, it has `@yantrix/core` as dependency and implements [IAutomata](../API/automata/interfaces/IAutomata.html) interface. The exported class also has static properties to facilitate operating the `FSM` and its constants.

The snippets below use the [Quick Start slider diagram](../#quick-start).

## Identifier

The `className` option names the generated class. Its static `id` combines that name with a generation timestamp.

```shell
$ yantrix codegen ./slider.mermaid --outfile slider_controller.js --language JavaScript --className Slider
```

```javascript
import { Slider } from './slider_controller.js';
```
or
```javascript
import Slider from './slider_controller.js';
```
```javascript
Slider.id.startsWith('Slider_'); // true
```

## State Helpers

Internally, `IAutomata` operates on numeric states. To address `States` from the diagram, they must be wrapped in a helper:

```javascript
import Slider from './slider_controller.js';

Slider.getState('ENABLED'); // returns the numeric ID of this state
```

There's also a helper to check if the `FSM` is in a particular `State` right now:

```javascript
const slider = new Slider();

Slider.hasState(slider, 'ENABLED'); // true
// this is the same as
Slider.getState('ENABLED') === slider.getContext().state;
```

## Action Helpers

To invoke an `Action`, a [dispatch](../API/automata/interfaces/IAutomata.html#dispatch) method should be used. Since it accepts numeric ids, they also have to be mapped.

```javascript
Slider.getAction('DISABLE');
Slider.getAction('ENABLE');
```

Since most of the time you need to pass a `Payload` object into `dispatch`, there's a helper to create a `Payload`:

```javascript
const payload = Slider.createAction('RESET', {
	min: 0,
	max: 50,
});

slider.dispatch(payload);
```

## Dictionaries

Generated modules export two kinds of dictionaries both for `Actions` and `States`, that are suggested to be used as reference constants when addressing their identifiers:

```javascript
import { actionsDictionary, actionsMap } from './slider_controller.js';

actionsMap.DISABLE === 'DISABLE'; // true
actionsDictionary.DISABLE === Slider.getAction('DISABLE'); // true

slider.dispatch(Slider.createAction(actionsMap.DISABLE, {}));
```

Same dictionaries are provided for `State`s:

```javascript
import { statesDictionary, statesMap } from './slider_controller.js';

statesDictionary.ENABLED === Slider.getState(statesMap.ENABLED); // true
```

## Typescript

In typescript versions [Dictionaries](#dictionaries) are available as types too:

```typescript
import type { statesMap, TActionsSlider } from './slider_controller.js';

type TActionLiteral = TActionsSlider;
type TStateLiteral = keyof typeof statesMap;
```

## Generated Effects and Slice

When a diagram contains `effect/<NAME>`, JavaScript and TypeScript modules also
export two composition helpers:

```typescript
const matrix = createSliderEffectMatrix(modelTransformers);
const slice = createSliderSlice(modelTransformers);
```

The matrix maps generated numeric Event IDs to the supplied Model Transformers.
The Slice contains both that matrix and a generated FSM instance, so application
code normally registers `slice` through `CoreLoop.registerSlice()` rather than
registering `matrix` and the FSM independently.

TypeScript output additionally exports `TSliderDataModel`,
`TSliderEffectEvent`, `TSliderEventMeta` and `TSliderModelTransformers`. Because
the diagram does not describe the complete global Data Model schema, the
factory is generic and its default model type is `Record<string, unknown>`.

See [Side Effects](../syntax/300_side_effects.html) and
[Core Runtime API](180_core_runtime.html) for a complete composition example.
