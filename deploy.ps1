# Run this from J:\ATS\Assign\scaler-funnel to prepare and push to GitHub.
# Replace YOUR_USERNAME and REPO_NAME before running the push commands.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Adding all files..."
git init 2>$null; git add .
git status

Write-Host ""
Write-Host "Commit (run this if you have git and want to commit):"
Write-Host "  git commit -m `"Job Readiness Mapper - ready for Netlify`""
Write-Host "  git branch -M main"
Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
Write-Host "  git push -u origin main"
Write-Host ""
Write-Host "Then in Netlify: Add new site -> Import from Git -> pick this repo -> Deploy."
Write-Host "See DEPLOY.md for full steps."
