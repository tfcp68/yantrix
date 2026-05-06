---
title: Event Model
---

# Event Model

Yantrix uses a reactive event loop to connect external inputs, FSM state machines, and
output destinations. All communication between layers goes through an `EventBus`. The
`CoreLoop` orchestrates the processing: it listens on the bus, translates events into FSM
actions via an `EventAdapter`, feeds them into the automaton, and dispatches the resulting
emitted events back onto the bus.

## Runtime Event Flow

```mermaid
sequenceDiagram
	title Yantrix Runtime Event Flow
	autonumber

	participant SRC as Source
	participant BUS as EventBus
	participant CL as CoreLoop
	participant DST as Destination

	participant FSM as Automata Instance
	participant RR as RootReducer
	participant EA as EventAdapter
	participant ED as EventDictionary

	participant SD as StateDictionary
	participant ADict as ActionDictionary
	participant FR as FunctionRegistry

%% Registration and initialization
	note over CL,FSM: Bootstrapping / codegen runtime wiring
	FSM ->> FR: register(builtInFunctions + userFunctions)
	ED ->> ED: GlobalEventDictionary.addEvents(...) (register automata events)
	CL ->> FSM: new AutomataInstance()
	CL ->> BUS: new BasicEventBus()
	FSM ->> EA: new AutomataEventAdapter()
	CL ->> EA: configure addEventListener/addEventEmitter(...)
	CL ->> BUS: subscribe(observedEvents from EventAdapter.handleEvent)
	CL ->> EA: bind to FSM.eventAdapter

%% Source publishes an external Event
	note over SRC,BUS: External input → Event
	SRC ->> BUS: dispatch(<TAutomataEventMetaType>)

%% EventBus handles the event stack
	loop While stack not empty and !paused
		BUS ->> BUS: _processEvents()
		BUS ->> BUS: shift() next <event, meta>
		BUS ->> CL: callback(eventObject)

	%% CoreLoop uses an adapter to turn Event → Actions
		note over CL,EA: Event → FSM Actions (handleEvent)
		CL ->> EA: handleEvent({event, meta})
		EA ->> EA: run all eventListeners[event]
		EA -->> CL: [ActionPayload...]

	%% For each Action: dispatch in FSM
		loop For each Action in Actions
			CL ->> FSM: dispatch({action, payload})
			note over FSM,RR: FSM delegates state change to generated rootReducer

			FSM ->> FSM: reduceQueue() (queue, if present)
			FSM ->> RR: ({ state, context, action, payload })
			RR ->> RR: evaluate transitions and reducers
			RR ->> FSM: { state': S, context': C }

		%% Updating the state of the machine
			FSM ->> FSM: setContext({ state': S, context': C })

		%% EventAdapter: State → Events
			note over FSM,EA: Transition → Emitted Events
			FSM ->> EA: handleTransition(FSM.getContext())
			EA ->> EA: run all eventEmitters[state]
			EA -->> CL: [EmittedEvents...]

		%% CoreLoop publishes new Events back to EventBus
			CL ->> BUS: dispatch(...EmittedEvents)
		end
	end

	note over BUS,DST: Event → DataPacket → I/O
	BUS ->> DST: bind(bus) (subscription is created)
	BUS ->> DST: update(event, model?)
	DST ->> DST: send(dataPacket) via resolver
	DST ->> DST: requestEmitter() yields {data, result, error}
	note over DST,SRC: External effects: HTTP, UI, FS, API...

%% UI/render as Destination
	BUS ->> DST: bus.subscribe(UI_* events)
	DST ->> SRC: update UI (React/DOM/Redux store, etc.)
```

_Figure 1: Runtime event flow in Yantrix: external events are dispatched to the EventBus,
processed by the CoreLoop through the EventAdapter into actions, reduced by the generated
automaton and its RootReducer, and finally emitted to destinations such as UI or external I/O_

## How event processing works

### 1. External dispatch

A `Source` (UI interaction, timer, API response, or any external trigger) calls
`bus.dispatch(eventMetaObject)`. The event is pushed onto the `EventBus` stack.

### 2. Event to action translation

The `EventBus` processes its stack in a loop. For each event it calls registered subscribers,
one of which is the `CoreLoop`'s callback. The `CoreLoop` passes the event to its
`EventAdapter`, which runs all registered `eventListeners` for that event ID and collects
the resulting `ActionPayload` objects.

### 3. FSM reduction

For each action, the `CoreLoop` calls `fsm.dispatch({ action, payload })`. The automaton
looks up the transition for `(currentState, action)`, calls the generated `reducer` for the
target state, and sets the new `{ state, context }` pair.

### 4. Transition to event emission

After each state change, the `EventAdapter`'s `eventEmitters` for the new state run and
return a list of emitted events. The `CoreLoop` dispatches these back onto the `EventBus`,
which may trigger further processing cycles until the stack is empty or the bus is paused.
