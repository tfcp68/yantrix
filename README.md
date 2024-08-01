# Yantrix &mdash; Opinionated FSM Framework

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

## The Idea

Consider the following:

-   Writing less code produces fewer errors.
-   Writing it in a declarative way makes the code more adaptive and supportable.
-   Writing it with pure functions adds reliability and provides for an easy testability
-   Boilerplate code is undesirable, while it's best to write code in high-level abstractions that are close enough to business logic
-   It's better to define behavior with data rather than with code
-   Documenting the code makes it sustainable, and the best documentation is visual

If you agree to most of these takes, you'd probably like Yantrix. If not, still give it a shot, it might widen your view on programming as a genre.

To achieve those goals, Yantrix offers a visual language to describe data operations and bind them to discriminate well-defined processes, organized into the aforementioned State Machines. That approach is not the most traditional but is extremely reliable and manageable when you get the hang of it. To crown it all, being _visual_ means the code can be immediately visualized to produce a representation of applied logic that is easy to conceive and is very efficient at storing knowledge about the produced software in documentation hubs.

If you're not familiar with automata-based programming, please refer to [🧠Core Concepts](https://tfcp68.github.io/yantrix/concepts/)

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
