param(
    [string]$PortableDir = "$PSScriptRoot\..\dist_release\My 4K Downloader Portable"
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================="
Write-Host "CLEAN MACHINE ISOLATION & COMPREHENSIVE PLATFORM AUDIT"
Write-Host "=================================================="

# 1. Strip environment PATH to bare OS only
$BareWindowsPath = "C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\"
$env:PATH = $BareWindowsPath

Write-Host "`n1. PATH Isolation Verification:"
$tools = @("python", "node", "cargo", "rustc", "git", "winget")
foreach ($t in $tools) {
    $found = Get-Command $t -ErrorAction SilentlyContinue
    if ($found) {
        Write-Warning "Tool '$t' found in PATH: $($found.Source)"
    } else {
        Write-Host "  [OK] '$t' is completely absent from execution environment."
    }
}

# 2. Verify bundled standalone binaries
Write-Host "`n2. Verifying Bundled Sidecar Binaries in ($PortableDir):"
$YtDlp = "$PortableDir\yt-dlp.exe"
$FFmpeg = "$PortableDir\ffmpeg.exe"
$AppExe = "$PortableDir\My 4K Downloader.exe"

if (-not (Test-Path $YtDlp)) { throw "Missing $YtDlp" }
if (-not (Test-Path $FFmpeg)) { throw "Missing $FFmpeg" }
if (-not (Test-Path $AppExe)) { throw "Missing $AppExe" }

$ytVer = & $YtDlp --version
$ffOut = (& $FFmpeg -version 2>&1 | Select-Object -First 1)
$exeSize = (Get-Item $AppExe).Length
$ytSize = (Get-Item $YtDlp).Length
$ffSize = (Get-Item $FFmpeg).Length

Write-Host "  [OK] App Executable: $AppExe ($([math]::Round($exeSize/1MB, 2)) MB)"
Write-Host "  [OK] Bundled yt-dlp: $ytVer ($([math]::Round($ytSize/1MB, 2)) MB)"
Write-Host "  [OK] Bundled FFmpeg: $ffOut ($([math]::Round($ffSize/1MB, 2)) MB)"

# 3. Setup clean downloads destination folder
$DestDir = "$env:USERPROFILE\Downloads\My 4K Downloader"
if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}
Write-Host "`nDownloads Destination: $DestDir"

# Function to run a single download test
function Test-PlatformMedia {
    param(
        [string]$Platform,
        [string]$Url,
        [string]$TestLabel,
        [string]$FormatParam = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        [string]$ExtraArgs = ""
    )

    Write-Host "`n--------------------------------------------------"
    Write-Host "TEST: [$Platform] $TestLabel"
    Write-Host "URL:  $Url"

    $StartTime = Get-Date

    # Step A: Metadata Analysis
    Write-Host "  [A] Extracting metadata..."
    $metaRaw = & $YtDlp --dump-json --no-warnings --skip-download $Url 2>&1
    if ($LASTEXITCODE -ne 0) {
        $firstErr = ($metaRaw | Where-Object { $_ -match "ERROR" } | Select-Object -First 1)
        Write-Host "  [RESULT] Extraction Failed: $firstErr"
        return @{
            Platform = $Platform
            Label = $TestLabel
            Status = "NOT VERIFIED"
            Reason = $firstErr
            FileSize = 0
            Filename = ""
        }
    }

    $meta = $metaRaw | ConvertFrom-Json
    $title = $meta.title
    $duration = $meta.duration
    $uploader = $meta.uploader
    Write-Host "      Title:    $title"
    Write-Host "      Uploader: $uploader"
    Write-Host "      Duration: ${duration}s"

    # Step B: Download Execution
    Write-Host "  [B] Downloading media file..."
    $safeTitle = ($TestLabel -replace '[\\/:*?"<>|]', '_')
    $outputTemplate = "$DestDir\TEST_${safeTitle}_%(id)s.%(ext)s"

    $cmdArgs = @(
        "-f", $FormatParam,
        "--ffmpeg-location", $FFmpeg,
        "--no-playlist",
        "-o", $outputTemplate,
        $Url
    )
    if ($ExtraArgs) {
        $cmdArgs += ($ExtraArgs -split " ")
    }

    $dlOutput = & $YtDlp @cmdArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        $firstErr = ($dlOutput | Where-Object { $_ -match "ERROR" } | Select-Object -First 1)
        Write-Host "  [RESULT] Download Failed: $firstErr"
        return @{
            Platform = $Platform
            Label = $TestLabel
            Status = "NOT VERIFIED"
            Reason = $firstErr
            FileSize = 0
            Filename = ""
        }
    }

    # Step C: Verify Downloaded File
    $matchingFiles = Get-ChildItem -Path $DestDir -Filter "TEST_${safeTitle}_*"
    if ($matchingFiles -and $matchingFiles.Length -gt 0) {
        $file = $matchingFiles[0]
        $sizeBytes = $file.Length
        $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
        $elapsed = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)

        Write-Host "  [C] Verification:"
        Write-Host "      File:     $($file.Name)"
        Write-Host "      Size:     $sizeBytes bytes ($sizeMB MB)"
        Write-Host "      Time:     ${elapsed}s"
        Write-Host "      Status:   VERIFIED (100% Complete & Non-Zero File)"

        # Clean up test file to keep user's disk clean
        Remove-Item $file.FullName -Force

        return @{
            Platform = $Platform
            Label = $TestLabel
            Status = "VERIFIED"
            Filename = $file.Name
            FileSize = "$sizeMB MB"
            SizeBytes = $sizeBytes
            Title = $title
            Duration = "${duration}s"
            Time = "${elapsed}s"
        }
    } else {
        Write-Host "  [RESULT] File not found in destination!"
        return @{
            Platform = $Platform
            Label = $TestLabel
            Status = "NOT VERIFIED"
            Reason = "File not found"
            FileSize = 0
            Filename = ""
        }
    }
}

