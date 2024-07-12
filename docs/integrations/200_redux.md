---
title: Redux
---

# Integrating with Redux

The connector allows for integration both with native Redux and with Redux-Toolkit Library. FSMs for Redux integration must be complemented using Typescript codegen, thus providing a [`@yantrix/automata`](..API-Reference/automata/) implementation.

```shell
$ npm install @yantrix/redux @yantrix-codegen
```

build your `FSM`:

```shell
$ yantrix codegen --outfile ../yantrix-generated.ts --language TypeScript --className SampleFSM --eval "A-->B"
```

Import both into the project

```javascript
// importing bridge adapter
import * as Yantrix from '@yantrix/redux';

// import a generated automata
import MyFSM from '../generated/MyFSM.js'; // could be '.ts' too
```

## Connecting to Store

Yantrix-Redux bridge is supposed to operate on a single store object, though it can and should be constructed with slices. When the bridge is imported, provide it with `store` reference:

```javascript
import { createSlice, combineReducers, configureStore } from '@reduxjs/toolkit';
import { createReducer, createInitialState } from '@yantrix/redux';
import MyFSM from '../generated/MyFSM.js';

// create a slice for one Automata or for any number of them
const YantrixSlice = createSlice({
	name: YantrixSliceId,
	// returns a set of Contexts of given FSMs,
	initialState: createInitialState(MyFSM),
	// returns a dictionary of Contexts of given FSMs
	reducers: createReducer(MyFSM),
});

const store = configureStore({
	reducer: combineReducers({
		[YantrixSliceId]: YantrixSlice.reducer,
	}),
});

Yantrix.connect(store);
```

## Adding FSMs

When both a generated `Automata` and the bridge adapter has been imported, register all required `FSM`s in the bridge, providing a mapper to produce Redux Action from `Context` for every `Automata`. In the naivest of scenarios, that would be a plain copying of objects, which is not exactly a Redux way, but it's working

```javascript
import { addFsm } from '@yantrix/redux';

// It's best to have a constant do discriminate every particular integration
// if you for some reason need several isolated Yantrix applicaton inside one web app
const YantrixSliceId = 'yantrixAction';

// provide a string identifier and a mapper for every FSM
addFSM(MyFSM.id, MyFSM, (context) => ({
	type: `${YantrixSliceId}/${MyFSM.id}`,
	payload: {
		fsm_id: MyFSM.id,
		...context,
	},
}));
```

## Integrating with callbacks

A more complex and controllable way of integration would be to provide a single mapping function that would route Redux actions based on sources of invoked transition :

```typescript

const dispatchToRedux
<T extends Automata>(fsm: T) => ()

```

## Integrating with Event Adapters
