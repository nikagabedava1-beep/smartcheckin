# SmartCheckin.ge Deployment Script for Windows
# Run this from PowerShell on your local machine

param(
    [string]$ServerIP = "",
    [string]$ServerUser = "root"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  SmartCheckin.ge Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if server IP is provided
if (-not $ServerIP) {
    $ServerIP = Read-Host "Enter your server IP address"
}

$ProjectDir = Split-Path -Parent $PSScriptRoot
$DeployDir = "/var/www/smartcheckin"
$ArchiveName = "smartcheckin-deploy.tar.gz"

Write-Host "`nProject directory: $ProjectDir" -ForegroundColor Yellow

# Files and folders to exclude from deployment
$ExcludeList = @(
    "node_modules",
    ".next",
    ".git",
    "deploy",
    ".env.local",
    "*.log"
)

# Step 1: Create deployment archive
Write-Host "`n[1/4] Creating deployment archive..." -ForegroundColor Green

# Change to project directory
Push-Location $ProjectDir

# Create exclude file for tar
$ExcludeFile = "$env:TEMP\tar-exclude.txt"
$ExcludeList | Out-File -FilePath $ExcludeFile -Encoding ascii

# Check if tar is available (Windows 10+ has it built-in)
if (Get-Command tar -ErrorAction SilentlyContinue) {
    $excludeArgs = ($ExcludeList | ForEach-Object { "--exclude=$_" }) -join " "
    $tarCmd = "tar -czvf `"$env:TEMP\$ArchiveName`" --exclude=node_modules --exclude=.next --exclude=.git --exclude=deploy --exclude=.env.local ."
    Invoke-Expression $tarCmd
} else {
    Write-Host "tar command not found. Please install Git Bash or use WSL." -ForegroundColor Red
    exit 1
}

Pop-Location

Write-Host "Archive created: $env:TEMP\$ArchiveName" -ForegroundColor Green

# Step 2: Upload to server
Write-Host "`n[2/4] Uploading to server..." -ForegroundColor Green
Write-Host "You may be prompted for the server password." -ForegroundColor Yellow

# Use scp to upload
scp "$env:TEMP\$ArchiveName" "${ServerUser}@${ServerIP}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload archive. Check your server credentials." -ForegroundColor Red
    exit 1
}

# Step 3: Extract and install on server
Write-Host "`n[3/4] Extracting and installing on server..." -ForegroundColor Green

$RemoteCommands = @"
cd /var/www
rm -rf smartcheckin_backup
[ -d smartcheckin ] && mv smartcheckin smartcheckin_backup
mkdir -p smartcheckin
cd smartcheckin
tar -xzvf /tmp/$ArchiveName
rm /tmp/$ArchiveName

echo 'Installing dependencies...'
npm install --production=false

echo 'Running database migrations...'
npx prisma generate
npx prisma migrate deploy

echo 'Building application...'
npm run build

echo 'Restarting application...'
pm2 delete smartcheckin 2>/dev/null || true
pm2 start npm --name smartcheckin -- start
pm2 save
pm2 startup

echo 'Deployment complete!'
"@

ssh "${ServerUser}@${ServerIP}" $RemoteCommands

# Step 4: Cleanup
Write-Host "`n[4/4] Cleaning up..." -ForegroundColor Green
Remove-Item "$env:TEMP\$ArchiveName" -ErrorAction SilentlyContinue

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "`nYour site should be live at: http://$ServerIP" -ForegroundColor Cyan
Write-Host "After DNS propagation: https://smartcheckin.ge" -ForegroundColor Cyan
