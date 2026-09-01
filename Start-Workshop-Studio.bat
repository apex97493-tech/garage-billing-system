@echo off
title Motorcycle Workshop & Modification Studio POS
color 0F

echo =====================================================================
echo       MOTORCYCLE WORKSHOP & MODIFICATION STUDIO POS
echo          Standalone Desktop Edition (Zero-Install)
echo =====================================================================
echo.
cd /d "%~dp0"

:: Ensure data directory exists for database
if not exist "data" mkdir data

echo Starting Workshop Engine on http://localhost:5000...
echo.

:: Open browser automatically
start http://localhost:5000

echo =====================================================================
echo  STATUS: Studio is ACTIVE and Running!
echo  All customer and billing data is saved to ./data/
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
