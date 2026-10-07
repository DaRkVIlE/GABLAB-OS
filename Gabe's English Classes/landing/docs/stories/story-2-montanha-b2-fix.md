---
# Story 1.2: Corrigir Renderização da Montanha B2

## Status
Draft

## Story
Como usuário da landing, quero ver a seção Montanha B2 renderizada corretamente sem blocos pretos gigantes para entender os 5 Portais do método.

## Acceptance Criteria
- [ ] MontanhaB2.astro renderiza corretamente (sem bloco preto)
- [ ] Todos os 5 Portais visíveis e estilizados
- [ ] Ícones SVG renderizando corretamente
- [ ] Cores e bordas aplicadas conforme design
- [ ] Responsivo em mobile, tablet e desktop
- [ ] Animações GSAP funcionando (se aplicável)

## Tasks
- [ ] Investigar causa do bloco preto (background? overflow? z-index?)
- [ ] Verificar se há imagens ou assets faltando
- [ ] Corrigir problema de renderização
- [ ] Testar em diferentes breakpoints
- [ ] Verificar animações GSAP
- [ ] Build e deploy para validação

## Product Requirements
### Business Context
- Montanha B2 é uma seção crítica da landing (explica os 5 Portais)
- Usuário reporta "bloco preto enorme no meio da tela"
- Essa seção é crucial para entender o método e converter
- Seção não visível = perda de conversão

### User Requirements
- Seção Montanha B2 deve renderizar completamente
- Todos os 5 Portais devem ser visíveis e estilizados
- Ícones e cores devem aparecer corretamente
- Seção deve ser responsiva em todos os dispositivos

### Technical Requirements
- Investigar: background-color, overflow, z-index, missing assets
- Verificar se há imagens externas que não carregam
- Verificar animações GSAP para MontanhaB2
- Garantir que não há conflito de CSS com outras seções
- Testar em mobile (<576px), tablet (576-768px), desktop (>768px)

### Design Requirements
- Seguir MANA Design System (cores purple, lime-green accent)
- 5 Portais com cores progressivas (emerald, teal, cyan, amber, purple)
- Ícones SVG renderizando corretamente
- Cards com bordas e shadows do design system

## Notes
- Usuário reporta "bloco preto enorme no meio da tela"
- Pode ser problema de background, overflow, ou assets faltando
- Verificar animações.ts para ver se há animação específica para MontanhaB2

## Dev Agent Record
### Tasks Checklist
- [ ] Task 1: Investigar causa do bloco preto
- [ ] Task 2: Verificar assets
- [ ] Task 3: Corrigir renderização
- [ ] Task 4: Testar responsividade
- [ ] Task 5: Verificar animações
- [ ] Task 6: Build e deploy

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
