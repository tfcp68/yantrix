---
title: Events
---

# Events

`Events` are the way `FSM`s interconnect with each other. They are propagated through `Event Bus` and can be [Subscribed](210_subscribe.html) on and [Emitted](220_emit.html) by `FSM`s. `Event Name`s are globally unique and the only knowledge, that is shared between various state machines. This allows for week binding of components through namespacing.

`Event Bus` along with `Events` and their `Event Meta` declarations are the backbone of Yantrix application. It's the core upon everything is built upon. `Events` reflect real-world interactions of abstracted `Data`, like UI inputs, I/O, timers, network. Most importantly, `Events` could be artifically constructed to implement control flows, which allow for synchronization of different `FSMs`, each of them representing some long-term asynchronous operation, allowing for patterns like [Saga](https://microservices.io/patterns/data/saga.html) and integration with almost everything through [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture)