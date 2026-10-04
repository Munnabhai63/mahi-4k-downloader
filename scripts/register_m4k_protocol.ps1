param(
    [string]$AppPath,
    [switch]$Unregister
)

$ProtocolName = "m4k"
$KeyPath = "HKCU:\Software\Classes\$ProtocolName"

if ($Unregister) {
    if (Test-Path $KeyPath) {
        Remove-Item -Path $KeyPath -Recurse -Force
        Write-Host "Successfully unregistered ${ProtocolName}:// protocol from HKCU."
    } else {
        Write-Host "Protocol ${ProtocolName}:// was not registered."
    }
    return
}

if (-not $AppPath) {
    $InstalledPath = "$env:LOCALAPPDATA\Programs\My 4K Downloader\My 4K Downloader.exe"
    $LocalRelease = "$PSScriptRoot\..\dist_portable\My 4K Downloader.exe"
    if (Test-Path $InstalledPath) {
        $AppPath = $InstalledPath
    } elseif (Test-Path $LocalRelease) {
        $AppPath = (Resolve-Path $LocalRelease).Path
    } else {
        $AppPath = "My 4K Downloader.exe"
    }
}

New-Item -Path $KeyPath -Force | Out-Null
Set-ItemProperty -Path $KeyPath -Name "(Default)" -Value "URL:My 4K Downloader Protocol"
Set-ItemProperty -Path $KeyPath -Name "URL Protocol" -Value ""

$CmdPath = "$KeyPath\shell\open\command"
New-Item -Path $CmdPath -Force | Out-Null
Set-ItemProperty -Path $CmdPath -Name "(Default)" -Value "`"$AppPath`" `"%1`""

Write-Host "Successfully registered ${ProtocolName}:// protocol pointing to $AppPath"
