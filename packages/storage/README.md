# `@yantrix/storage`

`@yantrix/storage` supplies in-memory, Web Storage, and IndexedDB connectors for persisting `Data Model` snapshots.

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

<p>
	<a href="./LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://tfcp68.github.io/yantrix/API/storage/test_cases/storage.html" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/tfcp68/yantrix/ubuntu-latest-test.yml?branch=main&amp;label=ci" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/storage"><img src="https://img.shields.io/npm/v/@yantrix/storage.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/storage"><img src="https://img.shields.io/npm/dt/@yantrix/storage.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>

## 📖 Usage

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

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)

## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
