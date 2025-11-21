#!/bin/bash
# Wrapper to always add --host flag to vite dev
if [[ "$1" == "dev" ]]; then
    exec npx vite dev --host 0.0.0.0 "$@"
else
    exec npx vite "$@"
fi
