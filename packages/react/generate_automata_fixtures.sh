#!/usr/bin/env bash
set -euo pipefail

declare -A TASK1=(
  [input]="__tests__/fixtures/traffic-light.mermaid"
  [outfile]="__tests__/fixtures/TrafficLightAutomata.ts"
  [language]="TypeScript"
  [className]="TrafficLightAutomata"
)

declare -A TASK2=(
  [input]="__tests__/fixtures/game_phase.mermaid"
  [outfile]="__tests__/fixtures/GamePhaseAutomataTest.ts"
  [language]="TypeScript"
  [className]="GamePhaseAutomata"
)

TASKS=(TASK1 TASK2)

for task_name in "${TASKS[@]}"; do
  declare -n task="$task_name"
  echo "Generating ${task[className]}..."
  pnpm yantrix codegen \
    "${task[input]}" \
    --outfile "${task[outfile]}" \
    --language "${task[language]}" \
    --className "${task[className]}"
done
