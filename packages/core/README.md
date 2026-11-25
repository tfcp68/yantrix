>Yantrix is a _(mostly)_ TypeScript framework and a DSL, that make up a full instrumental chain to implement robust and self-documented functional applications by code generation in multiple programming languages.

Core package for the Yantrix project, that contains everything necessary to quickly and easily start creating your own FSMs - CLI, code generation functions, built-in functions, etc.

Core bundle includes the following packages:

- @yantrix/cli
- @yantrix/codegen
- @yantrix/automata
- @yantrix/functions
- @yantrix/utils

`@yantrix/automata` owns the shared contracts, agnostic classes, and extension factories for `Sources`, `Destinations`, and `Storage`. Each implementation package owns its connector-specific options and protocols. The public mixins are available from the Automata index and their named module paths. `@yantrix/core` re-exports the agnostic API.

Concrete implementations extend the agnostic classes through their factories. Import the interval timer and HTTP providers from `@yantrix/providers`. Import the in-memory, Web Storage, and IndexedDB connectors from `@yantrix/storage`. Both packages can be used independently.

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

Then, see the docs:

- [Learn about finite state machines](https://tfcp68.github.io/yantrix/concepts/200_FSM.html)
- [See sample Yantrix designs](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
- [See the API reference](https://tfcp68.github.io/yantrix/API/automata/interfaces/IAutomata.html)

## 🌱 Contributing

See [Contributing](https://tfcp68.github.io/yantrix/contributing/)

## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
