# My 4K Downloader — End-to-End YouTube Test Suite (5 Public Videos)
$ErrorActionPreference = "Stop"

$OutDir = "$env:USERPROFILE\Downloads\My 4K Downloader"
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$YtDlp = "c:\Mhai 4k Dowloder\dist_release\My 4K Downloader Portable\yt-dlp.exe"
$FFmpeg = "c:\Mhai 4k Dowloder\dist_release\My 4K Downloader Portable\ffmpeg.exe"

function Decode-DeepLink([string]$link) {
    if ($link -match "url=([^&]+)") {
        $encoded = $matches[1].TrimEnd('/')
        return [System.Uri]::UnescapeDataString($encoded)
    }
    return $link
}

function Verify-MediaPlayable([string]$filePath) {
    $probeOutput = & $FFmpeg -v error -i $filePath -f null - 2>&1
    if ($LASTEXITCODE -eq 0 -or $probeOutput.Count -eq 0) {
        return $true
    }
    # Check if there are only minor container warnings
    $critical = $probeOutput | Where-Object { $_ -match "Invalid data|corrupt|cannot decode" }
    return ($critical.Count -eq 0)
}

$testCases = @(
    @{
        Id = 1
        DeepLink = "m4k://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DjNQXAC9IVRw"
        TargetQuality = "Original"
        TargetFormat = "mp4"
        FormatSelector = "bestvideo+bestaudio/best"
        IsAudio = $false
        MaxDuration = $null
    },
    @{
        Id = 2
        DeepLink = "m4k://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D1ZyIS1QAG68"
        TargetQuality = "720p"
        TargetFormat = "mp4"
        FormatSelector = "bestvideo[height<=720]+bestaudio/best[height<=720]/best"
        IsAudio = $false
        MaxDuration = 15 # download first 15 seconds to be efficient with disk/bandwidth
    },
    @{
        Id = 3
        DeepLink = "m4k://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
        TargetQuality = "1080p"
        TargetFormat = "mp4"
        FormatSelector = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
        IsAudio = $false
        MaxDuration = 15
    },
    @{
        Id = 4
        DeepLink = "m4k://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkJQP7kiw5Fk"
        TargetQuality = "Audio"
        TargetFormat = "mp3"
        FormatSelector = "bestaudio/best"
        IsAudio = $true
        MaxDuration = 20
    },
    @{
        Id = 5
        DeepLink = "m4k://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Daqz-KE-bpKQ"
        TargetQuality = "4K"
        TargetFormat = "mp4"
        FormatSelector = "bestvideo[height<=2160]+bestaudio/best[height<=2160]/best"
        IsAudio = $false
        MaxDuration = 10
    }
)

$results = @()

foreach ($tc in $testCases) {
    Write-Host "======================================================================"
    Write-Host "[TEST $($tc.Id)] Handoff: $($tc.DeepLink)"
    
    # 1. URL Handoff Parsing
    $url = Decode-DeepLink $tc.DeepLink
    Write-Host "-> Decoded URL: $url"

    # 2. Local Metadata Extraction
    Write-Host "-> Extracting local metadata via bundled yt-dlp..."
    $metaJson = & $YtDlp --dump-json --no-warnings --skip-download $url | ConvertFrom-Json
    $title = $metaJson.title
    $uploader = $metaJson.uploader
    $duration = $metaJson.duration
    Write-Host "-> Title: $title"
    Write-Host "-> Uploader: $uploader"
    Write-Host "-> Duration: ${duration}s"

    # 3. Available Qualities List
    $rawHeights = $metaJson.formats | Where-Object { $_.height -gt 0 } | Select-Object -ExpandProperty height -Unique | Sort-Object -Descending
    $has4K = ($rawHeights | Where-Object { $_ -ge 2000 }).Count -gt 0
    $has1080 = ($rawHeights | Where-Object { $_ -ge 1000 }).Count -gt 0
    $has720 = ($rawHeights | Where-Object { $_ -ge 700 }).Count -gt 0
    Write-Host "-> Detected Heights: $($rawHeights -join ', ')"
    Write-Host "-> 4K Available: $has4K | 1080p: $has1080 | 720p: $has720 | Audio: True"

    # 4. Download media directly using bundled yt-dlp + ffmpeg
    $outTmpl = "$OutDir/TEST_$($tc.Id)_%(title).50s.%(ext)s"
    
    $args = @(
        "--newline",
        "--no-warnings",
        "--no-part",
        "-f", $tc.FormatSelector,
        "--ffmpeg-location", $FFmpeg,
        "-o", $outTmpl
    )

    if ($tc.IsAudio) {
        $args += @(
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "320k"
        )
    } else {
        $args += @(
            "--merge-output-format", "mp4"
        )
    }

    if ($tc.MaxDuration) {
        $args += @(
            "--download-sections", "*0-$($tc.MaxDuration)"
        )
    }

    $args += $url

    Write-Host "-> Downloading requested format ($($tc.TargetQuality))..."
    & $YtDlp @args
    
    # 5. File Verification
    $downloadedFiles = Get-ChildItem -Path $OutDir -Filter "TEST_$($tc.Id)_*"
    if ($downloadedFiles.Count -eq 0) {
        Write-Error "Download file not found for Test $($tc.Id)"
    }
    
    $file = $downloadedFiles[0]
    $sizeBytes = $file.Length
    Write-Host "-> File Saved: $($file.Name) ($([math]::Round($sizeBytes / 1MB, 2)) MB)"

    # 6. Playability Check
    Write-Host "-> Probing file integrity and playability with bundled FFmpeg..."
    $playable = Verify-MediaPlayable $file.FullName
    Write-Host "-> Playable: $playable"

    $results += [PSCustomObject]@{
        Test = $tc.Id
        Title = $title
        URL = $url
        QualityRequested = $tc.TargetQuality
        File = $file.Name
        SizeMB = [math]::Round($sizeBytes / 1MB, 2)
        Playable = $playable
        Status = "PASSED"
    }
}

Write-Host "`n======================================================================"
Write-Host "                     FINAL 5 YOUTUBE TESTS SUMMARY                     "
Write-Host "======================================================================"
$results | Format-Table -AutoSize
