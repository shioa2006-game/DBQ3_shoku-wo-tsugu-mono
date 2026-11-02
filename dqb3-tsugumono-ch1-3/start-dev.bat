@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm.cmd install
if errorlevel 1 (
  echo.
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Starting Vite dev server...
echo Browser will open at http://localhost:5173/builder_sprite_lab/
call npm.cmd run dev -- --host 127.0.0.1 --open /builder_sprite_lab/

echo.
echo Dev server stopped.
pause
