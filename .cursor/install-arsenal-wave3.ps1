# Will Treinos PRO - Arsenal Wave 3 (Issue #24 discoveries)
# powershell -ExecutionPolicy Bypass -File ".cursor\install-arsenal-wave3.ps1"

Write-Host ""
Write-Host "WILL TREINOS PRO - Wave 3 (Issue #24 Ecosystem Discoveries)" -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor DarkGray
Write-Host ""

$wave3 = @(
    # oh-my-claudecode — 12,700 stars, 32 agents, smart routing, self-learning skills
    "Yeachan-Heo/oh-my-claudecode",

    # AIDLC — AWS Labs methodology, plan->prd->exec->verify->fix pipeline
    "ijin/aidlc-cc-plugin",

    # agent-config-sync — auto-sync Claude Code <-> Cursor <-> Codex
    "liamdmcgarrigle/agent-config-sync",

    # claude-self-learning — /learn <topic> auto-generates SKILL.md files
    "ychampion/claude-self-learning",

    # Flow-Next marketplace — re-anchoring, receipt-based gating, multi-model review
    "gmickel/gmickel-claude-marketplace",

    # specs.md — Simple/FIRE/AI-DLC workflow tiers
    "fabriqaai/specs.md",

    # super-aidlc — AIDLC + Superpowers + gstack combined
    "warren830/super-aidlc",

    # Additional high-value from ecosystem research
    "hesreallyhim/awesome-claude-code",
    "obra/superpowers-marketplace",
    "hashicorp/agent-skills"
)

$ok = 0
$fail = 0

Write-Host "Installing $($wave3.Count) packages (Wave 3 - Ecosystem Discoveries)..." -ForegroundColor Cyan
Write-Host ""

foreach ($pkg in $wave3) {
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
                Write-Host "  [WARN - may not be on npx yet]" -ForegroundColor Yellow
                $fail++
            }
        }
    } catch {
        Write-Host "  [ERROR]" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor DarkGray
Write-Host "Wave 3 done. Installed: $ok / $($wave3.Count)" -ForegroundColor Green
if ($fail -gt 0) {
    Write-Host "Note: $fail packages may need manual git clone (not on npx registry yet)" -ForegroundColor Yellow
    Write-Host "Check: https://github.com/Yeachan-Heo/oh-my-claudecode for manual install" -ForegroundColor DarkGray
}

# Auto-sync to Claude Code
Write-Host ""
Write-Host "Syncing all skills to Claude Code..." -ForegroundColor Cyan
if (!(Test-Path ".claude\skills")) {
    New-Item -ItemType Directory -Path ".claude\skills" -Force | Out-Null
}
Get-ChildItem ".cursor\skills\*.md" -ErrorAction SilentlyContinue | Copy-Item -Destination ".claude\skills\" -Force
Write-Host "Sync complete." -ForegroundColor Green
Write-Host ""
