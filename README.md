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
- _"Controller"_ is comprised of `Slices`, which are sets of interconnected `FSMs` (finite state machines), which communicate with `Events` and produce `Effects` to update the _"Model"_
- _"View"_ part (including UI and external I/O) is updated asynchronously with a **Render Loop**
- I/O streams are non-duplex and are separated into `Sources`, which generate `Events` for "Controller", and `Destinations`, which are updated when the _"Model"_ has changed
- _"Model"_ component is a serializeable ([anemic](https://en.wikipedia.org/wiki/Anemic_domain_model)) data structure (`Data Model`), which provides a single global store for the whole application, though it can and should be built with composition of `Slices`. It can be propagated to external `Storages` in a asynchronous **Sync Loop**
- the **Main Loop** is taking `Events` from UI and I/O and repeatedly updates the `Data Model` and `Slices` internal states based on their internal rules

### Onthology
```mermaid
erDiagram
    DataModel ||..o{ Storage: "updates"    
    DataModel ||..o{ UIComponent: "updates"
    UIComponent ||..|{ EventStack: "emits Events"
    StateDictionary ||--|{ StateContextType: "is mapped to"
    ActionDictionary ||--|{ ActionPayloadType: "is mapped to"
    EventDictionary ||--|{ EventMetaType: "is mapped to"
    TransitionMatrix ||..o{ StateDictionary: references
    TransitionMatrix ||..o{ ActionDictionary: references
    TransitionMatrix ||--|{ EventAdapter : "is declared by"
    EventStack ||..o{ EventDictionary: "maps to"
    FSM ||--|{ TransitionMatrix: declares
    FSM ||..|{ EventAdapter: references
    Slice ||..o{ EventDictionary: references
    Slice ||--o{ FSM: "consists of"
    Slice ||--|{ EffectMatrix: declares
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

#### Data Model
All the App states are stored in a single anemic object structure, which is persisted between runs and deterministically describe the behaviour of the App. Designing the proper `Data Model` is the essential and the most important step to start laying out logic using `Events` and `Slices`. 

`Data Model` contract can be composited from `Slices`, much like [Redux Toolkit](https://redux-toolkit.js.org/) does

#### Events
`Event Dictionary` is an enumerable set of constants (`Events`) that is shared throughout the App. `Events` represent every significant atomic change in the App state and are the default way to propagate updates throughout the rest of the architecture. Every `Event` type is associated with a particular type contract named `Event Meta`, which is typically implemented as generic type `TEventMetaType<TEventType>`. `Event Meta` can be irrelevant for certain `Event` types, in which case the `null` value and type is used. 

#### Slices
`Slices` are independent parts of business logic layer, each coming with its own `Effect Matrix` and a set of `FSMs`. `Slices` are a suggested way to chop the App logic into independent smaller pieces, which
- reduces the complexity of `Data Model` and provides a clear concern separation
- enables for better performance and smart caching
- enables for smooth refactoring of the resulting App to microservices or microfrontends, if it gets too intertwined

#### FSM
The basic building block of state logic is a `FSM` (more specifically - a [Mealy Machine](https://en.wikipedia.org/wiki/Mealy_machine)), which exposes a predefined `Transition Matrix` that comprises the relations between `States` and `Actions`, representing the decision tree of the machine. Every `Action` type can have a derived `Payload` type, while every `State` has a dependent `Context`, and the latter two represent the current internal state of the machine. 

`Actions`/`Payloads` and `States`/`Contexts` are enumerables that can be composed from different Dictionaries, and can be reused independently on each other. It's perfectly fine to create several `FSMs` that operate either on the same set of `Actions` or `States`, or both.

#### Event Adapter
Unless `FSM` includes an `Event Adapater`, it would not accept or emit `Events` into the `Event Stack` and can only be controlled directly. However, in most cases it's desireable to connect it to the `Event Stack` via a pub/sub mechanism, which contains assymetrical `Mapping Matrix`, that is responsible for:
- Casting handled `Events` into `Actions`, including mapping of `Event Meta` to `Payload`
- Producing `Events` from `State` changes, including mapping of `Context` to `Event Meta`

The reason `Event Adapter` is separated from `FSM` is reusability. If two `FSMs` share compatible contracts of `Actions` and `States`, they can use the same `Event Adapter` too, if needed. 

#### Effects
`Effects` are pure high-order functions that update `Data Model` based on its current state and emitted `Events`, very similar to the way `FSMs` operate (and Redux's _reducers_). However, `FSMs` cannot alter the `Data Model` directly, locked inside their local scope, they can emit `Events` through the `Event Adapter`, which is mapped to a particular `Effect` by the `Effect Matrix` of the owning slice. All the `Effects` triggered by different slices are batched every iteration of `Main Loop`, yielding exactly one (or none) `Data Model` update regardles of how many `FSM` transitions were performed.

#### Sources and Destinations
`Sources` and `Destinations` are abstractions for, respectively, input and output channels of the App. They include, but not limited to:
- Internal Timers inside App
- Remote API calls with various protocols, for backend Apps
- Hardware controls and UI interaction, for frontend Apps
- Message brokers, like Kafka or RabbitMQ
- Network transports, like WebRTC or UDP streams
- Environmental calls, i.e. pipes, sockets, system clock, file system, OS or WEB APIs

Every particular kind of a `Source` or a `Destination` is represented by a corresponding class:
- `ISourceEmitter` for `Source` channels, which allows to declare rules of publishing `Events` from `Source`. That could be done via subscription, long and short polling or by exposing hook methods to be used directly throughout the App, notably in frontend `UI Components` and/or webserver routes.
- `IDestinationGateway` for `Destination` channels, which observes the `Data Model` and propagates the required changes into the target endpoint

#### Storage
`Storage` is an adapter class to persist the `Data Model` and to load its snapshot, like:
- LocalStorage, for web apps
- in-memory key storages, like Redis
- Databases, like Mongo or Postgres
- Physical and cloud file systems
- Distributed storages like Blockchain or IPFS

The App can have multiple `Storages` which can store different subsets of `Data Model`. When the App starts, it polls all the Storages and integrates the received data into an initial `Data Model` snapshot, using composition of Selectors.

### Event Stack
Input streams (`UI Components` and `Sources`) and `FSMs` are emitting `Events`, that are put into a special LIFO structure, known as `Event Stack`. It is processed continiously by the `Main Loop`, which handles them one by one, always taking the last emitted `Event` and passing it to all connected `Slices`, and thus `FSMs`

#### Data Flow

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
