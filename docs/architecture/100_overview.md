---
title: APIs Overview
---

# APIs

#### Data Model

All the App states are stored in a single anemic object structure, which is persisted between runs and deterministically describe the behavior of the App. Designing the proper `Data Model` is the essential and the most important step to start laying out logic using `Events` and `Slices`.

`Data Model` contract can be composited from `Slices`, much like [Redux Toolkit](https://redux-toolkit.js.org/) does

#### Events

`Event Dictionary` is an enumerable set of constants (`Events`) that is shared throughout the App. `Events` represent every significant atomic change in the App state and are the default way to propagate updates throughout the rest of the architecture. Every `Event` type is associated with a particular type contract named `Event Meta`, which is typically implemented as generic type `TEventMetaType<TEventType>`. `Event Meta` can be irrelevant for certain `Event` types, in which case the `null` value and type is used.

#### Slices

`Slices` are independent parts of business logic layer, each having its own `Effect Matrix` and a set of `FSMs`. `Slices` are a suggested way to chop the App logic into independent smaller pieces, which

-   reduces the complexity of `Data Model` and provides a clear concern separation
-   enables for better performance and smart caching
-   enables for smooth refactoring of the resulting App to microservices or micro-frontends if it gets too intertwined

#### FSM

The basic building block of state logic is a `FSM` (more specifically - a [Mealy Machine](https://en.wikipedia.org/wiki/Mealy_machine)), which exposes a predefined `Transition Matrix` that comprises the relations between `States` and `Actions`, representing the decision tree of the machine. Every `Action`
type can have a derived `Payload` type, while every `State` has a dependent `Context`, and the latter two represent the current internal state of the machine.

`Actions`/`Payloads` and `States`/`Contexts` are enumerable values that can be composed of different Dictionaries, and can be reused independently on each other. It's perfectly fine to create several `FSMs` that operate either on the same set of `Actions` or `States`, or both.

#### Event Adapter

Unless `FSM` includes an `Event Adapater`, it would not accept or emit `Events` into the `Event Stack` and can only be controlled directly. However, in most cases it's desirable to connect it to the `Event Stack` via a pub/sub mechanism, which contains asymmetrical `Mapping Matrix`, that is responsible for:

-   Casting handled `Events` into `Actions`, including mapping of `Event Meta` to `Payload`
-   Producing `Events` from `State` changes, including mapping of `Context` to `Event Meta`

The reason `Event Adapter` is separated from `FSM` is reusability. If two `FSMs` share compatible contracts of `Actions`
and `States`, they can use the same `Event Adapter` too, if needed.

#### Predicates

`Predicates` are functions that return a Boolean value and are used to fork the flow of operations inside `FSMs`. All `Predicates` are high-order functions that allow compositing them. They come in three flavors:

-   `Built-in Predicates` are used to combine other `Predicates` and implement logical operations like `not`, `and` and so on.
-   `Model Predicates` have a `Data Model` as a dependency and are supposed to implement conditions that rely on the current state of `Application`
-   `Context Predicates` are bound to a certain `Slice` and its `State Dictionary`, and have a `State`/`Context` pair as a dependency. It's designed to create decision branching inside a `Transition Matrix`

#### Effects

`Effects` are pure high-order functions that update `Data Model` based on its current state and emitted `Events`, very similar to the way `FSMs` operate (and Redux's _reducers_). However, `FSMs` cannot alter the `Data Model` directly, locked inside their local scope, they can emit `Events` through the `Event Adapter`, which is mapped to a particular `Effect` by the `Effect Matrix` of the owning slice.

All the `Effects` triggered by different slices are batched every iteration of `Main Loop`, yielding exactly one (or none) `Data Model` update regardless of how many `FSM` transitions were performed.

#### Transformers

`Transformers` are projection-type functions that come with `Slice` and translate the same types between each other. They can be:

-   `Context Transformers` translate `Contexts` between each other. They are used inside `Transition Matrix` to update the internal data of the `FSM` when changing `States`. They are defined as a part of `State Dictionary`
-   `Reducer Transformers` translate from `State`+`Action/Payload` to `State/Context`
-   `Model Transformers` are a subtype of `Effects` which is context-free and is basically a function that mutates the `Data Model`. They can be composed with `Predicates` to produce `Effects`
-   `Generic Transformers` are built-in and user-defined pure functions that operate on any contract type and map the values. They are the basic building blocks of data manipulation.

#### Sources and Destinations

`Sources` and `Destinations` are abstractions for, respectively, input and output channels of the App. They include, but not limited to:

-   Internal Timers inside App
-   Remote API calls with various protocols for backend Apps
-   Hardware controls and UI interaction for frontend Apps
-   Message brokers, like Kafka or RabbitMQ
-   Network transports, like WebRTC or UDP streams
-   Environmental calls, i.e. pipes, sockets, system clock, file system, OS or WEB APIs

Every particular kind of `Source` or `Destination` is represented by a corresponding class:

-   `ISourceEmitter` for `Source` channels, which allows to declare rules of publishing `Events` from `Source`. That could be done via subscription, long and short polling or by exposing hook methods to be used directly throughout the App, notably in frontend `UI Components` and/or webserver routes.
-   `IDestinationGateway` for `Destination` channels, which observes the `Data Model` and propagates the required changes into the target endpoint

#### Storage

`Storage` is an adapter class to persist the `Data Model` and to load its snapshot, like:

-   LocalStorage for web apps
-   in-memory key storages, like Redis
-   Databases, like Mongo or Postgres
-   Physical and cloud file systems
-   Distributed storages like Blockchain or IPFS

The App can have multiple `Storages` which can store different subsets of `Data Model`. When the App starts, it polls all the Storages and integrates the received data into an initial `Data Model` snapshot, using composition of Selectors.

### Event Stack

Input streams (`UI Components` and `Sources`) and `FSMs` are emitting `Events`, that are put into a special LIFO structure, known as `Event Stack`. It is processed continuously by the `Main Loop`, which handles them one by one, always taking the last emitted `Event` and passing it to all connected `Slices`, and thus `FSMs`
