$log = "C:\beefshteks (new)\scripts\wsl-install.log"
Start-Transcript -Path $log -Force

Write-Host "Enabling WSL features..."
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "Installing WSL..."
wsl.exe --install --no-distribution --web-download

Write-Host "Feature states:"
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux | Format-List
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform | Format-List

wsl.exe --status
Write-Host "DONE"
Stop-Transcript
