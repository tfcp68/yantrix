---
title: Language Support
---

# Language support

Yantrix aims to transpile to any turing-full language, the primary one being Typescript. Since implementation is independent, certain features may be shipped at varying times for different languages.

| Feature                | JavaScript | TypeScript | Pure JS<sup>1</sup> | Pure TS<sup>1,2</sup> | Python<sup>3</sup> | Java |
| ---------------------- | ---------- | ---------- | ------- | -------- | ------ | ---- |
| FSM from Diagram       | ✅         | ✅         | ✅      | ✅       | ✅     | ✅   |
| Reducers               | ✅         | ✅         | ✅      | ✅       | ✅     | ✅   |
| Payloads               | ✅         | ✅         | ✅      | ✅       | ✅     | ❌   |
| Expressions            | ✅         | ✅         | ✅      | ✅       | ✅     | ❌   |
| Built-In Functions     | ✅         | ✅         | ✅      | ✅       | ✅     | ❌   |
| User-defined Functions | ✅         | ✅         | ✅      | ✅       | ❌     | ❌   |
| Event Subscription     | ✅         | ✅         | ✅      | ✅       | ❌     | ❌   |
| Event Firing           | ✅         | ✅         | ✅      | ✅       | ❌     | ❌   |
| Side Effects           | ❌         | ❌         | ❌      | ❌       | ❌     | ❌   |

> [!NOTE]
> <b>1</b> `pure-javascript` and `pure-typescript` produce self-contained output with zero npm runtime dependencies. No `@yantrix/core` or `@yantrix/automata` import in the generated file.
>
> <b>2</b> `pure-typescript` emits a `.js` file plus a `.d.ts` type declaration file as a pair.
>
> <b>3</b> Python inject functions (user-defined via file path) are not supported. The generated code requires `pydash` as a Python runtime peer dependency.

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
