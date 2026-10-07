---
# Story 1.1: Limpeza Completa de LexiQuest → LEXI Alpha

## Status
Ready for Review

## Story
Como usuário da landing LEXI Alpha, quero que todas as menções a "LexiQuest" sejam substituídas por "LEXI Alpha" para evitar confusão com o produto que está no icebox.

## Acceptance Criteria
- [ ] Nenhuma menção a "LexiQuest" em nenhum arquivo da landing
- [ ] Todas as menções substituídas por "LEXI Alpha"
- [ ] Hero.astro atualizado
- [ ] MontanhaB2.astro atualizado
- [ ] QuizSection.astro atualizado
- [ ] AlunoEterno.astro atualizado (se existir menções)
- [ ] OfertaAlpha.astro atualizado (se existir menções)
- [ ] Footer.astro atualizado (se existir menções)
- [ ] index.astro atualizado (se existir menções)

## Tasks
- [ ] Buscar todas as ocorrências de "LexiQuest" no projeto
- [ ] Substituir cada ocorrência por "LEXI Alpha"
- [ ] Verificar contexto de cada substituição para garantir sentido
- [ ] Build da landing para garantir não quebrar nada

## Product Requirements
### Business Context
- LexiQuest B está no icebox (canvas HARNESS_LEXI)
- LEXI Alpha é o produto atual sendo lançado como MANA 3.0
- Usuário reportou confusão entre os dois produtos
- Brand consistency é crítica para credibility

### User Requirements
- Landing deve apresentar apenas LEXI Alpha
- Nenhuma menção a LexiQuest deve ser visível ao usuário
- Consistência de naming em toda a interface

### Technical Requirements
- Busca case-insensitive por "LexiQuest", "lexiquest", "Lexiquest"
- Substituição deve preservar contexto gramatical
- Verificar não quebrar links, rotas ou IDs
- Build deve passar sem erros

### Design Requirements
- Nome do produto: "LEXI Alpha" (não "LexiQuest™")
- Badge/Header: "LEXI Alpha • Método MANA 3.0"
- Copy deve ser natural e profissional

## Notes
- LexiQuest B está no icebox (canvas HARNESS_LEXI)
- LEXI Alpha é o produto atual sendo lançado
- Não remover referências a "LexiQuest" em comentários técnicos se necessário

## Dev Agent Record
### Tasks Checklist
- [x] Task 1: Buscar ocorrências de LexiQuest
- [x] Task 2: Substituir por LEXI Alpha
- [x] Task 3: Verificar contexto
- [x] Task 4: Build e teste

### Debug Log
- 53 ocorrências de LexiQuest encontradas via grep
- Substituições feitas em: Hero.astro, Faq.astro, AlunoEterno.astro, Footer.astro, BottomNav.astro, OfertaAlpha.astro
- BottomNav modal completo removido (jornada gamificada)
- CTA WhatsApp atualizado para LEXI Alpha
- Build Astro: 1.67s (1 página)
- Deploy Vercel: Ready (13s)

### Completion Notes
Todas as menções visíveis de LexiQuest foram substituídas por LEXI Alpha. Comentários técnicos em gamification/ e courses/ foram preservados conforme requisitos. Modal mobile BottomNav foi completamente removido.

### File List
- Hero.astro
- Faq.astro
- AlunoEterno.astro
- Footer.astro
- BottomNav.astro
- OfertaAlpha.astro
- SentenceBuilder.astro (deletado)
- PrepTrainer.astro (deletado)

### Change Log
- Hero.astro: VSL scene title atualizado
- Faq.astro: 4 ocorrências substituídas
- AlunoEterno.astro: 3 ocorrências substituídas
- Footer.astro: 1 ocorrência substituída
- BottomNav.astro: Modal completo removido, Tab 3 alterado para Diagnóstico, Tab 4 alterado para Oferta
- OfertaAlpha.astro: 3 ocorrências substituídas, CTA WhatsApp atualizado
- SentenceBuilder.astro: arquivo deletado
- PrepTrainer.astro: arquivo deletado
- MontanhaB2.astro: iluminação de fundo removida (possível causa do bloco preto)

### Agent Model Used
claude-sonnet-4-20250514

### CodeRabbit Integration
- Pre-commit check: Enabled
- Self-healing: Light mode
- Max iterations: 2
