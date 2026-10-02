@echo off
title Mahi 4K Downloader - 1-Click Desktop Setup
cd /d "%~dp0"

echo ======================================================================
echo          Mahi 4K Downloader (Turbo Edition) - By Munna Bhai
echo                  1-Click Desktop Setup and Installer
echo ======================================================================
echo.

REM Ensure Icon exists
if not exist "assets\mahi_4k_icon.ico" (
    echo [*] Generating official high-res Mahi 4K icons...
    python scripts\generate_icons.py >nul 2>&1
)

REM Define Paths
set "ROOT_DIR=%~dp0"
set "ICON_PATH=%ROOT_DIR%assets\mahi_4k_icon.ico"
set "LAUNCHER_VBS=%ROOT_DIR%scripts\silent_launcher.vbs"
set "LAUNCHER_BAT=%ROOT_DIR%Launch_Mahi_4K.bat"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs"

echo [*] Creating Desktop Shortcut...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$s = $ws.CreateShortcut('%DESKTOP_DIR%\Mahi 4K Downloader.lnk'); " ^
    "$s.TargetPath = 'wscript.exe'; " ^
    "$s.Arguments = '\"%LAUNCHER_VBS%\"'; " ^
    "$s.WorkingDirectory = '%ROOT_DIR%'; " ^
    "$s.IconLocation = '%ICON_PATH%,0'; " ^
    "$s.Description = 'Mahi 4K Downloader - By Munna Bhai'; " ^
    "$s.Save()"

if exist "%DESKTOP_DIR%\Mahi 4K Downloader.lnk" (
    echo [v] Desktop Shortcut Created: "%DESKTOP_DIR%\Mahi 4K Downloader.lnk"
) else (
    echo [!] Direct bat fallback shortcut...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ws = New-Object -ComObject WScript.Shell; " ^
        "$s = $ws.CreateShortcut('%DESKTOP_DIR%\Mahi 4K Downloader.lnk'); " ^
        "$s.TargetPath = '%LAUNCHER_BAT%'; " ^
        "$s.WorkingDirectory = '%ROOT_DIR%'; " ^
        "$s.IconLocation = '%ICON_PATH%,0'; " ^
        "$s.Description = 'Mahi 4K Downloader - By Munna Bhai'; " ^
        "$s.Save()"
)

echo [*] Creating Start Menu Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$s = $ws.CreateShortcut('%START_MENU_DIR%\Mahi 4K Downloader.lnk'); " ^
    "$s.TargetPath = 'wscript.exe'; " ^
    "$s.Arguments = '\"%LAUNCHER_VBS%\"'; " ^
    "$s.WorkingDirectory = '%ROOT_DIR%'; " ^
    "$s.IconLocation = '%ICON_PATH%,0'; " ^
    "$s.Description = 'Mahi 4K Downloader - By Munna Bhai'; " ^
    "$s.Save()"

echo.
echo ======================================================================
echo   [OK] Installation Complete!
echo   [OK] Desktop Shortcut: Mahi 4K Downloader
echo   [OK] Official Icon: assets\mahi_4k_icon.ico
echo ======================================================================
echo.
echo [*] Launching Mahi 4K Downloader now...
echo.

call "%LAUNCHER_BAT%"
