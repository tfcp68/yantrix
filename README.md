# Yantrix - FSM Framework on steroids

Yantrix is a TypeScript framework that provides a set of tools to create a code-generated state management, using
event-driven finite state machines and anemic data model. It represents an application state as a flock of independent
FSMs which communicate through a common event bus and operate on a single state object, which is separated from actual
business logic, making it a great counterpart to any functional state manager like [Redux](https://redux.js.org/), while
keeping the logic part of it robust and declarative

## Installation

To install Yantrix, you can use NPM or Yarn:

```
npm install yantrix
```

or

```
yarn add yantrix
```

## Concepts

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
    Slice ||--|{ FSM: contains
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
