# Verifica rotas publicas de auth em producao.
# Uso: .\scripts\verify-login-routes.ps1

$Base = "https://will-treinos-pro.vercel.app"
$checks = @("/login", "/esqueci-senha", "/nova-senha", "/auth/callback", "/cadastro")

Write-Host "Auth routes: $Base" -ForegroundColor Cyan
$ok = 0
foreach ($path in $checks) {
  try {
    $r = Invoke-WebRequest -Uri "$Base$path" -UseBasicParsing -TimeoutSec 20
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
      Write-Host "  OK $($r.StatusCode) $path" -ForegroundColor Green
      $ok++
    } else {
      Write-Host "  FAIL $($r.StatusCode) $path" -ForegroundColor Red
    }
  } catch {
    Write-Host "  ERR $path $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host ""
Write-Host "Rotas publicas: $ok / $($checks.Count)" -ForegroundColor $(if ($ok -eq $checks.Count) { "Green" } else { "Yellow" })
