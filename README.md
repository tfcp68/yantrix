# Yantrix—Opinionated FSM Framework

Yantrix is a TypeScript framework that provides a set of tools to create robust and self-documented functional
applications by code generation.
The business logic is represented by declarative,
event-driven [finite state machines](https://en.wikipedia.org/wiki/Finite-state_machine), while the application state is
an [Anemic Domain Model](https://en.wikipedia.org/wiki/Anemic_domain_model), making it great a counterpart to any
traditional state manager like [Redux](https://redux.js.org/), while allowing devs to focus on describing contracts and
workflows, rather than writing and debugging the
actual code.

Lends itself perfectly to [Architecture-as-Code](https://jondavid-black.github.io/AaC/) paradigm and no-code/less-code
tools for developers, like [n8n](https://github.com/n8n-io/n8n).

## Installation

To install Yantrix end-to-end command line tool, you can use NPM, Yarn or PNPM:

```bash
$ npm install @yantrix/cli
# or
$ yarn add @yantrix/cli
# or
$ pnpm install @yantrix/cli
```

If your main language is TypeScript, you may prefer to install all available APIs or list only those you require

```bash
$ pnpm install yantrix
$ npm install @yantrix/automata @yantrix/utils @yantrix/yantrix-parser
```

## Usage

See [📚 Documentation](https://tfcp68.github.io/yantrix/)

Basically, you turn diagrams into a code module in required language

```bash
$ yantrix codegen --outfile ../yantrix-generated.ts --language TypeScript --className SampleFSM --eval "A-->B"
```

## Contributing

See [Contributing](https://tfcp68.github.io/yantrix/contributing/)
