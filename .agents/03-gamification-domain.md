# ⚡ Gamification Domain Engine: Regras de XP e Tiers
**Will Treinos PRO — Autonomous Engineering Standard**

## Objetivo
Preservar a integridade esportiva, o valor percebido das conquistas e o motor assimétrico de evolução do atleta no Will Treinos PRO.

---

## 1. Fundamentos e Multiplicadores Oficiais
O vôlei premia fundamentos que exigem explosão, leitura tática e precisão técnica:

| Fundamento | Multiplicador |
|---|---|
| Ataque (Cortada, Pipe, Back) | **2.0x** |
| Levantamento | **1.8x** |
| Bloqueio | **1.6x** |
| Saque (Float, Jump, Potência) | **1.5x** |
| Defesa (Mergulho, Rolamento) | **1.4x** |
| Recepção (Passe W, Japonesa) | **1.3x** |
| Posicionamento / Leitura | **1.2x** |

### Fórmula de XP de Avaliação:
$$\text{XP} = 100 \times \left(\frac{\text{nota}}{10}\right)^2 \times 10 \times \text{multiplicador}$$
*Nota 10 em Ataque rende $1000 \times 2.0 = 2000\text{ XP}$.*

---

## 2. Tiers de Progressão de Atletas
- **Iniciante:** 0 – 499 XP
- **Bronze:** 500 – 1.499 XP
- **Prata:** 1.500 – 2.999 XP
- **Ouro:** 3.000 – 5.999 XP
- **Diamante:** 6.000 – 9.999 XP
- **Elite:** 10.000+ XP

---

## 3. Segurança do `xp_log` (Anti-Cheat & Imutabilidade)
1. **Append-Only:** A tabela `xp_log` é estritamente de inserção. Não há `UPDATE` nem `DELETE` arbitrários permitidos por alunos.
2. **Validação de Check-In:**
   - Check-in na quadra (geolocalização ou QR Code válido): **50 XP**.
   - Check-in externo / fallback: **10 XP** marcado com flag de auditoria.
3. **Idempotência:** Ações pontuais (como aniversário ou bônus semanal) devem verificar existência prévia de transação para evitar duplicações acidentais.
