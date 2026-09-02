@echo off
title Create Desktop Shortcut
color 0B

echo =====================================================================
echo         Creating Royal Enfield Workshop Studio Desktop Icon...
echo =====================================================================
echo.
cd /d "%~dp0"

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Desktop = [Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut(\"$Desktop\Royal Enfield Workshop Studio.lnk\"); $Shortcut.TargetPath = \"wscript.exe\"; $Shortcut.Arguments = \"`\"%~dp0Launch-App-Silent.vbs`\"\"; $Shortcut.WorkingDirectory = \"%~dp0\"; $Shortcut.IconLocation = \"shell32.dll,220\"; $Shortcut.Description = \"Royal Enfield Workshop Billing & Management Studio\"; $Shortcut.Save()"

echo [SUCCESS] Desktop Icon created successfully!
echo You can now start the software directly from your Desktop by double-clicking:
echo "Royal Enfield Workshop Studio"
echo.
pause
