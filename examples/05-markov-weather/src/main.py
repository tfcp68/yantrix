"""
main.py - Run the Markov weather simulation using the generated automata.

Usage: python src/main.py [steps]
  steps - number of TICK dispatches (default: 20)

Requires: pip install -r requirements.txt
          pnpm generate (to build src/generated/weather_markov_automata.py)
"""

import sys

sys.path.insert(0, "src")

from generated.weather_markov_automata import (
    actions_dictionary,
    create_weather_markov_automata,
)

STATES = ["sunny", "cloudy", "rainy", "stormy", "foggy"]


def run(steps: int) -> None:
    fsm = create_weather_markov_automata()
    fsm["dispatch"]({"action": actions_dictionary["RESET"], "payload": {"step": 0}})

    history = []
    for _ in range(steps):
        fsm["dispatch"]({"action": actions_dictionary["TICK"], "payload": {}})
        ctx = fsm["get_context"]()["context"]
        history.append(ctx.get("weather", "?"))

    print(f"Markov weather chain - {steps} steps")
    preview = " -> ".join(history[:10])
    if steps > 10:
        preview += " ..."
    print(preview)
    print()

    for state in STATES:
        n = history.count(state)
        bar = "#" * n
        print(f"  {state:8s} {bar:<50s} {n:3d}")


if __name__ == "__main__":
    steps = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    run(steps)
