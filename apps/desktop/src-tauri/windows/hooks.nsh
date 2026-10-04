; Custom NSIS Installer & Uninstaller Hooks for My 4K Downloader
; Registers and unregisters the m4k:// deep-link protocol dynamically on the user's system

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Registering m4k:// deep-link protocol..."
  WriteRegStr HKCU "Software\Classes\m4k" "" "URL:My 4K Downloader Protocol"
  WriteRegStr HKCU "Software\Classes\m4k" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\m4k\shell\open\command" "" '"$INSTDIR\My 4K Downloader.exe" "%1"'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DetailPrint "Unregistering m4k:// deep-link protocol..."
  DeleteRegKey HKCU "Software\Classes\m4k"
!macroend
