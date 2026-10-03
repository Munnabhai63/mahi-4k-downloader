$ProtocolName = "m4k"
$AppPath = "F:\cargo_target\turbograb\release\turbograb-desktop.exe"
$KeyPath = "HKCU:\Software\Classes\$ProtocolName"

New-Item -Path $KeyPath -Force | Out-Null
Set-ItemProperty -Path $KeyPath -Name "(Default)" -Value "URL:My 4K Downloader Protocol"
Set-ItemProperty -Path $KeyPath -Name "URL Protocol" -Value ""

$CmdPath = "$KeyPath\shell\open\command"
New-Item -Path $CmdPath -Force | Out-Null
Set-ItemProperty -Path $CmdPath -Name "(Default)" -Value "`"$AppPath`" `"%1`""

Write-Host "Successfully registered m4k:// protocol pointing to $AppPath"
