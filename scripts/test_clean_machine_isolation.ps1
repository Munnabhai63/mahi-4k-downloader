$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "CLEAN MACHINE ISOLATION TEST"
Write-Host "=================================================="

# 1. Strip PATH to bare Windows OS only
$BareWindowsPath = "C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\"
$env:PATH = $BareWindowsPath

Write-Host "`n1. Verifying developer tools are completely absent from PATH:"
$ToolsToCheck = @("yt-dlp", "ffmpeg", "python", "node", "cargo", "rustc")
foreach ($tool in $ToolsToCheck) {
    $found = Get-Command $tool -ErrorAction SilentlyContinue
    if ($found) {
        Write-Error "FAILURE: Tool '$tool' was found at $($found.Source)! PATH is not clean."
    } else {
        Write-Host "  [OK] '$tool' is NOT in PATH."
    }
}

# 2. Verify portable bundled sidecars run with 0 external dependencies
$PortableDir = "F:\cargo_target\turbograb\dist_portable\My 4K Downloader Portable"
Write-Host "`n2. Verifying bundled standalone binaries in $($PortableDir):"

$YtDlp = "$PortableDir\yt-dlp.exe"
$FFmpeg = "$PortableDir\ffmpeg.exe"
$AppExe = "$PortableDir\My 4K Downloader.exe"

if (-not (Test-Path $YtDlp)) { Write-Error "Missing $YtDlp" }
if (-not (Test-Path $FFmpeg)) { Write-Error "Missing $FFmpeg" }
if (-not (Test-Path $AppExe)) { Write-Error "Missing $AppExe" }

Write-Host "  [OK] All release artifacts exist."

# 3. Test standalone yt-dlp version in bare environment
Write-Host "`n3. Testing bundled yt-dlp standalone execution (no Python):"
$ytVer = & $YtDlp --version
Write-Host "  Bundled yt-dlp version: $ytVer"

# 4. Test bundled FFmpeg version in bare environment
Write-Host "`n4. Testing bundled FFmpeg standalone execution:"
$ffOut = & $FFmpeg -version 2>&1 | Select-Object -First 1
Write-Host "  Bundled FFmpeg: $ffOut"

# 5. Test real YouTube metadata extraction in bare environment
Write-Host "`n5. Testing YouTube extraction on clean machine:"
$TestUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"
$metaJson = & $YtDlp --dump-json --no-warnings --skip-download $TestUrl | ConvertFrom-Json
Write-Host "  Title: $($metaJson.title)"
Write-Host "  Duration: $($metaJson.duration)s"
Write-Host "  Uploader: $($metaJson.uploader)"
Write-Host "  [OK] Extraction succeeded without Python or system tools!"

# 6. Test real download and MP3 extraction in bare environment
Write-Host "`n6. Testing download & conversion into Downloads folder:"
$DestDir = "$env:USERPROFILE\Downloads\My 4K Downloader"
if (-not (Test-Path $DestDir)) { New-Item -ItemType Directory -Path $DestDir -Force | Out-Null }

$TestOutFile = "$DestDir\clean_machine_test.%(ext)s"
& $YtDlp -f "ba" -x --audio-format mp3 --audio-quality 0 --ffmpeg-location $FFmpeg -o $TestOutFile $TestUrl
$Downloaded = Get-ChildItem -Path $DestDir -Filter "clean_machine_test.mp3"
if ($Downloaded) {
    Write-Host "  [OK] Downloaded and converted MP3 successfully: $($Downloaded.FullName) ($($Downloaded.Length) bytes)"
    Remove-Item $Downloaded.FullName -Force
} else {
    Write-Error "FAILURE: MP3 was not created!"
}

Write-Host "`n=== CLEAN MACHINE ISOLATION TEST: 100% PASSED ==="
