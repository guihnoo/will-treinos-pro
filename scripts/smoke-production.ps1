# Smoke rápido — produção freemium (sem Playwright)
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
  "/ranking",
  "/api/health",
  "/api/leaderboard?period=week"
)

$failed = 0
Write-Host "Smoke: $BaseUrl" -ForegroundColor Cyan

foreach ($path in $routes) {
  $url = "$BaseUrl$path"
  try {
    $res = Invoke-WebRequest -Uri $url -Method Get -MaximumRedirection 5 -TimeoutSec 25 -UseBasicParsing
    $ok = $res.StatusCode -lt 500
    $color = if ($ok) { "Green" } else { "Red" }
    Write-Host ("  [{0}] {1}" -f $res.StatusCode, $path) -ForegroundColor $color
    if (-not $ok) { $failed++ }
  } catch {
    Write-Host ("  [ERR] {0} — {1}" -f $path, $_.Exception.Message) -ForegroundColor Red
    $failed++
  }
}

# Dashboard deve redirecionar (não 500)
try {
  $dash = Invoke-WebRequest -Uri "$BaseUrl/dashboard" -MaximumRedirection 0 -TimeoutSec 25 -UseBasicParsing -ErrorAction SilentlyContinue
} catch {
  if ($_.Exception.Response.StatusCode -in @(301, 302, 303, 307, 308)) {
    Write-Host "  [redirect] /dashboard (auth guard OK)" -ForegroundColor Green
  } else {
    Write-Host "  [WARN] /dashboard — $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

if ($failed -gt 0) {
  Write-Host "`nFalhou: $failed rota(s)" -ForegroundColor Red
  exit 1
}
Write-Host "`nSmoke OK" -ForegroundColor Green
exit 0
