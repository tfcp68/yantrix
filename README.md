# Yantrix - Opinionated FSM Framework

Yantrix is a TypeScript framework that provides a set of tools to create robust and self-documented functional applications by code generation. The business logic is represented by declarative, event-driven [finite state machines](https://en.wikipedia.org/wiki/Finite-state_machine), while the application state is an [Anemic Domain Model](https://en.wikipedia.org/wiki/Anemic_domain_model), making it great a counterpart to any traditional state manager like [Redux](https://redux.js.org/), while allowing devs to focus on describing contracts and workflows, rather then writing and debugging the actual code. 

Lends itself perfectly to [Architecture-as-Code](https://jondavid-black.github.io/AaC/) paradigm and no-code/less-code tools for developers, like [n8n](https://github.com/n8n-io/n8n).

## Installation

To install Yantrix, you can use NPM or Yarn:

```
npm install yantrix
```

or

```
yarn add yantrix
```

## Core Concepts

Yantrix suggests the following application model:
- Responsibility layers are built in accordance with slightly adapted [MVC approach](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- an [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture) is used to communicate between layers of "Contoller" part, with a globally available dictionary of `Events`, specific for the Application
- _"Controller"_ is comprised of `Slices`, which are sets of interconnected `FSM`s (finite state machines), which communicate with `Events` and produce `Effects` to update the _"Model"_
- _"View"_ part (including UI and external I/O) is updated asynchronously with a **Render Loop**
- I/O streams are non-duplex and are separated into `Sources`, which generate `Events` for "Controller", and `Destinations`, which are updated when the _"Model"_ has changed
- _"Model"_ component is a serializeable ([anemic](https://en.wikipedia.org/wiki/Anemic_domain_model)) data structure (`Data Model`), which provides a single global store for the whole application, though it can and should be built with composition of `Slices`. It can be propagated to external `Storages` in a asynchronous **Sync Loop**
- the **Main Loop** is taking `Events` from UI and I/O and repeatedly updates the `Data Model` and `Slices` internal states based on their internal rules

The basic building block of state logic is a `FSM` (more specifically - a [Mealy Machine](https://en.wikipedia.org/wiki/Mealy_machine)), which exposes two predefined sets: `Actions` and `States`, with `Transition Matrix` describing the relations between those. Every `Action` type can have a derived `Payload` type, while every `State` has a dependent `Context`, and the latter two represent the current internal state of the machine. 

```mermaid
erDiagram
    DataModel ||..o{ Storage: "is synced to"    
    DataModel ||..o{ UIComponent: "updates"
    UIComponent ||..|{ EventStack: "emits Events"
    StateDictionary ||--o{ StateContextType: "is mapped to"
    ActionDictionary ||--o{ ActionPayloadType: "is mapped to"
    EventDictionary ||--o{ EventMetaType: "is mapped to"
    TransitionMatrix ||--|{ StateDictionary: defines
    TransitionMatrix ||--|{ ActionDictionary: defines
    TransitionMatrix ||..|{ EventAdapter : "observed by"
    EventStack ||..o{ EventDictionary: "maps to"
    FSM ||--|{ TransitionMatrix: defines
    FSM ||--|{ EventAdapter: defines
    Slice ||--|{ EventDictionary: defines
    Slice ||--o{ FSM: contains
    Slice ||--|{ EffectMatrix: defines
    Slice ||--|{ DataModel: defines
    Effects ||..o{ DataModel: updates
    EffectMatrix ||--o{ Effects: contains
    Application ||--|{ Slice: "consists of"
    Application ||..|{ Storage: "is bootstrapped from"    
    Application ||..o{ Sources: "can get data from"
    Application ||..o{ Destinations: "can send data to"
    Application ||--o{ UIComponent: "is represented by"       
    EventAdapter ||..|{ EventStack: "translates Events"
    Sources ||..|{ EventStack: "emits Events"
```

### EDA Loop

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
User-->>VL: User input
DB-->>MDL: Sync application state on launch
Note over SRC,User: Events are emitted by Sources
VL-->>MT:TAutomataEventMetaType<eventId>
SRC-->>MT: TAutomataEventMetaType<eventId>
Note over MT: Incoming Events are pushed to Event Stack
loop Process Event Stack every 1/60s
Note over MT,ED: Pop Event from Event Stack
activate MT
MT->>+EA: TAutomataEventMetaType<eventId>
rect rgba(25,25,25,0.5)
Note over EA,FSM: Translates Events to Actions, as defined by Event Adapter
EA->>FSM: TAutomataEventMetaType<eventId> => TAutomataActionPayload<actionId>
Note over FSM: Declarative Pure Function (Mealy Machine)<br/>Derives new Context based on incoming Actions and current Context
FSM->>FSM: TAutomataStateContext<stateId>, TAutomataActionPayload<actionId> => TAutomataStateContext<stateId>
Note over EA,FSM: Translates Context to Event, as defined by Event Adapter
FSM->>EA: TAutomataStateContext<stateId>
end
Note over EA,MT: Emits Events based on resolved local Context
EA->>-MT: TAutomataStateContext<stateId> => TAutomataEventMetaType<eventId>
note over MT: Push Event to Event Stack
MT->>MT: TAutomataEventMetaType<eventId>
rect rgba(25,25,25,0.5)
Note over MT,ED: Generate Effects as defined by Effect Matrix
MT->>ED: TAutomataEventMetaType<eventId>
Note over ED,MDL: Update Model based on its current state and generated Events
ED->>MDL: TAutomataEventMetaType<eventId>, Store => Store
MDL-->>DB: Sync to Storages
MDL->>MT: Proceed to the newest Event in Event Stack
end
end
Note over MT: Store subscribers are updated
MT-->>+DST: Update Destinations based on Model changes
MT-->>+VL: Update UI based on Model changes
VL-->>-User: Render
DST-->>-User: API Calls
```
