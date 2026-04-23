# 04 — Weather Report (Async API)

Demonstrates an async form/request FSM that models the full lifecycle of an API call: input → submit → pending → success/error. No UI framework — pure TypeScript with a minimal Vite HTML shell.

**States:** `Idle → Filling → Pending → Success | Error`  
**Actions:** `Init`, `FocusInput`, `UpdateSelect`, `UpdateInput`, `Submit`, `Resolve`, `Reject`, `Reset`  
**Context:** `coords`, `city`, `loading`, `result`, `error`

## Yantrix packages

| Package | Role |
|---------|------|
| `@yantrix/core` | FSM engine |

## Key FSM patterns shown

- **Coalescing context** — payload values fall back to existing context (`coalesce($coords, #coords)`)
- **Loading flag** — `loading` toggled implicitly by state transitions, never set manually
- **Error recovery** — `Error` and `Success` both allow re-entering `Filling` without a full reset

## Stack

Vite · TypeScript (no framework)

## Run

```sh
pnpm install   # from repo root
pnpm build     # generates src/generated/WeatherReportAutomata.ts, then compiles
pnpm --filter 04-api-weather-report dev
```

Or, after the initial build, to regenerate from the diagram only:

```sh
pnpm --filter 04-api-weather-report generate
```

## Key files

- [`src/diagrams/WeatherReport.mermaid`](src/diagrams/WeatherReport.mermaid) — FSM definition
- [`src/generated/WeatherReportAutomata.ts`](src/generated/WeatherReportAutomata.ts) — generated automata class (do not edit)
- [`src/events/weatherEvents.ts`](src/events/weatherEvents.ts) — event bus wiring
- [`src/index.ts`](src/index.ts) — entry point, drives the automata
