#!/usr/bin/env bash
set -euo pipefail

DIAGRAMS_DIR="__tests__/diagrams"
OUT_DIR="__tests__/generated"
LANG_DEFAULT="TypeScript"

TASKS=$(
  cat <<'EOF'
traffic-light.mermaid;TrafficLightAutomata;TrafficLightAutomata_generated
game_phase.mermaid;GamePhaseAutomata;GamePhaseAutomataTest_generated
traffic-light_two_counters.mermaid;TrafficLightAutomataTwoCounters;TrafficLightAutomataTwoCounters_generated
EOF
)

mkdir -p "$OUT_DIR"

while IFS=';' read -r DIAGRAM CLASS FILE_NAME LANG; do
  [[ -z "${DIAGRAM:-}" ]] && continue
  [[ -z "$DIAGRAM" || -z "$CLASS" || -z "$FILE_NAME" ]] && continue

  LANG="${LANG:-$LANG_DEFAULT}"
  INPUT="${DIAGRAMS_DIR}/${DIAGRAM}"
  OUTFILE="${OUT_DIR}/${FILE_NAME}.ts"

  echo "Generating $CLASS..."
  pnpm yantrix codegen "$INPUT" --outfile "$OUTFILE" --language "$LANG" --className "$CLASS"
done <<< "$TASKS"
