Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' Check for embedded node.exe
If FSO.FileExists(strPath & "\bin\node.exe") Then
    nodeCmd = """" & strPath & "\bin\node.exe"" """ & strPath & "\backend\server.js"""
Else
    nodeCmd = "node """ & strPath & "\backend\server.js"""
End If

' Launch backend silently without black command prompt window
WshShell.Run nodeCmd, 0, False

' Wait 1.5 seconds for server to start, then open browser
WScript.Sleep 1500
WshShell.Run "http://localhost:5000"
