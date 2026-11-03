@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required.
  pause
  exit /b 1
)
node prototypes/adventurer-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/mina-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/pino-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/inaho-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/gonta-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/jinbei-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/watari-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/slime-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/night-bat-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/field-rat-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/dorotabo-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/squid-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/rockhorn-goat-8dir/export.mjs
if errorlevel 1 goto failed
node prototypes/small-rock-crab-8dir/export.mjs
if errorlevel 1 goto failed
echo All characters exported into their Studio output folders.
pause
exit /b 0
:failed
echo Export failed. Check the game dependencies and browser installation.
pause
exit /b 1
