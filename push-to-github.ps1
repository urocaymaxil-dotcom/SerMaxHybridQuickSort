# ========================================================================================
# GitHub Integration Helper Script
# University of the Philippines, Cebu — College of Science — Department of Computer Science
# ========================================================================================

Clear-Host
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '   SERMAX HYBRID QUICKSORT — GITHUB CONNECTOR             ' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Check if Git is installed, install automatically if missing
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host '[*] Git was not found on your system.' -ForegroundColor Yellow
    Write-Host '[*] Installing Git automatically via winget package manager...' -ForegroundColor Yellow
    
    winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
    
    # Reload environment path in the current session
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
    
    $gitCheck = Get-Command git -ErrorAction SilentlyContinue
    if (-not $gitCheck) {
        Write-Host ''
        Write-Host '[!] Git installation has finished, but your active terminal session needs a reload.' -ForegroundColor Red
        Write-Host '[!] ACTION REQUIRED: Please close your active editor/terminal, reopen it, and run:' -ForegroundColor Yellow
        Write-Host '    .\push-to-github.ps1' -ForegroundColor Cyan
        Exit
    }
}
Write-Host '[+] Git is installed and active.' -ForegroundColor Green

# 2. Establish .gitignore to keep node_modules local
if (-not (Test-Path '.gitignore')) {
    Write-Host '[*] Generating .gitignore file to exclude local modules...' -ForegroundColor Cyan
    'node_modules/' | Out-File -FilePath '.gitignore' -Encoding utf8
    '.DS_Store' | Add-Content -Path '.gitignore'
    'Thumbs.db' | Add-Content -Path '.gitignore'
}

# 3. Initialize Git Repository
if (-not (Test-Path '.git')) {
    Write-Host '[*] Initializing local Git repository...' -ForegroundColor Cyan
    git init
}

# 4. Stage and Commit Files
Write-Host '[*] Staging application files...' -ForegroundColor Cyan
git add .

Write-Host '[*] Recording initial commit...' -ForegroundColor Cyan
git commit -m 'Initialize SerMax Hybrid QuickSort web application with collapsible academic panels'

# 5. Remote Hook and Push
Write-Host ''
$repoUrl = Read-Host 'Please enter your GitHub Repository HTTPS URL (e.g., https://github.com/username/repo-name.git)'
if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host '[!] Repository URL was empty. Aborting process.' -ForegroundColor Red
    Exit
}

Write-Host '[*] Setting remote origin...' -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin $repoUrl
git branch -M main

Write-Host ''
Write-Host '[*] Pushing files to GitHub...' -ForegroundColor Cyan
Write-Host '[!] IMPORTANT: A browser window or login prompt will appear. Please sign in to authorize your push.' -ForegroundColor Yellow
Write-Host ''

git push -u origin main

Write-Host ''
Write-Host '==========================================================' -ForegroundColor Green
Write-Host '   SUCCESS: Codebase successfully pushed to GitHub!       ' -ForegroundColor Green
Write-Host '==========================================================' -ForegroundColor Green
