# `@yantrix/storage`

`@yantrix/automata` owns the public types, agnostic classes, and extension factories for `Sources`, `Destinations`, and `Storage`. These are available from the package index and from individual modules. `@yantrix/core` re-exports the agnostic API.

Concrete implementations extend the agnostic classes through their factories. Import the interval timer and HTTP providers from `@yantrix/providers`. Import the in-memory, Web Storage, and IndexedDB connectors from `@yantrix/storage`. Both packages can be used independently.

```sh
npm install @yantrix/storage
```

```typescript
import { createInMemoryStorageAdapter } from '@yantrix/storage';

const counter = createInMemoryStorageAdapter<number>({ id: 'counter', initialSnapshot: 0 });
await counter.save(1);
const value = await counter.load(); // 1
```

## Connector options and write guarantees

`InMemoryStorageAdapter` is the reference/test adapter.
`IndexedDBStorageAdapter` stores structured-clone-compatible snapshots, while
`VersionedStorageAdapter` decorates any adapter with ordered schema migrations.

Use the same `databaseVersion` (default `1`) for all adapters sharing a `databaseName`. An adapter configured below the stored schema version gets `VersionError`. Adding a missing object store to an existing database raises its physical IndexedDB version, which can exceed `databaseVersion`. All other open connections to that database, including those in other tabs, must close before the upgrade can finish. Yantrix adapters close on `versionchange` and reopen on their next operation.

The store name `'\u0000yantrix/storage/schema'` is reserved. `openTimeoutMs` defaults to 5000 ms and covers the entire open, including waiting for connections to close and provisioning the store.

`VersionedStorageAdapter` runs migrations on load. IndexedDB and in-memory connectors check the stored schema and save atomically. `LocalStorageAdapter` checks and writes synchronously within one tab. Other tabs can write between those operations. Connectors with only `load()` and `save()` use a best-effort schema check.
