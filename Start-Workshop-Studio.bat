@echo off
title Royal Enfield Workshop Studio POS
color 0A

echo =====================================================================
echo          ROYAL ENFIELD WORKSHOP & MODIFICATION STUDIO
echo              100%% Standalone Portable Edition
echo =====================================================================
echo.
cd /d "%~dp0"

:: Ensure data directory exists
if not exist "data" mkdir data

echo [1/2] Initializing Embedded Engine...
echo [2/2] Launching Workshop Studio...
echo.

:: Try opening in Native App Window mode (Chrome / Edge) for premium look
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5000 --window-size=1366,768
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=http://localhost:5000 --window-size=1366,768
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5000 --window-size=1366,768
) else (
    start http://localhost:5000
)

echo =====================================================================
echo  STATUS: Workshop Studio is ACTIVE and RUNNING!
echo  URL: http://localhost:5000
echo.
echo  All 21,600+ Royal Enfield parts and billing data are saved to ./data/
echo  (Minimize this window while using the software)
echo =====================================================================
echo.

:: Always prioritize self-contained embedded node.exe
if exist "%~dp0bin\node.exe" (
    "%~dp0bin\node.exe" backend/server.js
) else (
    node backend/server.js
)

pause
