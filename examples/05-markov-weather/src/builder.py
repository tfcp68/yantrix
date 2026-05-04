"""
builder.py - Generate a Yantrix stateDiagram-v2 from a Markov transition matrix.

Generic: works for any state names, any number of states. Produces one
ROLLING_* ByPass state + one Fork per source state. The ByPass calls
_random() into context #prob; Fork conditions use cumulative thresholds
sorted descending by probability so the most likely transition is checked
first.

Input JSON: {"states": [...], "matrix": {src: {dst: prob, ...}, ...}}
Output: Yantrix mermaid diagram text
"""

import argparse
import json
import sys


def _snake(name: str) -> str:
    return name.lower()


def _upper(name: str) -> str:
    return name.upper()


def _rolling(name: str) -> str:
    return f"ROLLING_{_upper(name)}"


def _fork(name: str) -> str:
    return f"fork_{_snake(name)}"


def build_diagram(states: list, matrix: dict) -> str:
    lines = ["stateDiagram-v2", "    direction LR", ""]
    first = states[0]
    lines.append(f"    [*] --> {_upper(first)}: RESET (step=0)")

    for state in states:
        if state not in matrix:
            continue
        su = _upper(state)
        roll = _rolling(state)

        lines.append("")
        lines.append(f"    {su} --> {roll}: TICK")

        # Sort targets descending by probability
        targets = sorted(matrix[state].items(), key=lambda kv: kv[1], reverse=True)
        n = len(targets)

        # Declare all fork nodes (N-1 binary forks for N targets)
        # Each fork has exactly one isLess predicate, avoiding duplicate
        # action label errors when the same predicate name is reused.
        for k in range(n - 1):
            lines.append(f"    state {_fork(state)}_{k} <<choice>>")

        fork0 = f"{_fork(state)}_0"
        lines.append(f"    {roll} --> {fork0}: [-]")

        cumulative = 0.0
        for k, (dst, prob) in enumerate(targets[:-1]):
            fork_k = f"{_fork(state)}_{k}"
            cumulative += prob
            lines.append(f"    {fork_k} --> {_upper(dst)}: isLess(#prob, {cumulative:.3f})")
            if k < n - 2:
                fork_next = f"{_fork(state)}_{k + 1}"
                lines.append(f"    {fork_k} --> {fork_next}")
            else:
                lines.append(f"    {fork_k} --> {_upper(targets[-1][0])}")

    # Default context note
    lines.append("")
    lines.append("    note right of [*]")
    lines.append("        #{step = 0, weather = 'unknown', prob = 0}")
    lines.append("    end note")

    # State and ByPass notes
    for i, state in enumerate(states):
        if state not in matrix:
            continue
        su = _upper(state)
        roll = _rolling(state)
        side_state = "left" if i % 2 == 0 else "right"
        lines.append("")
        lines.append(f"    note {side_state} of {su}")
        if state == first:
            lines.append("        +Init")
            lines.append("        #{step} <= coalesce($step, inc(#step))")
        else:
            lines.append("        #{step} <= inc(#step)")
        lines.append(f"        #{{weather}} <= '{_snake(state)}'")
        lines.append("    end note")
        lines.append("")
        lines.append(f"    note right of {roll}")
        lines.append("        +ByPass")
        lines.append("        #{prob} <= _random()")
        lines.append("    end note")

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("input", help="JSON matrix file")
    parser.add_argument("-o", "--output", metavar="FILE", help="Output .mermaid file (default: stdout)")
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    states = data["states"]
    matrix = data["matrix"]

    diagram = build_diagram(states, matrix)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(diagram)
    else:
        print(diagram, end="")


if __name__ == "__main__":
    main()
