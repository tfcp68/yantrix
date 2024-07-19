---
title: Javascript API
---

# Javascript API

When generating a JS/TS class, which instance inherits [IAUtomata](../API-Reference/automata/interfaces/IAutomata.html), there are also static properties added to it to help operating the `FSM`

## Identifier

Yantrix codegen lets you specify a paremeter `className`, which whill result in the name of the generated Class. However, when using default imports, this name is lost, while it's could be a good unique identifier, when using a lot of `FSM`s. To keep it, every exported class has a static property `id` containing the same name

```shell
$ yantrix codegen ./slider.mermaid --outfile slider_controller.js --language Javascript --className Slider
```

```javascript
import { Slider } from '../slider_controller.js';
// or
import Slider from '../slider_controller.js';

Slider.id === 'Slider'; // true
```

## State Helpers

## Action Helpers
