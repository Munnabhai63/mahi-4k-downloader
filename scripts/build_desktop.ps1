$ErrorActionPreference = "Stop"

$env:TEMP = "F:\temp"
$env:TMP = "F:\temp"
$env:RUSTUP_HOME = "F:\rustup"
$env:CARGO_HOME = "F:\cargo"
$env:CARGO_TARGET_DIR = "F:\cargo_target\turbograb"
$env:PATH = "F:\cargo\bin;$env:PATH"

Write-Host "`n=== 1. Building Desktop Frontend ==="
pnpm --filter @turbograb/desktop build

Write-Host "`n=== 2. Building Tauri Standalone Release Executable ==="
pnpm --filter @turbograb/desktop tauri build --no-bundle

$PortableDir = "$PSScriptRoot\..\dist_release\My 4K Downloader Portable"
if (-not (Test-Path $PortableDir)) {
    New-Item -ItemType Directory -Path $PortableDir -Force | Out-Null
}

Copy-Item "F:\cargo_target\turbograb\release\turbograb-desktop.exe" "$PortableDir\My 4K Downloader.exe" -Force
Write-Host "`n=== Build Complete: Updated $PortableDir\My 4K Downloader.exe ==="

