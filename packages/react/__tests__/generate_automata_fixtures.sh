#!/usr/bin/env bash
set -euo pipefail

FIXTURES_DIR="__tests__/fixtures"
OUT_DIR="__tests__/generated"
LANG_DEFAULT="TypeScript"

TASKS=$(
  cat <<'EOF'
traffic-light.mermaid;TrafficLightAutomata;TrafficLightAutomata
game_phase.mermaid;GamePhaseAutomata;GamePhaseAutomataTest
traffic-light_two_counters.mermaid;TrafficLightAutomataTwoCounters;TrafficLightAutomataTwoCounters
EOF
)

mkdir -p "$OUT_DIR"

while IFS=';' read -r DIAGRAM CLASS FILE_NAME LANG; do
  [[ -z "${DIAGRAM:-}" ]] && continue
  [[ -z "$DIAGRAM" || -z "$CLASS" || -z "$FILE_NAME" ]] && continue

  LANG="${LANG:-$LANG_DEFAULT}"
  INPUT="${FIXTURES_DIR}/${DIAGRAM}"
  OUTFILE="${OUT_DIR}/${FILE_NAME}.ts"

  echo "Generating $CLASS..."
  pnpm yantrix codegen "$INPUT" --outfile "$OUTFILE" --language "$LANG" --className "$CLASS"
done <<< "$TASKS"
