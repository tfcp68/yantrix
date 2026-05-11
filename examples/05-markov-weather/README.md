# 05 - Markov Weather

Demonstrates how to represent a Markov chain in Yantrix and generate a self-contained Python automata from it.

The machine models weather as 5 states (SUNNY, CLOUDY, RAINY, STORMY, FOGGY). Each `TICK` dispatches a transition: a `ROLLING_*` ByPass state calls `_random()` into context, then a Fork node compares the result against cumulative probability thresholds to select the next state. No random value is passed from the caller.

Transition probabilities are not hardcoded. They are learned from a timestamped event log via a windowed cosine-decay algorithm and encoded into the diagram automatically.

## Pipeline

```
src/data/sample_events.csv
  -- pnpm learn -->
src/data/matrix.json
  -- pnpm build -->
src/diagrams/WeatherMarkov.mermaid
  -- pnpm generate -->
src/generated/weather_markov_automata.py
  -- python src/main.py -->
simulation output
```

## Prerequisites

- Python 3.8+
- Node.js 18+ and pnpm (for codegen)
- `pip install -r requirements.txt` (installs pydash, required by generated code)

## Quick start

```sh
pip install -r requirements.txt
pnpm learn       # compute transition matrix from sample_events.csv
pnpm build       # generate Yantrix diagram from matrix
pnpm generate    # generate Python automata from diagram
python src/main.py 50
```

## Using your own event log

Provide a CSV with two columns:

```
timestamp,event_id
2024-01-01T00:00:00Z,sunny
2024-01-01T06:00:00Z,cloudy
...
```

Timestamps accept ISO 8601 strings (with or without UTC `Z`) and numeric values (any consistent unit).

```sh
python src/learn.py my_events.csv --decay-time 86400000 -o src/data/matrix.json
pnpm build
pnpm generate
```

`--decay-time` controls the half-life window: events separated by more than this value contribute zero weight. Default is `10000` (interpret as the same unit as your timestamps).

---

## Tool reference

### `learn.py` - Event log to transition matrix

```
python src/learn.py <input.csv> [--decay-time T] [-o output.json]
```

Reads a timestamped event sequence and computes Markov transition probabilities using a windowed cosine ease-in-out decay.

**Algorithm:**

For each event at position `i`, the next 5 events (window of 5) each receive a weight:

```
w(dt) = 0.5 * (1 + cos(pi * dt / T))
```

- `w(0) = 1.0` - same-moment event has full weight
- `w(T) = 0.0` - event at distance T has zero weight
- The curve is smooth at both ends (ease-in / ease-out), fast in the middle

Weights are summed per `(source, target)` pair, then normalized so each row sums to 1.0.

**Output JSON format:**

```json
{
  "states": ["sunny", "cloudy", "rainy", "stormy", "foggy"],
  "matrix": {
    "sunny": { "sunny": 0.44, "cloudy": 0.25, ... },
    ...
  }
}
```

States appear in observation order. Rows sum to 1.0.

---

### `builder.py` - Matrix to Yantrix diagram

```
python src/builder.py <matrix.json> [-o output.mermaid]
```

Converts any Markov transition matrix into a Yantrix `stateDiagram-v2`. Generic - works for any state names and any number of states.

**Generated pattern per state:**

```
STATE --> ROLLING_STATE: TICK
state fork_state <<choice>>
ROLLING_STATE --> fork_state: [-]
fork_state --> TARGET_A: isLess(#prob, 0.441)   <- cumulative threshold
fork_state --> TARGET_B: isLess(#prob, 0.693)
fork_state --> TARGET_C                          <- default (remainder)
```

The `ROLLING_STATE` ByPass stores `#{prob} <= _random()` in context so the same rolled value is tested against all Fork thresholds. Targets are sorted descending by probability (most likely first), then converted to cumulative thresholds.

The first state in `states` becomes `+Init` and uses `coalesce($step, inc(#step))` to support both RESET (zeroes step) and TICK (increments step).

---

### `main.py` - Simulation runner

```
python src/main.py [steps]
```

Resets the automata, then dispatches `TICK` for the requested number of steps. Prints the first 10 states in sequence and a frequency histogram for all states.

```
Markov weather chain - 50 steps
sunny -> cloudy -> sunny -> sunny -> cloudy -> rainy -> stormy -> rainy -> cloudy -> sunny ...

  sunny    ##################                                   18
  cloudy   #############                                        13
  rainy    ###########                                          11
  stormy   ######                                                6
  foggy    ##                                                    2
```

Use `python src/main.py 1000` for a stable frequency estimate matching the learned matrix.
