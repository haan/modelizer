@echo off
setlocal
cd /d "%~dp0"

if not exist "miniserve.exe" (
  echo Missing miniserve.exe in %cd%
  echo Download it and place it next to this script.
  pause
  exit /b 1
)

if not exist "dist\\index.html" (
  echo Missing dist\\index.html in %cd%
  echo Copy the built site into bundle\\dist first.
  pause
  exit /b 1
)

start "" "http://localhost:4173"
.\miniserve.exe "dist" --index index.html --port 4173 --spa
