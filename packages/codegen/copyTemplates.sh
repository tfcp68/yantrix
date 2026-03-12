#!/usr/bin/env bash
set -euo pipefail

# Copy Eta templates from src to dist without external copy dependencies.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
SRC_DIR="${SCRIPT_DIR}/src/core/templates"
DST_DIR="${SCRIPT_DIR}/dist/templates"

if [[ ! -d "${SRC_DIR}" ]]; then
	echo "Source templates directory not found: ${SRC_DIR}" >&2
	exit 1
fi

mkdir -p "${DST_DIR}"

# Preserve nested structure and copy all template files.
cp -R "${SRC_DIR}/." "${DST_DIR}/"

echo "Templates copied: ${SRC_DIR} -> ${DST_DIR}"

