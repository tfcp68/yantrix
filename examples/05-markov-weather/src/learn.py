"""
learn.py - Compute a Markov transition matrix from a timestamped event log.

Algorithm: for each event, look at the next 5 events in sequence. Each
subsequent event receives a cosine ease-in-out weight that decays to zero
at --decay-time. Weights are normalized per source event to produce
probabilities.

Output: JSON of shape {"states": [...], "matrix": {src: {dst: prob}}}
"""

import argparse
import csv
import json
import math
import sys
from collections import defaultdict
from datetime import datetime, timezone


def parse_timestamp(s: str) -> float:
    s = s.strip()
    try:
        return float(s)
    except ValueError:
        pass
    # ISO 8601 with optional Z suffix
    normalized = s.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp() * 1000.0  # epoch ms


def cosine_decay(dt: float, total: float) -> float:
    if dt >= total:
        return 0.0
    return 0.5 * (1.0 + math.cos(math.pi * dt / total))


def build_weights(events: list, decay_time: float, window: int = 5) -> dict:
    weights = defaultdict(lambda: defaultdict(float))
    for i, (t_i, e_i) in enumerate(events):
        end = min(i + window + 1, len(events))
        for j in range(i + 1, end):
            t_j, e_j = events[j]
            dt = t_j - t_i
            w = cosine_decay(dt, decay_time)
            if w > 0:
                weights[e_i][e_j] += w
    return weights


def normalize(weights: dict) -> dict:
    probs = {}
    for src, targets in weights.items():
        total = sum(targets.values())
        if total > 0:
            probs[src] = {dst: w / total for dst, w in targets.items()}
    return probs


def load_events(path: str) -> list:
    events = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ts = parse_timestamp(row["timestamp"])
            eid = row["event_id"].strip()
            events.append((ts, eid))
    return events


def main():
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("input", help="CSV file with columns: timestamp,event_id")
    parser.add_argument(
        "--decay-time",
        type=float,
        default=10000.0,
        metavar="T",
        help="Time span (same unit as timestamps) at which weight reaches 0. Default: 10000",
    )
    parser.add_argument("-o", "--output", metavar="FILE", help="Output JSON file (default: stdout)")
    args = parser.parse_args()

    events = load_events(args.input)
    if not events:
        print("Error: no events loaded", file=sys.stderr)
        sys.exit(1)

    weights = build_weights(events, args.decay_time)
    probs = normalize(weights)

    # Preserve insertion order: states seen as sources first, then any
    # states seen only as targets
    seen_order = []
    seen_set = set()
    for _, eid in events:
        if eid not in seen_set:
            seen_order.append(eid)
            seen_set.add(eid)
    for src in probs:
        for dst in probs[src]:
            if dst not in seen_set:
                seen_order.append(dst)
                seen_set.add(dst)

    result = {"states": seen_order, "matrix": probs}
    text = json.dumps(result, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)


if __name__ == "__main__":
    main()
