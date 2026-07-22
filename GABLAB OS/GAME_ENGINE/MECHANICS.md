# 🎮 MECHANICS — Regras do GABLAB

> *"Entender as regras é o primeiro passo para dominá-las."*
> **Versão:** 2.0 | **Temporada:** T1 FUNDAÇÃO

---

## ⚡ A FILOSOFIA DO JOGO

O GABLAB usa os mesmos princípios que fazem Clash of Clans e Brawl Stars viciantes:

- **Múltiplos eixos de progresso** — você SEMPRE está evoluindo em algo
- **Feedback curto** — recompensa a cada 5–30 min de ação
- **"Só mais uma"** — quests Hard sempre terminam preparando a próxima
- **Nunca sem nada pra fazer** — Daily Board + Side Quests + Streaks sempre ativos
- **Custo mínimo, recompensa crescente** — começar é fácil; a inércia se inverte

---

## 💰 MOEDAS DO JOGO

| Moeda | Como Ganhar | Uso |
|---|---|---|
| ⭐ XP | Qualquer ação completada | Level up, Battle Pass tiers |
| 🪙 Gold | R$ 1 real faturado = 1 Gold | Tracker de passivos, metas financeiras |
| 🔷 Focus Token | 1 por hora de deep work real | Desbloquear skills avançadas |
| 🛡️ Willpower | Regenera 10 por noite de sono ok | Custo de missões difíceis |

---

## 📊 TABELA DE XP - Utilizar matriz: 

| Ação | XP Base | Bônus |
|---|---|---|
| Daily EASY | 10 XP | +5 se antes das 10h |
| Daily MEDIUM | 25 XP | +10 se sem interrupção |
| Daily HARD | 50 XP | +20 se dentro do prazo |
| Ritual Matinal | 15 XP | +5 bônus streak |
| Boss missão completada | 20–60 XP | conforme missão |
| Streak milestone | 25–100 XP | ver STREAK_ENGINE |
| Sessão 2h+ foco | 30 XP | +10 = 1 Focus Token |
| Quest Log completada | 40–80 XP | conforme categoria |
| Daily Board completo (3/3) | +50 XP | bônus combo |
| Lucky Drop (a cada 10 quests) | variável | aleatório |

---

## 📈 TABELA DE LEVELS

| Level | XP Total | Desbloqueio |
|---|---|---|
| 1 | 0–100 XP | GABLAB base |
| 2 | 100–250 XP | 2º slot de Side Quest simultânea |
| 3 | 250–500 XP | Skill Tree expansion (+1 skill) |
| 4 | 500–900 XP | Battle Pass Premium gratuito |
| 5 | 900–1.400 XP | Boss Final T1 desbloqueado |
| 6 | 1.400–2.000 XP | Prestige — bonus T2 |

**XP Atual:** 55 → Level 1 *(35 base + 20 bônus Paulo)*

---

## 🎯 HIERARQUIA DE MISSÕES

```
🏔️  BOSS FINAL T1
 └── ⚔️  BOSS FIGHTS (batalhas grandes, semanas)
      └── 🗺️  QUESTLINES (arcos narrativos, dias-semanas)
           └── 📖  QUEST LOG (missões individuais, horas)
                └── 📋  DAILY BOARD (tarefas do dia, minutos)
                     └── ✅  ACTIONS (passos atômicos)
```

---

## 🔥 STREAKS

- Cada hábito tem um contador de dias consecutivos
- **Perder = reiniciar do zero** (exceto com Shield)
- Streak Shield: 1 disponível — salva 1 falha sem zerar
- Se não usar em 30 dias, o shield expira
- Milestones de streak dão XP bônus (ver STREAK_ENGINE)

---

## ⚡ MECÂNICAS ESPECIAIS

### Combo Multiplier
> Completar Daily Board 3/3 seguidos (3 dias): +20% XP por 48h

### "Só mais uma" Hook
> Quest Hard sempre entrega um sub-passo que prepara o próximo dia. Ex: ao concluir deploy N8N, a última sub-task é "abrir Railway e deixar painel aberto para amanhã".

### Lucky Drop
> A cada 10 quests completadas no total: role mentalmente 1-6.
> 1-2: +30 XP grátis | 3-4: Streak Shield recarga | 5: Skip 1 sub-task chata | 6: +50 XP Lendário

### Passive Progress
> - Bot Elaine ativo: +5 XP/dia passivo (contabilizar na sessão AURORA)
> - Sono antes 1h: +5 XP na manhã seguinte automaticamente

---

## 📅 CICLO DIÁRIO (Estrutura de Sessão)

| Janela | Nome | O que acontece |
|---|---|---|
| 7h–9h | 🌅 AURORA | Ritual + abrir Daily Board + planejar |
| 9h–12h | ⚔️ RAID | Quest Hard do dia (foco total) |
| 14h–18h | ⚡ GRINDING | Side Quests + clientes + mensagens |
| 18h–20h | 📚 DUNGEON | Estudo / skill building |
| 20h–22h | 🌙 HANDOFF | Registrar progresso + planejar amanhã |

---

## 🔄 RESET SEMANAL (domingo)

1. Calcular XP total da semana
2. Atualizar Battle Pass tiers
3. Revisar Streaks e registrar milestones
4. Atualizar Life Score
5. Definir 1 foco da semana seguinte

---

*Regras evoluem com o jogo. Proposta de mudança → registrar em GABLAB_ROOT*
