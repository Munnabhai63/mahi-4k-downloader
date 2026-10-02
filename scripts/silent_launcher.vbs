Set WshShell = CreateObject("WScript.Shell")
strCurrentDir = WshShell.CurrentDirectory
WshShell.Run chr(34) & strCurrentDir & "\Launch_Mahi_4K.bat" & chr(34), 0, False
Set WshShell = Nothing
