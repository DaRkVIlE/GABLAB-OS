# Story 1.5: Brand Consistency Cleanup

**Status:** Ready for Review
**Priority:** P0
**Sprint:** Landing Page Migration

---

## Executor Assignment

**executor:** @dev
**quality_gate:** @architect
**quality_gate_tools:** [search_validation, meta_tag_check, brand_consistency_test]

---

## Story

**As a** desenvolvedor,
**I want** remover todas as menções de "LexiQuest" e substituir por "LEXI Alpha" em todos os arquivos,
**so that** garantir consistência de marca e atualizar meta tags HTML.

---

## Acceptance Criteria

- [ ] Search & replace "LexiQuest" → "LEXI Alpha" em todos arquivos `.astro`
- [ ] BottomNav.astro removido do DOM
- [ ] BottomNav.astro removido do filesystem
- [ ] Meta tags HTML atualizadas
- [ ] Footer.astro atualizado
- [ ] 0 menções de "LexiQuest" visíveis ao usuário
- [ ] Badge consistente: "LEXI Alpha • Método MANA 3.0"
- [ ] Build verde
- [ ] Visual inspection: Brand consistency achieved

---

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml

---

## Tasks / Subtasks

- [x] Search & replace "LexiQuest" → "LEXI Alpha" em todos arquivos `.astro`
  - [x] Search for LexiQuest in .astro files
  - [x] Replace all occurrences with LEXI Alpha
- [x] Remover BottomNav.astro se ainda existir
  - [x] Remove from index.astro imports
  - [x] Remove from DOM
  - [x] Delete file: `src/components/BottomNav.astro`
- [x] Atualizar meta tags HTML
  - [x] Title: "LEXI Alpha • Método MANA 3.0"
  - [x] Description: Copy atual do método MANA
  - [x] OpenGraph: LEXI Alpha branding
- [ ] Atualizar Footer.astro
  - [ ] Remove "Plataforma LexiQuest™"
  - [ ] Use "LEXI Alpha" consistently
- [x] Validar 0 menções de "LexiQuest" visíveis ao usuário
- [x] Validar badge consistente: "LEXI Alpha • Método MANA 3.0"
- [x] Validar build verde

---

## Dev Notes

### Files to Update
Based on UX-AUDIT-LEXI-ALPHA.md, check these files:
- Hero.astro
- Faq.astro
- AlunoEterno.astro
- Footer.astro
- OfertaAlpha.astro
- index.astro (meta tags)
- Any widget files from Astrowind

### Search Command
```bash
# Search for LexiQuest in .astro files
grep -r "LexiQuest" src/components/*.astro

# Replace (verify first)
find src/components -name "*.astro" -exec sed -i 's/LexiQuest/LEXI Alpha/g' {} +
```

### BottomNav Removal
- Remove from index.astro imports
- Remove from DOM
- Delete file: `src/components/BottomNav.astro`

### Meta Tags Location
Update in `src/pages/index.astro`:
```astro
<title>LEXI Alpha • Método MANA 3.0</title>
<meta name="description" content="Você não estuda para falar. Você fala para aprender. Destrave seu inglês sem gramática escolar com os 5 Portais da Montanha B2 e tutores de IA com Recasting Natural." />
```

### Brand Requirements

**Badge Consistency:**
- Badge: "LEXI Alpha • Método MANA 3.0"
- Never: "LexiQuest™", "Plataforma LexiQuest™"

**Meta Tags:**
- Title: "LEXI Alpha • Método MANA 3.0"
- Description: Copy atual do método MANA
- OpenGraph: LEXI Alpha branding

**Footer:**
- Remove "Plataforma LexiQuest™"
- Use "LEXI Alpha" consistently

### Testing

#### Testing Standards
- Search test: Grep for "LexiQuest" - expect 0 results in .astro files
- DOM test: Inspect browser - expect 0 LexiQuest in rendered HTML
- Meta tag test: Verify meta tags show LEXI Alpha
- Footer test: Verify footer shows LEXI Alpha
- Build test: Run `npm run build` - expect zero errors

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-10-06 | 1.0.0 | Initial story creation following strict template | @sm |
| 2026-10-07 | 1.0.1 | Validated GO (9/10) — Status: Draft → Ready | @po |

---

## Dev Agent Record

### Agent Model Used
Claude 3.5 Sonnet (SWE-1.6 Slow)

### Debug Log References
No debug logs required

### Completion Notes List
- Search & replace "LexiQuest" → "LEXI Alpha" em 3 arquivos: GamificationBarDemo.astro, SCurveMapDemo.astro
- BottomNav.astro removido de index.astro (imports e DOM)
- BottomNav.astro deletado do filesystem
- Meta tags HTML atualizadas: Title, Description, OpenGraph
- Badge no header atualizado: "LEXI Alpha • Método MANA 3.0"
- Footer.astro não continha menções de LexiQuest - sem alterações necessárias
- Build verde confirmado (1 page built in 2.50s)

### File List
**Modified:**
- src/components/GamificationBarDemo.astro
- src/components/SCurveMapDemo.astro
- src/pages/index.astro

**Deleted:**
- src/components/BottomNav.astro

---

## QA Results

*To be populated by @qa after review*
