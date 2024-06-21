#!/usr/bin/env bash

RED="\033[1;31m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RESET="\033[0m"

function log {
	echo -e "$@"
}


ROOT=$(pwd)
CODEGEN_FILE="$ROOT/bin/codegen.ts"
OUT_DIR="$ROOT/__tests__/fixtures/GamePhaseAutomata_generated.ts"

count=0

for file in $ROOT/__tests__/fixtures/*.txt
do
	filename=${file##*/}
	log "${YELLOW}⌛ Generating Automata from $filename...${RESET}"
	pnpm yantrix codegen --verbose -l TypeScript -o $OUT_DIR -c "GamePhaseAutomata" $file
	((count++))
done

log "${GREEN}✅ Successfully generated ${count} Automata file(s)!${RESET}"
