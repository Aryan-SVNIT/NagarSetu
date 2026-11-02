@echo off
setlocal
cd /d "%~dp0"
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
REM Optional C2PA support is intentionally not installed on every startup.
REM To enable it later, run: python -m pip install -r backend\requirements-optional.txt
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
