# Will Treinos PRO - Arsenal Wave 2
# Run after install-arsenal.ps1 completes
# powershell -ExecutionPolicy Bypass -File ".cursor\install-arsenal-wave2.ps1"

Write-Host ""
Write-Host "WILL TREINOS PRO - Wave 2 Skills Install" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor DarkGray
Write-Host ""

$wave2 = @(
    "addyosmani/agent-skills",
    "microsoft/skills",
    "smorky850612/Aurakit",
    "muratcankoylan/agent-skills-for-context-engineering",
    "cwinvestments/memstack",
    "kayba-ai/recursive-improve",
    "0xquinto/supabase-realtime-skill",
    "xueyangeng/frontend-code-audit",
    "mattnowdev/thinking-partner",
    "Nadav011/apex-skills",
    "christopherlouet/wcag-audit",
    "rokabytedev/proofrun",
    "khendzel/skills-janitor",
    "10CG/aria-plugin"
)

$ok = 0
$fail = 0

Write-Host "Installing $($wave2.Count) packages (Wave 2)..." -ForegroundColor Cyan
Write-Host ""

foreach ($pkg in $wave2) {
    Write-Host "-> $pkg" -ForegroundColor White -NoNewline
    try {
        $result = & npx add-skill $pkg 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK]" -ForegroundColor Green
            $ok++
        } else {
            $msg = ($result | Out-String).Trim()
            if ($msg -match "already|installed|success") {
                Write-Host "  [ALREADY INSTALLED]" -ForegroundColor Cyan
                $ok++
            } else {
                Write-Host "  [WARN]" -ForegroundColor Yellow
                $fail++
            }
        }
    } catch {
        Write-Host "  [ERROR]" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor DarkGray
Write-Host "Wave 2 done. Installed: $ok / $($wave2.Count)" -ForegroundColor Green
Write-Host ""

# Sync to Claude Code automatically
Write-Host "Syncing skills to Claude Code (.claude/skills/)..." -ForegroundColor Cyan
if (!(Test-Path ".claude\skills")) {
    New-Item -ItemType Directory -Path ".claude\skills" -Force | Out-Null
}
Get-ChildItem ".cursor\skills\*.md" | Copy-Item -Destination ".claude\skills\" -Force
Write-Host "Sync complete. Claude Code can now discover all skills." -ForegroundColor Green
Write-Host ""
