---
title: Integrations
---

# Integrations

Yantrix is supposed to be used as an intermediary tool that provides your more complicated app with standalone modules. Still, the functionality of [Yantrix syntax](../syntax/) has to be implemented in each supported language independently, meaning that at any given moment there might be features that are not supported in some languages yet. The reference implementation of Yantrix is Typescript, and most features will be delivered there at first place. Other supported languages are:

-   Javascript (class-based and [pure/zero-dep](160_pureAPI.html))
-   TypeScript (class-based and [pure/zero-dep](160_pureAPI.html))
-   Python
-   Java

See [Language Support](100_language_support.html) for details.
For the generated API of pure dialects and Python, see [Pure Dialects & Python API](160_pureAPI.html).

The bundle version comes with out-of-box integrations with popular libraries:

| Library                 | Language(s)            | Readiness | Features                                                 |
| ----------------------- | ---------------------- | --------- | -------------------------------------------------------- |
| [Redux](200_redux.html) | Typescript, Javascript | ★⚝⚝⚝⚝     | <ul><li>FSM</li><li>Reducers</li><li>Functions</li></ul> |
| Zustand                 | Javascript             | ⚝⚝⚝⚝⚝     |                                                          |
| MobX                    | Javascript             | ⚝⚝⚝⚝⚝     |                                                          |
| AsyncIO                 | Python                 | ⚝⚝⚝⚝⚝     |                                                          |
