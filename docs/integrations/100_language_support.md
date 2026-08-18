---
title: Language Support
---

# Language support

Yantrix aims to transpile to any turing-full language, the primary one being Typescript. Since implementation is independent, certain features may be shipped at varying times for different languages.

| Feature | JS | TS | PureJS<sup>1</sup> | PureTS<sup>1,2</sup> | Python<sup>3</sup> | Java |
| ------- | -- | -- | ------ | ------ | ------ | ---- |
| FSM from diagram | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Context / reducers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payloads | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Expressions | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Built-in functions | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `define/fn(args) => expr` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| User function injection<sup>4</sup> | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Forks / predicates | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Event subscription | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Event emission | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `createEventBus()` factory | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `create<ClassName>EventAdapter()` factory | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `@yantrix/core` compatible<sup>5</sup> | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Epoch tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cycle counter | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Named ID type aliases | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| TypeScript declarations | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Pause / resume / disable | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Zero external runtime deps | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Side effects | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> [!NOTE]
> <b>1</b> `pure-javascript` and `pure-typescript` produce self-contained output with zero npm runtime dependencies. No `@yantrix/core` or `@yantrix/automata` import in the generated file.
>
> <b>2</b> `pure-typescript` emits a `.js` file plus a `.d.ts` type declaration file as a pair.
>
> <b>3</b> Python requires `pydash` as a runtime peer dependency.
>
> <b>4</b> User function injection accepts `.ts`/`.js` files for JS/TS dialects and `.py` files for Python.
>
> <b>5</b> `@yantrix/core` compatible means the generated code exposes event adapters that can be plugged into `@yantrix/core`'s `CoreLoop` orchestrator. Pure dialects and Python generate self-contained factories without event adapter infrastructure.

## Type Mapping

| Language | Language Type | Yantrix Type |
| -------- | ------------- | ------------ |
| JS/TS    | String        | String       |
| JS/TS    | Number        | Number       |
| JS/TS    | Array         | List         |
| JS/TS    | Object        | Object       |
| Python   | String        | String       |
| Python   | Integer/Float<sup>*</sup> | Number       |
| Python   | List          | List         |
| Python   | Dictionary    | Object       |
| Java     | String        | String       |
| Java     | Long          | Number       |
| Java     | List          | List         |
| Java     | Map           | Object       |

> [!NOTE]
> <b>*</b>  Values are typecasted depending on expression context
