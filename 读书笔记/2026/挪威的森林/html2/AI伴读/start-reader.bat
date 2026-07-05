@echo off
setlocal
cd /d "%~dp0"

if not exist "reader-companion-server.cjs" (
  echo [ERROR] Cannot find reader-companion-server.cjs in %cd%
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Please install Node.js first: https://nodejs.org/
  pause
  exit /b 1
)

if "%OPENCODE_BASE_URL%"=="" set "OPENCODE_BASE_URL=http://127.0.0.1:10000/v1/chat/completions"
if "%OPENCODE_API_KEY%"=="" set "OPENCODE_API_KEY=123"
if "%OPENCODE_MODEL%"=="" set "OPENCODE_MODEL=opencode/deepseek-v4-flash-free"
if "%PORT%"=="" set "PORT=8765"

echo Starting reader companion service on http://127.0.0.1:%PORT%
echo LLM API: %OPENCODE_BASE_URL%
echo Model: %OPENCODE_MODEL%
echo Make sure OpenCode is already running on port 10000.
echo.
start "AI Reader Service" cmd /k "pushd ""%~dp0"" && node reader-companion-server.cjs"

timeout /t 2 /nobreak >nul
start "" "%~dp0reader-companion-app.html"

echo Reader companion opened.
echo Keep the service window open while using AI features.
pause
