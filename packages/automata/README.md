# `@yantrix/automata`

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Reference finite state machine (FSM) implementation for [Yantrix](https://github.com/tfcp68/yantrix/) framework. This package provides foundational building blocks for creating and managing state machines with type-safe transitions and event handling in Typescript

<p>
	<a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/automata"><img src="https://img.shields.io/npm/v/@yantrix/automata.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/automata"><img src="https://img.shields.io/npm/dt/@yantrix/automata.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>

## 📖 Usage

Install the primary package using your prefered package manager. All the secondary dependencies will be installed automatically.

```bash
# Via NPM
$ npm install @yantrix/automata

# Via Yarn
$ yarn add @yantrix/automata

# Via PNPM
$ pnpm install @yantrix/automata

# ✨ Auto-detection
$ npx nypm install @yantrix/automata
```

> We suggest using `pnpm`

### Data Model and Effects

`ModelStore` owns the current application snapshot. `EffectScheduler` collects
Events during a Main Loop iteration and applies all matching Effects with at
most one model commit when the iteration is flushed:

```typescript
import { EffectScheduler, ModelStore } from '@yantrix/automata';

enum AppEvent {
	Increment = 1,
}

interface IEventMeta extends Record<AppEvent, unknown> {
	[AppEvent.Increment]: { amount: number };
}

interface IModel {
	count: number;
}

const model = new ModelStore<IModel>({ count: 0 });
const effects = new EffectScheduler<IModel, AppEvent, IEventMeta>({
	store: model,
	matrices: [{
		[AppEvent.Increment]: [
			(event, current) => ({
				...current,
				count: current.count + (event.meta?.amount ?? 0),
			}),
		],
	}],
});

effects.enqueue({ event: AppEvent.Increment, meta: { amount: 2 } });
effects.flush();
```

The Main Loop defines the batch boundary: enqueue only Events selected for the
Effect Layer, then call `flush()` once after the FSM reducer phase has completed.

Then, see the docs:

- [Learn about finite state machines](https://tfcp68.github.io/yantrix/concepts/200_FSM.html)
- [See sample Yantrix designs](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
- [See the API reference](https://tfcp68.github.io/yantrix/API/automata/interfaces/IAutomata.html)

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
