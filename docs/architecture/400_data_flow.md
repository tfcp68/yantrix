---
title: Data Flow
---

# Data Flow

## Data Model

Regardless of what's happening in the outside world, there's always a data snapshot of Application which is fully descriptive of its behaviour. This snapshot is stored in a `Data Model` &mdash; a global anemic storage that can be accessed via API. `Data Model` is something like a savegame, which can be used to serialize the application state to a text format and then instantiate the application to a previously saved state. Sometimes, minor conditions are not preserved, because they are stored inside `FSM`s instead, but most often than not `Data Model` is an application-global store, similar to Redux, which can be observed partially or extensively to update UI and endpoints.

## Data Sources

`Data Sources` are the lowest level abstractions in Yantrix. They represent the driving force of all the things in the Universe &ndash; Data. It is packed into [`Data Objects`](../syntax/100_data_objects.html) and moves the pieces of framework, such as `FSM`s, `Slices` and `Event Bus`, which is the preferred way. In Yantrix, while `FSM`s and `Data Model` are abstractions that store "internal" state of the Application, the external state of the environment has no single interface. Instead, various abstractions are used to produce declarative `Events`, that are processed synchronously. In real world scenarios, those would be:

-   Remote APIs, webhooks
-   Network streams: WebSockets, WebRTC, UDP
-   Message brokers, like Kafka or RabbitMQ
-   UI and peripherals
-   Internal Timers inside App
-   Environment: pipes, sockets, system clock, file system, OS or WEB APIs

Each of those can have slightly varying interfaces, but generally they are one of two:

-   Polling APIs for `Events`
-   Receiving `Events` through an exposed API

Yantrix can be used both for frontend and backend apps, and the choice of build target defines which approach is favorable in any given case.

## Event Adapters

## Effects

## Full Cycle

```mermaid
sequenceDiagram
	box rgba(25,0,25,0.25) [Representation Layer]<br/>~~~</br>UIs, APIs, Sockets, Timers
		participant DST as Destinations
		participant SRC as Sources
		participant VL as UI
		actor User as I/O
	end
	box rgba(0,25,0,0.25) [Business Logic Layer]<br/>~~~</br>Declarative Code, Language Models, GUI Editor
		participant MT as Main Loop (Event Model)
		participant EA as Event Adapter (Mapping Matrix)
		participant FSM as FSM (Transition Matrix)
		participant ED as Effect Dictionary(Reduction Matrix)
	end
	box rgba(50,0,0,0.25) [Data Model Layer]<br/>~~~</br>Memory, DBs, Cloud Storage,<br/> File System, Blockchain
		participant MDL as Store (Anemic Data)
		participant DB as Storages (Persistent)
	end
	User -->> VL: User input
	DB -->> MDL: Sync application state on launch
	Note over SRC, User: Events are emitted by Sources
	VL -->> MT: TAutomataEventMetaType<eventId>
	SRC -->> MT: TAutomataEventMetaType<eventId>
	Note over MT: Incoming Events are pushed to Event Stack
	loop Process Event Stack every 1/60s
		Note over MT, ED: Pop Event from Event Stack
		activate MT
		MT ->>+ EA: TAutomataEventMetaType<eventId>
		rect rgba(25,25,25,0.5)
			Note over EA, FSM: Translates Events to Actions, as defined by Event Adapter
			EA ->> FSM: TAutomataEventMetaType<eventId> => TAutomataActionPayload<actionId>
			Note over FSM: Declarative Pure Function (Mealy Machine)<br/>Derives new Context based on incoming Actions and current Context
			FSM ->> FSM: TAutomataStateContext<stateId>, TAutomataActionPayload<actionId> => TAutomataStateContext<stateId>
			Note over EA, FSM: Translates Context to Event, as defined by Event Adapter
			FSM ->> EA: TAutomataStateContext<stateId>
		end
		Note over EA, MT: Emits Events based on resolved local Context
		EA ->>- MT: TAutomataStateContext<stateId> => TAutomataEventMetaType<eventId>
		note over MT: Push Event to Event Stack
		MT ->> MT: TAutomataEventMetaType<eventId>
		rect rgba(25,25,25,0.5)
			Note over MT, ED: Generate Effects as defined by Effect Matrix
			MT ->> ED: TAutomataEventMetaType<eventId>
			Note over ED, MDL: Update Model based on its current state and generated Events
			ED ->> MDL: TAutomataEventMetaType<eventId>, Store => Store
			MDL -->> DB: Sync to Storages
			MDL ->> MT: Proceed to the newest Event in Event Stack
		end
	end
	Note over MT: Store subscribers are updated
	MT -->>+ DST: Update Destinations based on Model changes
	MT -->>+ VL: Update UI based on Model changes
	VL -->>- User: Render
	DST -->>- User: API Calls
```
