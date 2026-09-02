Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' Check for embedded node.exe
If FSO.FileExists(strPath & "\bin\node.exe") Then
    nodeCmd = """" & strPath & "\bin\node.exe"" """ & strPath & "\backend\server.js"""
Else
    nodeCmd = "node """ & strPath & "\backend\server.js"""
End If

' Launch backend engine silently without black command prompt window
WshShell.Run nodeCmd, 0, False

' Wait 1.5 seconds for engine boot
WScript.Sleep 1500

' Try opening in clean app-window mode (Chrome or Edge)
If FSO.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    WshShell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://localhost:5000 --window-size=1366,768"
ElseIf FSO.FileExists("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") Then
    WshShell.Run """C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"" --app=http://localhost:5000 --window-size=1366,768"
ElseIf FSO.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
    WshShell.Run """C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"" --app=http://localhost:5000 --window-size=1366,768"
Else
    WshShell.Run "http://localhost:5000"
End If
