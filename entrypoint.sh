#!/bin/sh
set -e

export PORT="${PORT:-8080}"
export PYTHONPATH="/app:${PYTHONPATH}"
export PYTHONUNBUFFERED=1

echo "=================================================="
echo "Starting PodLens production server on port ${PORT}"
echo "=================================================="

exec python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT}"
