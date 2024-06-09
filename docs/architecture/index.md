---
title: Framework Architecture
---

Yantrix provides a set of mixed functional and objective APIs, each of them being self-sufficient for a particular application layer.
However, when used together they form an all-around framework that manages things like:

-   Sync and Async I/O
-   Timers, Events and integrations
-   Declarative data storage
-   Application State management

Being primary a Typescript solution, the intended application is mostly Frontend, working well with libraries like React and Redux.
Due to its codegen approach Yantrix could work well in Svelte environment and "dumb" s2s NodeJS integrations.

## APIs relation diagram

```mermaid
erDiagram
	DataModel ||..o{ Storage: "updates"
	DataModel ||--o{ ModelPredicates: declares
	DataModel ||..o{ UIComponent: "updates"
	UIComponent ||..|{ EventStack: "emits Events"
	EventDictionary ||--|{ EventMetaType: "is mapped to"
	EventStack ||..o{ EventDictionary: "maps to"
	FSM ||..|{ EventAdapter: references
	FSM ||..o{ ActionPayloadType: references
	FSM ||..o{ StateContextType: references
	StorageAdapter ||..|{ Storage: "syncs with"
	Slice ||..o{ EventDictionary: references
	Slice ||--o{ ActionDictionary: declares
	Slice ||--o{ FSM: "consists of"
	Slice ||--o{ StateDictionary: declares
	Slice ||--o{ StorageAdapter: declares
	Slice ||--|{ EffectMatrix: declares
	StateDictionary ||--o{ StateContextType: "is mapped to"
	StateDictionary ||..|{ ContextPredicates: "declares"
	ActionDictionary ||--o{ ActionPayloadType: "is mapped to"
	Effect ||..|{ DataModel: updates
	EffectMatrix ||--o{ Effect: declares
	Application ||--|{ Slice: "consists of"
	Application ||--o{ UIComponent: "is represented by"
	Application ||--|{ DataModel: declares
	DataModel ||..o{ Destinations: updates
	Application ||--o{ Destinations: declares
	EventAdapter ||..|{ EventStack: "translates Events"
	Sources ||..|{ EventStack: "emits Events"
	Application ||..o{ Sources: "declares"
```

## Data Flow

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
