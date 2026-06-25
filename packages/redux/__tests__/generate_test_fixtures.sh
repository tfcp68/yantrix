#!/usr/bin/env bash
set -euo pipefail

FIXTURES_DIR="__tests__/fixtures"
LANG_DEFAULT="TypeScript"

TASKS=$(
  cat <<'EOF'
traffic-light.mermaid;TrafficLightAutomata;TrafficLightAutomata
game_phase.mermaid;GamePhaseAutomataTest;GamePhaseAutomataTest
EOF
)

while IFS=';' read -r DIAGRAM CLASS FILE_NAME LANG; do
  [[ -z "${DIAGRAM:-}" ]] && continue
  [[ -z "$DIAGRAM" || -z "$CLASS" || -z "$FILE_NAME" ]] && continue

  LANG="${LANG:-$LANG_DEFAULT}"
  INPUT="${FIXTURES_DIR}/${DIAGRAM}"
  OUTFILE="${FIXTURES_DIR}/${FILE_NAME}.ts"

  echo "Generating $CLASS..."
  pnpm yantrix codegen "$INPUT" --outfile "$OUTFILE" --language "$LANG" --className "$CLASS"
done <<< "$TASKS"
