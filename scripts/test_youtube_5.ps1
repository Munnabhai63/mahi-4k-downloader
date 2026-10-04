$ErrorActionPreference = "Continue"

$PortableDir = "$PSScriptRoot\..\dist_release\My 4K Downloader Portable"
$YtDlp = "$PortableDir\yt-dlp.exe"
$FFmpeg = "$PortableDir\ffmpeg.exe"
$DestDir = "$env:USERPROFILE\Downloads\My 4K Downloader"

# Clean environment PATH
$env:PATH = "C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\"

$ytVideos = @(
    @{ Url = "https://www.youtube.com/watch?v=1ZyIS1QAG68"; Label = "YT-1_Salooq_Video"; Format = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best" },
    @{ Url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; Label = "YT-2_MeAtTheZoo"; Format = "best" },
    @{ Url = "https://www.youtube.com/watch?v=nLKKoMptkOk"; Label = "YT-3_Satinder_MP3"; Format = "ba"; Extra = "-x --audio-format mp3 --audio-quality 0" },
    @{ Url = "https://www.youtube.com/watch?v=kffacxfA7G4"; Label = "YT-4_JustinBieber_Baby"; Format = "bestvideo[height<=720]+bestaudio/best[height<=720]/best" },
    @{ Url = "https://www.youtube.com/watch?v=9bZkp7q19f0"; Label = "YT-5_GangnamStyle"; Format = "bestvideo[height<=720]+bestaudio/best[height<=720]/best" }
)

Write-Host "=== TESTING 5 PUBLIC YOUTUBE DOWNLOADS ON CLEAN BARE OS ==="

foreach ($v in $ytVideos) {
    Write-Host "`nTesting: $($v.Label) - $($v.Url)"
    $outTpl = "$DestDir\TEST_$($v.Label)_%(id)s.%(ext)s"
    $args = @("-f", $v.Format, "--ffmpeg-location", $FFmpeg, "--no-playlist", "-o", $outTpl, $v.Url)
    if ($v.Extra) { $args += ($v.Extra -split " ") }

    $start = Get-Date
    $res = & $YtDlp @args 2>&1
    if ($LASTEXITCODE -eq 0) {
        $files = Get-ChildItem -Path $DestDir -Filter "TEST_$($v.Label)_*"
        if ($files) {
            $f = $files[0]
            $elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
            $sizeMB = [math]::Round($f.Length / 1MB, 2)
            Write-Host "  [PASS] File: $($f.Name) | Size: $sizeMB MB ($($f.Length) bytes) | Time: ${elapsed}s"
            Remove-Item $f.FullName -Force
        } else {
            Write-Host "  [FAIL] Output file not found on disk."
        }
    } else {
        $err = ($res | Where-Object { $_ -match "ERROR" } | Select-Object -First 1)
        Write-Host "  [FAIL] Error: $err"
    }
}
