# Grava CRON_SECRET no GitHub Actions (mesmo valor da Vercel).
# Pre-requisito: gh auth login
# Uso: .\scripts\configure-github-actions-cron.ps1

$ErrorActionPreference = "Stop"
$repo = "guihnoo/will-treinos-pro"

function Get-CronSecret {
  $root = Split-Path $PSScriptRoot -Parent
  $temp = Join-Path $root ".cron-secret-temp.txt"
  if (Test-Path $temp) {
    return (Get-Content $temp -Raw).Trim()
  }
  $envLocal = Join-Path $root ".env.local"
  if (Test-Path $envLocal) {
    foreach ($line in Get-Content $envLocal) {
      if ($line -match '^\s*CRON_SECRET\s*=\s*(.+)\s*$') {
        return $Matches[1].Trim().Trim('"').Trim("'")
      }
    }
  }
  return $null
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  Write-Host "Instale GitHub CLI: winget install GitHub.cli" -ForegroundColor Red
  exit 1
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Execute primeiro: gh auth login" -ForegroundColor Yellow
  Write-Host $auth
  exit 1
}

$secret = Get-CronSecret
if (-not $secret) {
  Write-Host "CRON_SECRET nao encontrado em .cron-secret-temp.txt nem .env.local" -ForegroundColor Red
  exit 1
}

$secret | gh secret set CRON_SECRET --repo $repo
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao gravar secret no GitHub." -ForegroundColor Red
  exit 1
}

Write-Host "OK: CRON_SECRET gravado em $repo" -ForegroundColor Green
