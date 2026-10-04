$ErrorActionPreference = "Stop"

$env:TEMP = "F:\temp"
$env:TMP = "F:\temp"
$env:RUSTUP_HOME = "F:\rustup"
$env:CARGO_HOME = "F:\cargo"
$env:CARGO_TARGET_DIR = "F:\cargo_target\turbograb"
$env:PATH = "F:\cargo\bin;$env:PATH"

New-Item -ItemType Directory -Path "F:\temp" -Force | Out-Null

$DistReleaseDir = "$PSScriptRoot\..\dist_release"
if (-not (Test-Path $DistReleaseDir)) {
    New-Item -ItemType Directory -Path $DistReleaseDir -Force | Out-Null
}

Write-Host "`n=== 1. Building Desktop Frontend ==="
pnpm --filter @turbograb/desktop build

Write-Host "`n=== 2. Building Tauri NSIS Release Installer ==="
pnpm --filter @turbograb/desktop tauri build --bundles nsis --no-sign

Write-Host "`n=== 3. Packaging Portable Distribution ==="
$PortableDir = "$DistReleaseDir\My 4K Downloader Portable"
if (Test-Path $PortableDir) { Remove-Item -Path $PortableDir -Recurse -Force }
New-Item -ItemType Directory -Path $PortableDir -Force | Out-Null

Copy-Item "F:\cargo_target\turbograb\release\turbograb-desktop.exe" "$PortableDir\My 4K Downloader.exe" -Force
Copy-Item "apps\desktop\src-tauri\binaries\yt-dlp-x86_64-pc-windows-msvc.exe" "$PortableDir\yt-dlp.exe" -Force
Copy-Item "apps\desktop\src-tauri\binaries\ffmpeg-x86_64-pc-windows-msvc.exe" "$PortableDir\ffmpeg.exe" -Force

$ReadmeContent = @"
==================================================
My 4K Downloader — Portable Edition (Windows x64)
Universal 4K Video & High Quality 320kbps MP3 Downloader
Created by Munna Bhai
==================================================

HOW TO RUN:
1. Double click 'My 4K Downloader.exe' to launch.
2. The application is 100% standalone and self-contained:
   - yt-dlp binary is bundled
   - FFmpeg 9.0.1 media engine is bundled
   - Zero external dependencies: NO Python, NO Node.js, NO Rust required.
3. Media is saved directly to your device at:
   Downloads\My 4K Downloader\

==================================================
"@
Set-Content -Path "$PortableDir\README.txt" -Value $ReadmeContent

Write-Host "`n=== 4. Creating Release Portable ZIP ==="
$ZipFile = "$DistReleaseDir\My_4K_Downloader_v1.0.0_Portable_x64.zip"
if (Test-Path $ZipFile) { Remove-Item -Path $ZipFile -Force }
Compress-Archive -Path "$PortableDir\*" -DestinationPath $ZipFile -CompressionLevel Optimal

Write-Host "`n=== 5. Copying NSIS Installer to Release Directory ==="
$NsisSource = "F:\cargo_target\turbograb\release\bundle\nsis\My 4K Downloader_1.0.0_x64-setup.exe"
if (Test-Path $NsisSource) {
    Copy-Item $NsisSource "$DistReleaseDir\My_4K_Downloader_1.0.0_x64_Setup.exe" -Force
}

Write-Host "`n=== 6. Updating Web Public Downloads ==="
$WebPublicDir = "$PSScriptRoot\..\apps\web\public"
Copy-Item $ZipFile "$WebPublicDir\Mahi_4K_Downloader_Portable.zip" -Force
Copy-Item $ZipFile "$WebPublicDir\My_4K_Downloader_Portable.zip" -Force
if (Test-Path $NsisSource) {
    Copy-Item $NsisSource "$WebPublicDir\My_4K_Downloader_Setup.exe" -Force
}

Write-Host "`n=== Packaging Completed Successfully! ==="
Get-ChildItem -Path $DistReleaseDir
