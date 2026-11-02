#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
# Optional C2PA provenance support is not installed on every startup.
# To enable it later, run: python -m pip install -r backend/requirements-optional.txt
exec uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port "${PORT:-8000}"
