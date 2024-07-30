#!/usr/bin/env bash

ROOT=$(pwd)

GEN_TYPE="typescript"
CLASS_NAME="Yantrix"
INPUT_FILE="${ROOT}/src/grammar/parserGrammar.jison"
OUTPUT_FILE="${ROOT}/src/yantrixParser.ts"

DISABLE_CHECK_FLAGS="/* eslint-disable */\n// @ts-nocheck"

ts-jison \
	-t $GEN_TYPE \
	-n $CLASS_NAME \
	-o $OUTPUT_FILE \
	$INPUT_FILE

sed -i "1i$DISABLE_CHECK_FLAGS\n" $OUTPUT_FILE