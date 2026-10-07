---
# Story 1.3: Remoção Completa do Teste de Reflexo Oral

## Status
Draft

## Story
Como usuário da landing, quero que não haja menções ou funcionalidades de "teste de reflexo oral" pois essa feature foi descontinuada (drag-and-drop quebrado).

## Acceptance Criteria
- [ ] Componente SentenceBuilder.astro removido do projeto
- [ ] Todas as referências a SentenceBuilder removidas de index.astro
- [ ] Todas as referências a "reflexo oral" removidas do copy
- [ ] Seção de prática interativa (#pratica) removida completamente
- [ ] Imports de SentenceBuilder removidos
- [ ] Nenhum script ou handler relacionado ao SentenceBuilder
- [ ] Build sem erros após remoção

## Tasks
- [ ] Remover arquivo SentenceBuilder.astro
- [ ] Remover import de SentenceBuilder em index.astro
- [ ] Remover seção #pratica de index.astro
- [ ] Buscar todas as referências a "reflexo oral" no projeto
- [ ] Remover referências ao SentenceBuilder em outros arquivos
- [ ] Verificar scripts/animations.ts para handlers relacionados
- [ ] Build para garantir não quebrar nada

## Product Requirements
### Business Context
- SentenceBuilder (teste de reflexo oral) foi descontinuado
- Drag-and-drop está quebrado e não funciona
- Usuário pediu remoção completa da feature
- Manter feature quebrada prejudica credibility

### User Requirements
- Nenhuma menção a "teste de reflexo oral" na landing
- Nenhuma funcionalidade de drag-and-drop
- Landing deve ser limpa e funcional
- CTA deve direcionar para o quiz/diagnóstico (não SentenceBuilder)

### Technical Requirements
- Remover arquivo SentenceBuilder.astro completamente
- Remover imports de SentenceBuilder em index.astro
- Remover seção #pratica de index.astro
- Buscar e remover todas as referências a "reflexo oral"
- Verificar animations.ts para handlers relacionados ao SentenceBuilder
- Verificar se há event listeners globais para o SentenceBuilder
- Build deve passar sem erros após remoção

### Design Requirements
- Hero CTA deve direcionar para #quiz (diagnóstico)
- Não deve haver seção de prática interativa
- Landing deve ser mais direta e focada em conversão

## Notes
- SentenceBuilder foi descontinuado (drag-and-drop quebrado)
- Usuário pediu remoção completa
- Verificar se há handlers em animations.ts relacionados

## Dev Agent Record
### Tasks Checklist
- [ ] Task 1: Remover arquivo SentenceBuilder.astro
- [ ] Task 2: Remover import em index.astro
- [ ] Task 3: Remover seção #pratica
- [ ] Task 4: Buscar referências a "reflexo oral"
- [ ] Task 5: Remover referências em outros arquivos
- [ ] Task 6: Verificar scripts
- [ ] Task 7: Build

### Debug Log
-

### Completion Notes
-

### File List
-

### Change Log
-

### Agent Model Used
-

### CodeRabbit Integration
- Pre-commit check: Enabled
- Self-healing: Light mode
- Max iterations: 2