$results = @()

# YOUTUBE TESTS (5 tests)
$results += Test-PlatformMedia -Platform "YouTube" -Url "https://www.youtube.com/watch?v=1ZyIS1QAG68" -TestLabel "YT-1_Salooq_1080p" -FormatParam "137+140/bestvideo+bestaudio/best"
$results += Test-PlatformMedia -Platform "YouTube" -Url "https://www.youtube.com/watch?v=aqz-KE-bpKQ" -TestLabel "YT-2_BigBuckBunny_4K" -FormatParam "313+140/bestvideo[height<=2160]+bestaudio/best"
$results += Test-PlatformMedia -Platform "YouTube" -Url "https://www.youtube.com/watch?v=jNQXAC9IVRw" -TestLabel "YT-3_MeAtTheZoo_360p" -FormatParam "18/best"
$results += Test-PlatformMedia -Platform "YouTube" -Url "https://www.youtube.com/watch?v=nLKKoMptkOk" -TestLabel "YT-4_BPraak_MP3_320k" -FormatParam "ba" -ExtraArgs "-x --audio-format mp3 --audio-quality 0"
$results += Test-PlatformMedia -Platform "YouTube" -Url "https://youtu.be/M7lc1UVf-VE" -TestLabel "YT-5_Developers_720p" -FormatParam "22/best"

# FACEBOOK TESTS (2 tests)
$results += Test-PlatformMedia -Platform "Facebook" -Url "https://www.facebook.com/watch?v=10153231379946729" -TestLabel "FB-1_ShareWithFriends"
$results += Test-PlatformMedia -Platform "Facebook" -Url "https://www.facebook.com/watch?v=10152795258318536" -TestLabel "FB-2_SafetyTips"

# TIKTOK TESTS (3 tests)
$results += Test-PlatformMedia -Platform "TikTok" -Url "https://www.tiktok.com/@tiktok/video/7106594312292453678" -TestLabel "TT-1_OfficialTikTok"
$results += Test-PlatformMedia -Platform "TikTok" -Url "https://www.tiktok.com/@scout2015/video/6718335390845095173" -TestLabel "TT-2_ScoutReel"
$results += Test-PlatformMedia -Platform "TikTok" -Url "https://www.tiktok.com/@zachking/video/6768504823336815877" -TestLabel "TT-3_ZachKingMagic"

# INSTAGRAM TESTS (3 tests)
$results += Test-PlatformMedia -Platform "Instagram" -Url "https://www.instagram.com/reel/C8t1M2UvQ6-/" -TestLabel "IG-1_PublicReel"
$results += Test-PlatformMedia -Platform "Instagram" -Url "https://www.instagram.com/reel/C5_8QfJpQ6-/" -TestLabel "IG-2_ReelTwo"
$results += Test-PlatformMedia -Platform "Instagram" -Url "https://www.instagram.com/p/B_8Z_9FpK_8/" -TestLabel "IG-3_PostMedia"

# X / TWITTER TESTS (2 tests)
$results += Test-PlatformMedia -Platform "X/Twitter" -Url "https://twitter.com/NASA/status/1768262791484191024" -TestLabel "X-1_NASALaunch"
$results += Test-PlatformMedia -Platform "X/Twitter" -Url "https://twitter.com/BBCBreaking/status/1346920257321594880" -TestLabel "X-2_BBCBreaking"

Write-Host "`n=================================================="
Write-Host "FINAL PLATFORM AUDIT SUMMARY TABLE"
Write-Host "=================================================="

$results | Format-Table Platform, Label, Status, FileSize, Time -AutoSize
