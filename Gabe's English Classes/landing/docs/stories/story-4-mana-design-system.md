---
# Story 1.4: Aplicação Completa do MANA Design System

## Status
Draft

## Story
Como usuário da landing LEXI Alpha, quero uma interface profissional e visualmente consistente que siga o MANA Design System (inspirado em Sentry) para transmitir credibilidade e qualidade.

## Acceptance Criteria
- [ ] MANA Design System aplicado consistentemente em toda a landing
- [ ] Cores do design system usadas em todos os componentes
- [ ] Tipografia Inter aplicada em todo o projeto
- [ ] Espaçamento e layout seguindo padrões do design system
- [ ] Botões, cards e inputs estilizados conforme MANA
- [ ] Nenhum elemento fora do padrão
- [ ] Acessibilidade WCAG AA mínima
- [ ] Responsivo em todos os breakpoints

## Tasks
- [ ] Revisar MANA-design-system.md completo
- [ ] Aplicar variáveis CSS em global.css
- [ ] Atualizar Hero.astro para seguir design system
- [ ] Atualizar MontanhaB2.astro para seguir design system
- [ ] Atualizar QuizSection.astro para seguir design system
- [ ] Atualizar OfertaAlpha.astro para seguir design system
- [ ] Atualizar Faq.astro para seguir design system
- [ ] Atualizar Footer.astro para seguir design system
- [ ] Atualizar BottomNav.astro para seguir design system
- [ ] Verificar contraste e acessibilidade
- [ ] Testar responsividade em mobile, tablet, desktop
- [ ] Build e validação visual

## Product Requirements
### Business Context
- Landing atual está "fora do padrão" e não transmite professionalidade
- MANA Design System foi criado (inspirado em Sentry)
- Aplicação consistente do design system é crítica para credibility
- Usuário reportou "MUITA COISA ainda esta fora do padrao"

### User Requirements
- Interface profissional e visualmente consistente
- Cores, tipografia e espaçamento seguindo padrões
- Botões, cards e inputs estilizados corretamente
- Acessibilidade mínima WCAG AA
- Responsivo em todos os dispositivos

### Technical Requirements
- Aplicar variáveis CSS do MANA Design System em global.css
- Atualizar todos os componentes para usar variáveis CSS
- Tipografia Inter como primary UI font
- Cores do design system: #6a5fc1 (primary), #1f1633 (primary-dark), #c2ef4e (accent)
- Buttons: inset shadows, uppercase com letter-spacing
- Cards: bordas, shadows, backdrop-filter para glass effects
- Spacing system: base unit 8px
- Border radius scale: 6px, 8px, 12px, 13px
- Verificar contraste WCAG AA (mínimo 4.5:1 para texto)
- Testar responsividade em mobile, tablet, desktop

### Design Requirements
- Dark mode como padrão (background #1f1633)
- Inter font para headings e body
- Rubik como fallback se Inter não carregar
- Monaco para código/monospace
- Buttons primary: background #79628c, inset shadow
- Buttons secondary: glass effect com backdrop-filter
- Cards: semi-transparent com shadow rgba(0,0,0,0.1)
- Links: white → hover #6a5fc1
- Lime-green accent (#c2ef4e) usado com moderação (1x por seção)
- Frosted glass effects: blur(18px) saturate(180%)

## Notes
- Design system baseado em Sentry (cores purple, lime-green accent)
- Fonte Inter como primary UI
- Dark mode como padrão
- Variáveis CSS já parcialmente aplicadas em global.css
- Seguir padrões de buttons, cards, inputs do design system

## Dev Agent Record
### Tasks Checklist
- [ ] Task 1: Revisar MANA-design-system.md
- [ ] Task 2: Aplicar variáveis CSS
- [ ] Task 3: Atualizar Hero.astro
- [ ] Task 4: Atualizar MontanhaB2.astro
- [ ] Task 5: Atualizar QuizSection.astro
- [ ] Task 6: Atualizar OfertaAlpha.astro
- [ ] Task 7: Atualizar Faq.astro
- [ ] Task 8: Atualizar Footer.astro
- [ ] Task 9: Atualizar BottomNav.astro
- [ ] Task 10: Verificar acessibilidade
- [ ] Task 11: Testar responsividade
- [ ] Task 12: Build e validação

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
