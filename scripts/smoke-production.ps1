# Smoke rapido - producao freemium (sem Playwright)
# Uso: .\scripts\smoke-production.ps1
# Opcional: $env:SMOKE_BASE_URL = "https://will-treinos-pro.vercel.app"

param(
  [string]$BaseUrl = $(if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL.TrimEnd('/') } else { "https://will-treinos-pro.vercel.app" })
)

$routes = @(
  "/",
  "/login",
  "/signup",
  "/cadastro",
  "/privacidade",
  "/termos",
  "/esqueci-senha",
  "/nova-senha",
  "/auth/callback",
  "/ranking",
  "/api/leaderboard?period=week",
  "/api/cron/orchestrator-morning"
)

$failed = 0
Write-Host "Smoke: $BaseUrl" -ForegroundColor Cyan

foreach ($path in $routes) {
  $url = "$BaseUrl$path"
  $expect401 = $path -like "/api/cron/*"
  try {
    $res = Invoke-WebRequest -Uri $url -Method Get -MaximumRedirection 5 -TimeoutSec 25 -UseBasicParsing
    if ($expect401 -and $res.StatusCode -eq 401) {
      Write-Host ("  [401] {0} (cron guard OK)" -f $path) -ForegroundColor Green
      continue
    }
    $ok = $res.StatusCode -lt 500
    $color = if ($ok) { "Green" } else { "Red" }
    Write-Host ("  [{0}] {1}" -f $res.StatusCode, $path) -ForegroundColor $color
    if (-not $ok) { $failed++ }
  } catch {
    $code = $null
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    if ($expect401 -and $code -eq 401) {
      Write-Host ("  [401] {0} (cron guard OK)" -f $path) -ForegroundColor Green
      continue
    }
    Write-Host ("  [ERR] {0} - {1}" -f $path, $_.Exception.Message) -ForegroundColor Red
    $failed++ }
}

# Dashboard deve redirecionar (nao 500)
try {
  $null = Invoke-WebRequest -Uri "$BaseUrl/dashboard" -MaximumRedirection 0 -TimeoutSec 25 -UseBasicParsing -ErrorAction Stop
  Write-Host "  [200] /dashboard (sem redirect - verificar auth)" -ForegroundColor Yellow
} catch {
  $code = $null
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  if ($code -in 301, 302, 303, 307, 308) {
    Write-Host "  [redirect] /dashboard (auth guard OK)" -ForegroundColor Green
  } else {
    Write-Host "  [WARN] /dashboard - $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

if ($failed -gt 0) {
  Write-Host ""
  Write-Host "Falhou: $failed rota(s)" -ForegroundColor Red
  exit 1
}
Write-Host ""
Write-Host "Smoke OK" -ForegroundColor Green
exit 0
