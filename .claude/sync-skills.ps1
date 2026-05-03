# How Claude Code discovers skills — Will Treinos PRO

# STEP 1: Run this in the terminal to mirror all skills to Claude Code
# Claude Code reads from .claude/skills/ — Cursor reads from .cursor/skills/
# We keep them in sync manually

# Run: powershell -ExecutionPolicy Bypass -File ".claude\sync-skills.ps1"

$sourceDir = ".cursor\skills"
$targetDir = ".claude\skills"

Write-Host ""
Write-Host "Syncing skills: .cursor/skills/ -> .claude/skills/" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "Created .claude/skills/ directory" -ForegroundColor Green
}

$files = Get-ChildItem "$sourceDir\*.md"
$count = 0

foreach ($file in $files) {
    Copy-Item $file.FullName -Destination "$targetDir\$($file.Name)" -Force
    Write-Host "  Synced: $($file.Name)" -ForegroundColor Green
    $count++
}

Write-Host ""
Write-Host "$count skills synced to .claude/skills/" -ForegroundColor Yellow
Write-Host "Claude Code will now discover all skills on next session." -ForegroundColor Cyan
Write-Host ""
