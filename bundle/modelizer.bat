@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "APPDIR=%cd%\app"
set "PORT=8080"
set "URL=http://localhost:%PORT%"

echo.
echo ==========================
echo   Modelizer (Local Run)
echo ==========================
echo Folder: %cd%
echo.

REM --- make sure app folder exists ---
if not exist "%APPDIR%\" (
  echo ERROR: Missing folder "%APPDIR%"
  pause
  exit /b 1
)

cd /d "%APPDIR%"

REM --- sanity checks ---
if not exist "miniserve.exe" (
  echo ERROR: Missing miniserve.exe in %cd%
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo ERROR: Missing dist\index.html in %cd%
  pause
  exit /b 1
)

echo Starting local server...
echo URL: %URL%
echo.

REM Start server in its own window so closing it stops the server
start "Modelizer Server" "%cd%\miniserve.exe" "dist" --index index.html --port %PORT% --spa

REM Give it a moment to start, then open browser
timeout /t 1 /nobreak >nul
start "" "%URL%"

exit /b 0
