@echo off
title Mahi 4K Downloader - By Munna Bhai
cd /d "%~dp0"

echo ======================================================
echo    Mahi 4K Downloader - By Munna Bhai
echo    Launching Desktop Application Engine...
echo ======================================================

REM Check and Start API Service on Port 4000
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [*] Starting Mahi 4K API Backend on Port 4000...
    if exist "services\api\dist\main.js" (
        start "" /B node services\api\dist\main.js >nul 2>&1
    ) else if exist "dist\main.js" (
        start "" /B node dist\main.js >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo [v] API Backend is active on Port 4000.
)

REM Check and Start Web Service on Port 3000
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [*] Starting Mahi 4K Web Portal on Port 3000...
    if exist "apps\web" (
        start "" /B pnpm --filter @turbograb/web start --port 3000 >nul 2>&1
    ) else if exist "web" (
        start "" /B node web\server.js >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo [v] Web Portal is active on Port 3000.
)

REM Launch Native App Window
set "APP_URL=http://localhost:3000"
set "USER_DATA_DIR=%LOCALAPPDATA%\Mahi4KDownloader\Profile"

where msedge >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Launching Native Desktop Window via Edge Engine...
    start "" msedge.exe --app="%APP_URL%" --app-window-size=1280,850 --user-data-dir="%USER_DATA_DIR%"
    exit /b 0
)

where chrome >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Launching Native Desktop Window via Chrome Engine...
    start "" chrome.exe --app="%APP_URL%" --app-window-size=1280,850 --user-data-dir="%USER_DATA_DIR%"
    exit /b 0
)

echo [*] Opening in Default Browser...
start %APP_URL%
exit /b 0
