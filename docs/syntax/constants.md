---
title: Constants
---

## Type system

As of now, data contracts in diagrams do not have typings.

When exporting Typescript code, they are declared as `any`. However, FSM itself (it's `States` and `Actions`) is typed along with [Automata](../API-reference/automata/) instance.

For other languages Yantrix aims to provide compatibility with elementary types, existing in most languages:

-   **Numbers**: integer and floats are processed as similarly as possible for a given language
-   **Strings**: strings are processed as immutables, i.e. every string function should return a new string rather than modify one of its arguments
-   **Lists (Tuples)**: Lists and Tuples are processed as similarly as possible for a given language. They also are immutable and can only be a read-only argument of the calling function
-   **Objects(Dictionaries)**: implementation is highly language-dependent and aims to reproduce the behaviour of Typescript [`Record`](../API%-reference/automata/interfaces/IAutomata.html) implementation as closely as possible. For `Functions` implementation **Object** arguments should be defined as immutable and read-only.

## Constant declaration

All but **Object** types can be created in-place, assigning a member of `Context` or `Payload` or as a `Function` argument

-   `'foo'` creates a String
-   `[]` creates an empty List
-   `$(foo)` is a compile-time Constant, that is passed to a Codegen along with a Mermaid diagram, primarily being used for behaviour that is dependent on environment and/or CI/CD operations.

## Languages and types

| Language | Language Type | Yantrix type |
| -------- | ------------- | ------------ |
| JS/TS    | String        | String       |
| JS/TS    | Number        | Number       |
| JS/TS    | Array         | List         |
| JS/TS    | Object        | Object       |
| Python   | String        | String       |
| Python   | ??            | Number       |
| Python   | ??            | List         |
| Python   | Dictionary    | Object       |
