# /xp — Calculadora do Motor de XP

## Uso
`/xp [fundamento] [nota] [contexto?]`

## Exemplos
```
/xp ataque 9
/xp saque 7 jump_serve
/xp recepcao 10 japonesa
```

## O que faz
Calcula o XP gerado por uma avaliação de fundamento técnico usando o Motor de XP assimétrico do Will Treinos PRO.

## Fórmula
```
XP = 100 × (nota/10)² × 10 × multiplicador_fundamento
```

## Tabela de Referência

| Fundamento | Multiplicador | Nota 10 | Nota 7 | Nota 5 |
|---|---|---|---|---|
| Ataque | 2.0x | 2000 XP | 980 XP | 500 XP |
| Levantamento | 1.8x | 1800 XP | 882 XP | 450 XP |
| Bloqueio | 1.6x | 1600 XP | 784 XP | 400 XP |
| Saque | 1.5x | 1500 XP | 735 XP | 375 XP |
| Defesa | 1.4x | 1400 XP | 686 XP | 350 XP |
| Recepção | 1.3x | 1300 XP | 637 XP | 325 XP |
| Posicionamento | 1.2x | 1200 XP | 588 XP | 300 XP |

## Bônus por Contexto
- `jump_serve` no saque: +10% XP
- `pipe` ou `back_row` no ataque: +15% XP
- `jump_set` no levantamento: +8% XP
- `mergulho` na defesa: +5% XP

## Resposta do Comando

```
🏐 MOTOR DE XP — Cálculo

Fundamento: [fundamento] ([subtipo])
Nota:       [nota]/10
Dificuldade: [alta/muito alta/média]

XP Base:        [valor]
Multiplicador:  [Nx]
XP Total:       [valor] XP

Contexto mensal:
- Meta Bronze (500 XP):   [necessário para atingir?]
- Meta Ouro (3000 XP):    [X avaliações como esta]
- Meta Diamante (6000 XP): [X avaliações como esta]
```
