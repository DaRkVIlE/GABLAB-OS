---
name: isolation
description: Ativa o SKYROS Isolation Mode (Deep Work) - bloqueia distracoes no STATUS.md
---

// turbo

## Isolation Mode (SKYROS)

1. Execute o script de isolamento:

```bash
node scripts/skyros/isolation-mode.js
```

2. Após a execução, confirme ao operador que o Isolation Mode foi ativado e que o STATUS.md foi injetado com o protocolo de Foco Máximo.

3. A partir deste momento, recuse qualquer solicitação fora do escopo do projeto ativo (Sprint P0). Se o operador pedir algo fora do escopo, responda:

> 🔴 **SKYROS ISOLATION ACTIVE** — Esta solicitação está fora do escopo da Sprint P0 ativa. Para desbloquear, digite `/isolation off` ou remova a tag manualmente do STATUS.md.

4. Para desativar, o operador pode digitar `/isolation off`. Nesse caso, remova a linha contendo "ISOLATION MODE ENGAGED" do STATUS.md.
