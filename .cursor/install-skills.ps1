#!/usr/bin/env pwsh
# ============================================================
# WILL TREINOS PRO — INSTALADOR DE SKILLS
# Instala todas as skills selecionadas para Cursor + Claude Code
# Execute: pwsh .cursor/install-skills.ps1
# ============================================================

Write-Host ""
Write-Host "🏐 WILL TREINOS PRO — Instalando Arsenal de Skills" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host ""

$skills = @(
    # TIER 1 — Essenciais (alta prioridade)
    @{ name = "vercel-labs/agent-skills";          tier = "ESSENCIAL"; desc = "Next.js 15 + Vercel oficial — 25+ skills de performance e arquitetura" },
    @{ name = "antfu/skills";                      tier = "ESSENCIAL"; desc = "Skills de TypeScript de elite por Anthony Fu (criador do Vite/Vitest)" },
    @{ name = "anthropics/skills";                 tier = "ESSENCIAL"; desc = "Skills oficiais da Anthropic — padrão de referência SKILL.md" },
    @{ name = "openkash/ai-agent-spec-skill";      tier = "ESSENCIAL"; desc = "Especifica features ANTES de codar — alinha com propor antes de executar" },
    @{ name = "shadcn-ui/ui";                      tier = "ESSENCIAL"; desc = "Expert em shadcn/ui — usa a DESIGN_REFERENCE como um pro" },
    @{ name = "GodsBoy/lossless-code";             tier = "ESSENCIAL"; desc = "DAG context management — zero perda de contexto entre sessões" },

    # TIER 2 — Design & Visual
    @{ name = "Manavarya09/design-extract";        tier = "DESIGN";    desc = "Extrai sistema de design de qualquer app premium em tokens Tailwind" },
    @{ name = "jgerton/visual-identity";           tier = "DESIGN";    desc = "Diagnóstico estratégico de identidade visual" },

    # TIER 3 — Arquitetura & Contexto
    @{ name = "wayne930242/Reflexive-Claude-Code"; tier = "ARQUIT";    desc = "Workflow reflexivo — agente aprende com suas próprias ações" },
    @{ name = "inthearto/shiplog";                 tier = "ARQUIT";    desc = "Captura e busca decisões do codebase com contexto permanente" },
    @{ name = "akaszubski/autonomous-dev";         tier = "ARQUIT";    desc = "Setup de desenvolvimento autônomo Claude Code 2.0 — produção" },

    # TIER 4 — Business Intelligence & Research
    @{ name = "Ericyoung-183/alpha-insights";      tier = "BUSINESS";  desc = "Frameworks de analista de elite — Sprint 9.0 Oráculo do Admin" },
    @{ name = "zdenekmach/deep-research";          tier = "RESEARCH";  desc = "25+ fontes paralelas antes de propor qualquer solução técnica" },
    @{ name = "dimayip/research-agent";            tier = "RESEARCH";  desc = "Pipeline multi-agente de 3 camadas com citações" }
)

$success = 0
$failed = 0

foreach ($skill in $skills) {
    $tier = $skill.tier
    $name = $skill.name
    $desc = $skill.desc

    $color = switch ($tier) {
        "ESSENCIAL" { "Cyan" }
        "DESIGN"    { "Magenta" }
        "ARQUIT"    { "Blue" }
        "BUSINESS"  { "Green" }
        "RESEARCH"  { "Yellow" }
        default     { "White" }
    }

    Write-Host "[$tier] " -ForegroundColor $color -NoNewline
    Write-Host "$name" -ForegroundColor White -NoNewline
    Write-Host " — $desc" -ForegroundColor DarkGray

    try {
        $result = npx add-skill $name 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Instalado" -ForegroundColor Green
            $success++
        } else {
            Write-Host "  ⚠️  Aviso: $result" -ForegroundColor Yellow
            $failed++
        }
    } catch {
        Write-Host "  ❌ Erro: $_" -ForegroundColor Red
        $failed++
    }

    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📊 Resultado:" -ForegroundColor White
Write-Host "  ✅ Instalados com sucesso: $success" -ForegroundColor Green
Write-Host "  ❌ Com erro: $failed" -ForegroundColor Red
Write-Host ""
Write-Host "🏐 Skills prontas! Abra o Cursor e cole o prompt de ativação." -ForegroundColor Yellow
Write-Host "   Arquivo: .cursor/ACTIVATION_PROMPT.md" -ForegroundColor DarkGray
Write-Host ""
