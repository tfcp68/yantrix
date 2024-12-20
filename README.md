<div align="center">
  <img width="128" src="https://github.com/tfcp68/yantrix/blob/main/docs/public/logo.png?raw=true" />
  <h1>Yantrix</h1>
  <p>Opinionated FSM Framework</p>
</div>

<p align="center">
    <a href="https://github.com/tfcp68/yantrix/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/tfcp68/yantrix" alt="license"></a>
	<a href="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml" target="_blank"><img src="https://github.com/tfcp68/yantrix/actions/workflows/tests.yml/badge.svg" alt="ci"></a>
	<a href="https://codecov.io/gh/tfcp68/yantrix" target="_blank"><img src="https://img.shields.io/codecov/c/gh/tfcp68/yantrix/main" alt="coverage"></a>
	<img src="https://img.shields.io/github/stars/tfcp68/yantrix" alt="stars">
	<a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Ftfcp68%2Fyantrix&count_bg=%233DAEC8&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=visitors&edge_flat=false"/></a>
	<img src="https://img.shields.io/static/v1?label=opinionated&message=enough&color=success" alt="opinionated" />
</p>

## 🧭 About

Yantrix is a TypeScript framework that provides a set of tools to create robust and self-documented functional
applications by code generation.
The business logic is represented by declarative,
event-driven [finite state machines](https://en.wikipedia.org/wiki/Finite-state_machine), while the application state is
an [Anemic Domain Model](https://en.wikipedia.org/wiki/Anemic_domain_model), making it great a counterpart to any
traditional state manager like [Redux](https://redux.js.org/), while allowing devs to focus on describing contracts and
workflows, rather than writing and debugging the
actual code.

Lends itself perfectly to Architecture-as-Code paradigm and no-code/less-code
tools for developers, like [n8n](https://github.com/n8n-io/n8n).

## 💡 The Idea

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

## 📥 Installation

To install Yantrix end-to-end command line tool, you can use one of the following methods:

```bash
# Via NPM
$ npm install @yantrix/cli

# Via Yarn
$ yarn add @yantrix/cli

# Via PNPM
$ pnpm install @yantrix/cli

# ✨ Auto-detection
$ npx nypm install @yantrix/cli
```
> [!NOTE]
> If your main language is TypeScript, you may prefer to install all available APIs or list only those you require
>
> ```bash
> # Via NPM
> $ npm install @yantrix/automata @yantrix/utils @yantrix/yantrix-parser
>
> # Via Yarn
> $ yarn add @yantrix/automata @yantrix/utils @yantrix/yantrix-parser
>
> # Via PNPM
> $ pnpm install @yantrix/automata @yantrix/utils @yantrix/yantrix-parser
>
> # ✨ Auto-detection
> $ npx nypm install @yantrix/automata @yantrix/utils @yantrix/yantrix-parser
> ```

## 📖 Usage

Basically, you turn diagrams into a code module in required language

```bash
# From the *.mermaid file containing the diagram
$ yantrix codegen ./diagram.mermaid --outfile ../yantrix-generated.ts --language TypeScript --className SampleFSM

# Or using --eval
$ yantrix codegen --eval "A-->B" --outfile ../yantrix-generated.ts --language TypeScript --className SampleFSM
```

For detailed information, see the [documentation](https://tfcp68.github.io/yantrix)

## 🌱 Contributing

See [Contributing](https://tfcp68.github.io/yantrix/contributing/)

## 📜 License

Made with 💜. Published under [MIT License](./LICENSE).
