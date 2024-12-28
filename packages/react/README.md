# `@yantrix/react`

>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

React integration for the [Yantrix](https://github.com/tfcp68/yantrix/) framework. This package provides hooks and utilities to use finite state machines implemented with [`@yantrix/automata`](https://www.npmjs.com/package/@yantrix/automata) within React applications, allowing for declarative state management through the `useFSM` hook.

<p>
	<a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://www.npmjs.com/package/@yantrix/react"><img src="https://img.shields.io/npm/v/@yantrix/react.svg?maxAge=3600" alt="npm version" /></a>
	<a href="https://www.npmjs.com/package/@yantrix/react"><img src="https://img.shields.io/npm/dt/@yantrix/react.svg?maxAge=3600" alt="npm downloads" /></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
</p>

## 📖 Usage

Install the primary package using your prefered package manager. All the secondary dependencies will be installed automatically. However, you will need `@yantrix/automata` at least for types. Most likely, you will also need `@yantrix/cli` to build diagrams into code.

```bash
# Via NPM
$ npm install @yantrix/react @yantrix/automata @yantrix/cli

# Via Yarn
$ yarn add @yantrix/react @yantrix/automata @yantrix/cli

# Via PNPM
$ pnpm install @yantrix/react @yantrix/automata @yantrix/cli

# ✨ Auto-detection
$ npx nypm install @yantrix/react @yantrix/automata @yantrix/cli
```

> We suggest using `pnpm`

Then, see the docs:

- [React Integration](https://tfcp68.github.io/yantrix/integrations/199_react.html)
- [Example: React](https://tfcp68.github.io/yantrix/examples/110_react.html)
- [More Examples](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)

## [🌱 Contributing](https://tfcp68.github.io/yantrix/contributing/)
## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
