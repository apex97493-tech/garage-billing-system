@echo off
title Motorcycle Workshop & Modification Studio POS
color 0F

echo =====================================================================
echo       MOTORCYCLE WORKSHOP & MODIFICATION STUDIO POS
echo             100%% Offline Portable Edition
echo =====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking embedded database...
if not exist "data" mkdir data

echo [2/2] Starting Workshop Engine on http://localhost:5000...
echo.
echo Opening Workshop Studio in your browser...
start http://localhost:5000

echo.
echo =====================================================================
echo  STATUS: Workshop Software is ACTIVE!
echo  All data is automatically saved to ./data/ on this drive.
echo  Minimize this window while using the software.
echo =====================================================================
echo.

:: Check if portable node is provided in bin\node.exe, otherwise use system node
if exist "%~dp0bin\node.exe" (
    "%~dp0bin\node.exe" backend/server.js
) else (
    node backend/server.js
)

pause
