---
title: Language Support
---

# Language support

Yantrix aims to transpile to any turing-full language, the primary one being Typescript. Since implementation is independent, certain features may be shipped at varying times for different languages.

| Feature            | JavaScript | TypeScript | Python | Java |
| ------------------ | ---------- | ---------- | ------ | ---- |
| FSM from Diagram   | ✅         | ✅         | ✅     | ❌   |
| Reducers           | ✅         | ✅         | ✅     | ❌   |
| Payloads           | ✅         | ✅         | ❌     | ❌   |
| Expressions        | ✅         | ✅         | ❌     | ❌   |
| Functions          | ❌         | ❌         | ❌     | ❌   |
| Event Subscription | ❌         | ❌         | ❌     | ❌   |
| Event Firing       | ❌         | ❌         | ❌     | ❌   |
| Side Effects       | ❌         | ❌         | ❌     | ❌   |

## Type Mapping

| Language | Language Type | Yantrix Type |
| -------- | ------------- | ------------ |
| JS/TS    | String        | String       |
| JS/TS    | Number        | Number       |
| JS/TS    | Array         | List         |
| JS/TS    | Object        | Object       |
| Python   | String        | String       |
| Python   | ??            | Number       |
| Python   | ??            | List         |
| Python   | Dictionary    | Object       |
