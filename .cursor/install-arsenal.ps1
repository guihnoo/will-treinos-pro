# Will Treinos PRO - Arsenal Install Script
# Run: powershell -ExecutionPolicy Bypass -File ".cursor\install-arsenal.ps1"

Write-Host ""
Write-Host "WILL TREINOS PRO - Installing Skills Arsenal" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor DarkGray
Write-Host ""

# Simple flat list - no hashtables, no emojis (avoids PS parser issues)
$skills = @(
    "vercel-labs/agent-skills",
    "antfu/skills",
    "anthropics/skills",
    "shadcn-ui/ui",
    "openkash/ai-agent-spec-skill",
    "GodsBoy/lossless-code",
    "beratcelik1/wstack",
    "gitstq/awesome-ai-agent-skills",
    "petekp/circuitry",
    "bluriesophos/cursorskills",
    "Manavarya09/design-extract",
    "jgerton/visual-identity",
    "wayne930242/Reflexive-Claude-Code",
    "inthearto/shiplog",
    "memstate-ai/memstate-skill",
    "demon0998/claude-code-health-check",
    "akaszubski/autonomous-dev",
    "Ericyoung-183/alpha-insights",
    "saubade32/product-management-skill",
    "metyatech/skill-manager",
    "zdenekmach/deep-research",
    "dimayip/research-agent",
    "trailofbits/skills",
    "sane-apps/SaneProcess",
    "non4me/session-wizard"
)

$ok = 0
$fail = 0
$total = $skills.Count

Write-Host "Installing $total skill packages..." -ForegroundColor Cyan
Write-Host ""

foreach ($pkg in $skills) {
    Write-Host "-> $pkg" -ForegroundColor White -NoNewline

    try {
        $result = & npx add-skill $pkg 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            Write-Host "  [OK]" -ForegroundColor Green
            $ok++
        } else {
            $msg = ($result | Out-String).Trim()
            if ($msg -match "already|installed|success") {
                Write-Host "  [ALREADY INSTALLED]" -ForegroundColor Cyan
                $ok++
            } else {
                Write-Host "  [WARN] $msg" -ForegroundColor Yellow
                $fail++
            }
        }
    } catch {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor DarkGray
Write-Host "Installed: $ok / $total" -ForegroundColor Green

if ($fail -gt 0) {
    Write-Host "With issues: $fail (may not exist yet or need different install)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DONE. Paste the prompt from .cursor/ACTIVATION_PROMPT.md in Cursor chat." -ForegroundColor Cyan
Write-Host ""
