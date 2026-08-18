>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Core package for the Yantrix project, that contains everything necessary to quickly and easily start creating your own FSMs - CLI, code generation functions, built-in functions, etc.

Core bundle includes the following packages:

- @yantrix/cli
- @yantrix/codegen
- @yantrix/automata
- @yantrix/functions
- @yantrix/utils

<div align="center">
  <img width="128" src="https://github.com/tfcp68/yantrix/blob/main/docs/public/logo.png?raw=true" />
  <h1><code>@yantrix/core</code></h1>
</div>

## 📖 Usage

Install the primary package using your preferred package manager. All the secondary dependencies will be installed automatically.

```bash
# Via NPM
$ npm install @yantrix/core

# Via Yarn
$ yarn add @yantrix/core

# Via PNPM
$ pnpm install @yantrix/core

# ✨ Auto-detection
$ npx nypm install @yantrix/core
```

> We suggest using `pnpm`

## MVP runtime

`@yantrix/core` re-exports the complete TypeScript runtime. A typical
application hydrates its persisted projections, then composes one Data Model,
Effect Scheduler, Main Loop and one or more generated Slices:

```typescript
import {
	CoreLoop,
	EffectScheduler,
	hydrateModel,
	ModelStore,
} from '@yantrix/core';

const hydration = await hydrateModel(initialModel, storageBindings);
const modelStore = new ModelStore(hydration.model);
const effectScheduler = new EffectScheduler({ store: modelStore });
const coreLoop = new CoreLoop({ effectScheduler });

coreLoop.registerSlice(createApplicationSlice(modelTransformers));
coreLoop.getBus().dispatch(command);
await coreLoop.whenIdle();
```

The Data Model is a plain serializable snapshot. `ModelStore` only owns that
snapshot in memory; persistence belongs to Storage Adapters and
`StorageSyncLoop`. Only Events emitted by FSM Event Adapters trigger Effects.

See the [Core Runtime API](https://tfcp68.github.io/yantrix/integrations/180_core_runtime.html)
and [migration guide](https://tfcp68.github.io/yantrix/integrations/190_core_migration.html).

Then, see the docs:

- [Learn about finite state machines](https://tfcp68.github.io/yantrix/concepts/200_FSM.html)
- [See sample Yantrix designs](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
- [See the API reference](https://tfcp68.github.io/yantrix/API/automata/interfaces/IAutomata.html)

## 🌱 Contributing

See [Contributing](https://tfcp68.github.io/yantrix/contributing/)

## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
