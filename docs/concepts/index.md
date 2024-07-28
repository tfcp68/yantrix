---
title: Core Concepts
---

# Core Concepts

Yantrix provides a set of mixed functional and objective APIs, each of them being self-sufficient for a particular application layer.
However, when used together, they form an all-around framework that manages things like:

-   Sync and Async I/O
-   Timers, Events and integrations
-   Declarative data storage
-   Application State management

Being primary a Typescript solution, the intended application is mostly Frontend, working well with libraries like React and Redux.
Due to its codegen approach, Yantrix could work well in Svelte environment and "dumb" s2s Node.js integrations.

## Automata-based programming

Automata-based programming is a programming paradigm that utilizes finite state machines and other automata models for software development, often employed for tasks involving pattern recognition, parsing, and data validation. It involves defining states and transitions to manage the flow and behavior of a program.

The finite state machine model, with its clearly defined states and transitions, makes it easier to understand the behavior of a system, even for complex applications. It becomes even better, when visualized &mdash; this provides a simple and understandable approach to software development. One of the first to implement this in Javascript was [XState](https://xstate.js.org/). We employ a different approach - visualization-first programming in automata style. Yantrix code declaratively defines state/action reactive logic and can be immediately visualized with [MermaidJS](https://mermaid.js.org/), becoming both a graphical specification and a source code for some program. The program itself is obtained in a [required language](https://tfcp68.github.io/yantrix/integrations/100_language_support.html) by code generation, which enables reusing more code between systems and stacks.

The design language allows for basic logic and maths, similar to Excel formulas, being a pretty solid solution for basic programming and business logic implementation. To achieve complex functionality, basic logic elements, such as FSMs, should be interconnected with the help of Events.
