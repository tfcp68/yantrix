# Examples

Each example is a self-contained Vite app demonstrating a different aspect of the Yantrix FSM framework. Generated automata code (`src/generated/`) is produced by `@yantrix/cli` from the Mermaid diagrams in `src/diagrams/` — do not edit generated files directly.

## Quick start

```sh
# from repo root
pnpm install
pnpm build        # builds all packages AND generates + compiles all examples
```

To run a specific example in dev mode after the initial build:

```sh
pnpm --filter <example-name> dev
```

To regenerate all automata from their diagrams (e.g. after editing a `.mermaid` file):

```sh
pnpm generate
```

## Examples

| # | Folder | What it shows | Yantrix packages | Framework |
|---|--------|--------------|-----------------|-----------|
| 01 | [01-traffic-light](01-traffic-light/) | 5-state traffic light FSM with **Redux** integration | `core`, `redux` | React + Redux Toolkit |
| 02 | [02-traffic-light-react](02-traffic-light-react/) | Same FSM with **React hooks** — no Redux | `core`, `react` | React |
| 03 | [03-checkbox](03-checkbox/) | 2-state toggle; `+ByPass` states; **JavaScript** codegen; ID-keyed context | `automata`, `functions`, `react`, `utils` | React |
| 04 | [04-api-weather-report](04-api-weather-report/) | Async API form FSM — loading/success/error lifecycle | `core` | None (vanilla TS) |
| 06 | [06-clock](06-clock/) | Timer-driven analog clock; `+ByPass` tick states; in-context math | `core` | None (vanilla TS) |

> **Note:** example 05 is not yet available.

## Codegen

All examples use the same CLI command pattern:

```sh
yantrix codegen <diagram.mermaid> -l <Language> -o <output-file> -c <ClassName>
```

The `generate` script in each `package.json` contains the exact invocation for that example. It runs automatically as part of `pnpm build` via the turbo pipeline.
