# Abre os paineis para setup manual (Supabase Auth + GitHub secret).
# Uso: .\scripts\open-auth-setup-pages.ps1

$supabaseAuth = "https://supabase.com/dashboard/project/armrortldtqxmgvvcbko/auth/url-configuration"
$githubSecrets = "https://github.com/guihnoo/will-treinos-pro/settings/secrets/actions"

Write-Host "`n=== Will Treinos PRO — Setup manual ===" -ForegroundColor Cyan
Write-Host "`nSupabase Site URL: https://will-treinos-pro.vercel.app"
Write-Host "Redirect URLs (6 linhas no painel):"
@(
  "https://will-treinos-pro.vercel.app/auth/callback"
  "https://will-treinos-pro.vercel.app/nova-senha"
  "https://willtreinospro.com.br/auth/callback"
  "https://willtreinospro.com.br/nova-senha"
  "http://localhost:3000/auth/callback"
  "http://localhost:3000/nova-senha"
) | ForEach-Object { Write-Host "  - $_" }

Start-Process $supabaseAuth
Start-Sleep -Seconds 1
Start-Process $githubSecrets
Write-Host "`nPainéis abertos.`n" -ForegroundColor Green
