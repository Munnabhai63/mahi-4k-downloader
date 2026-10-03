$ErrorActionPreference = "Stop"

$env:TEMP = "F:\temp"
$env:TMP = "F:\temp"
$env:RUSTUP_HOME = "F:\rustup"
$env:CARGO_HOME = "F:\cargo"
$env:CARGO_TARGET_DIR = "F:\cargo_target\turbograb"
$env:PATH = "F:\cargo\bin;$env:PATH"

New-Item -ItemType Directory -Path "F:\temp" -Force | Out-Null

Write-Host "=== 1. Building Desktop Frontend ==="
pnpm --filter @turbograb/desktop build

Write-Host "=== 2. Building Tauri NSIS Release Installer ==="
pnpm --filter @turbograb/desktop tauri build --bundles nsis --no-sign

Write-Host "=== 3. Packaging Portable Distribution ==="
$PortableDir = "F:\cargo_target\turbograb\dist_portable\My 4K Downloader Portable"
if (Test-Path $PortableDir) { Remove-Item -Path $PortableDir -Recurse -Force }
New-Item -ItemType Directory -Path $PortableDir -Force | Out-Null

Copy-Item "F:\cargo_target\turbograb\release\turbograb-desktop.exe" "$PortableDir\My 4K Downloader.exe" -Force
Copy-Item "apps\desktop\src-tauri\binaries\yt-dlp-x86_64-pc-windows-msvc.exe" "$PortableDir\yt-dlp.exe" -Force
Copy-Item "apps\desktop\src-tauri\binaries\ffmpeg-x86_64-pc-windows-msvc.exe" "$PortableDir\ffmpeg.exe" -Force

$ReadmeContent = @"
My 4K Downloader — Portable Edition (Windows x64)
Created by Munna Bhai

HOW TO USE:
1. Double click 'My 4K Downloader.exe' to launch.
2. The app is 100% self-contained: yt-dlp and FFmpeg are bundled directly in this folder.
3. No Python, Node.js, or external tools required.
4. Downloads are saved automatically to your user 'Downloads\My 4K Downloader\' folder.
"@
Set-Content -Path "$PortableDir\README.txt" -Value $ReadmeContent

Write-Host "=== Build Completed Successfully! ==="
