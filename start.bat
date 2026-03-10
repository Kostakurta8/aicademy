@echo off
title AIcademy - Starting...
cd /d "%~dp0"

echo.
echo  ==============================
echo    AIcademy - Loading...
echo  ==============================
echo.

:: Kill any leftover node processes to free port 3000
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Clear old cache to avoid Turbopack permission issues
if exist ".next" (
  attrib -r -h -s ".next\*.*" /s /d >nul 2>&1
  rmdir /s /q ".next" 2>nul
)

:: Start the dev server in the background
start "" /b cmd /c "npm run dev"

:: Wait for the server to be ready (try port 3000)
echo  Waiting for server to start...
:wait
timeout /t 1 /nobreak >nul
curl -s -o nul http://localhost:3000 2>nul
if errorlevel 1 goto wait

:: Open in default browser
echo  Opening AIcademy in your browser...
start http://localhost:3000

echo.
echo  ==============================
echo    AIcademy is running!
echo    http://localhost:3000
echo  ==============================
echo.
echo  Press Ctrl+C or close this window to stop.
echo.

:: Keep the window open so the server stays alive
cmd /k
