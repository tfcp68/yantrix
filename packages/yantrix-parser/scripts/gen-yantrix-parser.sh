#!/usr/bin/env bash

ROOT=$(pwd)

OUTPUT_FILE="${ROOT}/src/yantrixParser.ts"
INPUT_GRAMMAR_FILE="${ROOT}/src/grammar/parserGrammar.jison"
GEN_TYPE="typescript"
CLASS_NAME="Yantrix"

DISABLE_FLAGS="/* eslint-disable */\n// @ts-nocheck"

ts-jison \
	-t "${GEN_TYPE}" \
	-n "${CLASS_NAME}" \
	-o "${OUTPUT_FILE}" \
	"${INPUT_GRAMMAR_FILE}"

# add disable flags on top of generated file
sed -i "1i${DISABLE_FLAGS}" "${OUTPUT_FILE}"