# `@yantrix/redux`

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Redux integration for the [Yantrix](https://github.com/tfcp68/yantrix/) framework. This package provides various connectors to [`@yantrix/automata`](https://www.npmjs.com/package/@yantrix/automata) to connect new or existing Redux stores to FSM-based state management.

<p>
	<a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/redux"><img src="https://img.shields.io/npm/v/@yantrix/redux.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/redux"><img src="https://img.shields.io/npm/dt/@yantrix/redux.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>

## 📖 Usage

`@yantrix/redux` is an optional integration. Only applications using this adapter need its Redux Toolkit (`^2.2.7`) peer dependency. Applications running generated TypeScript machines with `@yantrix/core` alone can omit both adapters and their peers.

Install the adapter, its peer, and the runtime imported by generated TypeScript machines.

```sh
# npm
npm install @yantrix/core @yantrix/redux @reduxjs/toolkit@^2.2.7

# pnpm
pnpm add @yantrix/core @yantrix/redux @reduxjs/toolkit@^2.2.7

# Yarn
yarn add @yantrix/core @yantrix/redux @reduxjs/toolkit@^2.2.7
```

If your project generates machines from Mermaid diagrams, add `@yantrix/cli` as a development dependency.

Then, see the docs:

- [Redux Integration](https://tfcp68.github.io/yantrix/integrations/200_redux.html)
- [Example: Redux](https://tfcp68.github.io/yantrix/examples/100_redux.html)
- [More Examples](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
