@echo off
title Create Desktop Shortcut
color 0B

echo =====================================================================
echo         Creating Royal Enfield Workshop Studio Desktop Icon...
echo =====================================================================
echo.
cd /d "%~dp0"

:: Create shortcut using native Windows Script Host (works on all Windows versions 100% cleanly)
set "VBS_SCRIPT=%TEMP%\CreateWorkshopShortcut_%RANDOM%.vbs"

(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo strDesktop = WshShell.SpecialFolders^("Desktop"^)
echo strCurrentDir = "%~dp0"
echo If Right^(strCurrentDir, 1^) = "\" Then strCurrentDir = Left^(strCurrentDir, Len^(strCurrentDir^) - 1^)
echo Set oShortcut = WshShell.CreateShortcut^(strDesktop ^& "\Royal Enfield Workshop Studio.lnk"^)
echo oShortcut.TargetPath = "wscript.exe"
echo oShortcut.Arguments = """" ^& strCurrentDir ^& "\Launch-App-Silent.vbs"""
echo oShortcut.WorkingDirectory = strCurrentDir
echo oShortcut.IconLocation = "shell32.dll,220"
echo oShortcut.Description = "Royal Enfield Workshop Studio POS"
echo oShortcut.Save
) > "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%" 2>nul

echo.
echo =====================================================================
echo  [SUCCESS] Desktop Icon created successfully!
echo.
echo  You can now start the software directly from your Desktop:
echo  "Royal Enfield Workshop Studio"
echo =====================================================================
echo.
pause
