# 06 — Analog Clock

Demonstrates a timer-driven FSM with configurable tick intervals and `+ByPass` states. Models an analog clock whose hand angles are computed entirely inside the FSM context using built-in math functions. No UI framework — pure TypeScript with a Vite HTML shell.

**States:** `Configuring → StartRun → Ticking ↔ (TickSecond | TickMinute | TickHour) | Paused`  
**Actions:** `Init`, `UpdateInput`, `Apply`, `TickSecond`, `TickMinute`, `TickHour`, `Stop`, `Start`, `Reset`  
**Context:** `secMs`, `minMs`, `hourMs`, `secondAngle`, `minuteAngle`, `hourAngle`

## Yantrix packages

| Package | Role |
|---------|------|
| `@yantrix/core` | FSM engine |

## Key FSM patterns shown

- **`+ByPass` states** — `StartRun`, `TickSecond`, `TickMinute`, `TickHour` are transient; the FSM passes through them in a single dispatch cycle
- **In-context math** — hand angles computed with `mod(add(#angle, 6), 360)` inside reducers, no external logic needed
- **Configurable timing** — tick intervals (`secMs`, `minMs`, `hourMs`) are part of the FSM context, set from the UI before starting

## Stack

Vite · TypeScript (no framework)

## Run

```sh
pnpm install   # from repo root
pnpm build     # generates src/generated/ClockAutomata.ts, then compiles
pnpm --filter 06-clock dev
```

Or, after the initial build, to regenerate from the diagram only:

```sh
pnpm --filter 06-clock generate
```

## Key files

- [`src/diagrams/ClockAutomata.mermaid`](src/diagrams/ClockAutomata.mermaid) — FSM definition
- [`src/generated/ClockAutomata.ts`](src/generated/ClockAutomata.ts) — generated automata class (do not edit)
- [`src/clock/timers.ts`](src/clock/timers.ts) — timer loop that dispatches tick events
- [`src/clock/adapter.ts`](src/clock/adapter.ts) — bridges the automata to the DOM renderer
