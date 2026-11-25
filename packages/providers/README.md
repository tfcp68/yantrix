# `@yantrix/providers`

`@yantrix/automata` owns the public types, agnostic classes, and extension factories for `Sources`, `Destinations`, and `Storage`. These are available from the package index and from individual modules. `@yantrix/core` re-exports the agnostic API.

Concrete implementations extend the agnostic classes through their factories. Import the interval timer and HTTP providers from `@yantrix/providers`. Import the in-memory, Web Storage, and IndexedDB connectors from `@yantrix/storage`. Both packages can be used independently.

```sh
npm install @yantrix/providers
```

```typescript
import { IntervalTimerDataSource } from '@yantrix/providers';

const timer = new IntervalTimerDataSource({ id: 'clock', interval: 1000 });
timer.addListener('tick', packet => [{ event: 1, meta: { timestamp: packet.timestamp } }]);
const events = timer.eventEmitter();
timer.start();
// Poll events.next() from the application's scheduling loop.
timer.stop();
```
