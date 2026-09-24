╔══════════════════════════════════════════════════════════════════════════╗
║ REASONING PACKAGE                                                        ║
║ ID: RP-20260228-CAÇA-PADRONIZADA-MVP                                     ║
║ Versão: 1.0-EXECUÇÃO                                                     ║
║ Executor: Squad Completa (CMO + CRO + Sales Lead + DevOps)               ║
║ Objetivo: Estrutura de caça automatizada + infra R$0 para delivery       ║
╚══════════════════════════════════════════════════════════════════════════╝

---

## O PROBLEMA (DIAGNÓSTICO REAL)

Gabriel tem 3 blockers simultâneos:
1. **Sem infra:** Internet via tethering, sem VPS, sem domínio
2. **Sem caixa:** Precisa de R$300 mínimo para respirar
3. **Sem escala:** Cada cliente exige horas de customização

A solução precisa resolver os 3 de uma vez.

---

## PARTE 1 — A INFRAESTRUTURA GRÁTIS (R$0,00)

### Oracle Cloud Free Tier — VPS PERMANENTEMENTE GRATUITA

A Oracle oferece, sem prazo de expiração, sem cobrança:
- **4 vCPUs ARM** (Ampere A1)
- **24 GB RAM**
- **200 GB de disco**
- **IP público fixo**
- **Tráfego gratuito** (10TB/mês)

> Isso é mais poder de fogo do que uma VPS de R$200/mês na DigitalOcean.
> E é **grátis para sempre**, não é trial.

**Requisito:** Cartão de crédito para verificação (NÃO cobra).
Se a irmã tiver um cartão, mesmo sem limite, serve para verificar.

### O que roda na VPS gratuita:
```
1. Bot WhatsApp (Baileys/Evolution API) → 24/7 respondendo clientes
2. N8N (automações) → workflows de atendimento
3. Bot Telegram (backup) → canal alternativo
4. Landing page simples → hospedada ali mesmo
```

### Como criar (10 minutos):
```
1. Acessar: https://cloud.oracle.com/
2. "Start for Free" → criar conta com email
3. Região: Brazil East (São Paulo) ← latência mínima
4. Shape: VM.Standard.A1.Flex (ARM)
5. OCPU: 4 | RAM: 24GB
6. Sistema: Ubuntu 22.04 Minimal (aarch64)
7. Baixar chave SSH → acessar via terminal
8. Instalar: Node.js + PM2 + N8N + Evolution API
```

**Alternativas caso Oracle não funcione:**
- Render.com (free tier)
- Railway.app ($5/mês grátis)
- Vercel (para páginas estáticas)
- Cloudflare Workers (100K requests/dia grátis)

---

## PARTE 2 — O PRODUTO PADRONIZADO (MVP LOCALIZADO)

### "Pacote Presença Digital" — R$297/mês

Um produto ÚNICO que serve para QUALQUER comércio local:

| O que você entrega          | Como produz                 | Tempo              |
| --------------------------- | --------------------------- | ------------------ |
| 15 posts/mês para Instagram | KAIROS gera textos + Canva  | 30 min/mês         |
| Bot WhatsApp 24/7           | Evolution API na VPS Oracle | 1x setup de 20 min |
| Cardápio/Catálogo digital   | HTML simples na VPS         | 1x setup de 15 min |
| Relatório mensal (PDF)      | KAIROS gera automaticamente | 5 min/mês          |

**Custo real para Gabriel:** R$0 (tudo roda em infra gratuita)
**Margem:** 100%

### Por que R$297 e não R$497?

```
→ R$297 é psicologicamente "menos de R$10/dia"
→ Qualquer pet shop, padaria ou bazar paga isso
→ É MENOS que 1 funcionário meio-período
→ A barreira de entrada é mínima
→ Com 1 cliente já respira (R$297)
→ Com 2 clientes já tem caixa (R$594)
→ Com 4 clientes é um salário (R$1.188)
```

### A frase que vende:

> "Seu negócio vai ter presença digital completa por menos de R$10/dia.
> Eu cuido de tudo. Você só aprova os posts e atende os clientes que chegam."

---

## PARTE 3 — A ESTRUTURA DE CAÇA (AUTOMATIZADA)

### O Funil de 3 Passos (repete para cada comércio):

```
PASSO 1 — AMOSTRA (5 min)
├── Tira foto da fachada + produto principal
├── KAIROS gera 3 posts prontos para Instagram
├── Manda por WhatsApp: "Fiz isso de graça pra você"
└── Efeito: o dono vê o produto FUNCIONANDO

PASSO 2 — DEMO (10 min presencial)
├── Mostra os posts no celular
├── Mostra o bot respondendo: "manda uma msg pro número X"
├── Mostra o relatório exemplo
└── Efeito: o dono vê que é REAL e IMEDIATO

PASSO 3 — FECHAMENTO (5 min)
├── "R$297/mês. Eu cuido de tudo."
├── "Primeiro mês: se não gostar, devolvto."
├── Pix na hora ou boleto
└── Efeito: decisão rápida, sem atrito
```

### Script de Setup por Cliente (template padronizado):

Quando o cliente fecha, você faz o setup em 20 minutos:

```
1. Cria perfil no bot: nome, serviços, preços, horários
2. Configura respostas automáticas (template já pronto)
3. Gera 15 posts do mês inteiro (KAIROS faz em 10 min)
4. Agenda no Later/Buffer (free tier) ou entrega pasta
5. Ativa o bot no WhatsApp do cliente
6. Pronto. Próximo cliente.
```

### O Template de Posts (KAIROS gera automático):

```json
{
  "negocio": "[NOME]",
  "tipo": "pet_shop | padaria | bazar | açougue | oficina",
  "posts": [
    { "dia": "seg", "tipo": "produto_destaque", "cta": "Peça pelo WhatsApp!" },
    { "dia": "qua", "tipo": "bastidores", "cta": "Venha conhecer!" },
    { "dia": "sex", "tipo": "promo_semana", "cta": "Só até sábado!" },
    { "dia": "sab", "tipo": "depoimento_cliente", "cta": "Confie em quem já usa!" }
  ]
}
```

KAIROS recebe o JSON, gera 15 textos + sugestões de imagem = pronto.

---

## PARTE 4 — COMO AGREGAR VALOR PARA JUSTIFICAR R$297

O comerciante NÃO paga por "posts" ou "bot". Ele paga pelo RESULTADO.

### A conta que convence:

```
"Quantos clientes novos por mês você quer?"

Se o pet shop cobra R$50 de banho e tosa:
→ 6 clientes novos/mês = R$300
→ Seu investimento: R$297
→ Resultado: R$300 - R$297 = se pagou no primeiro mês!

Mas na real, 6 clientes novos viram recorrentes.
→ Mês 2: R$600 (12 clientes novos + os 6 antigos voltando)
→ Mês 3: R$900+
→ ROI do mês 3: +200%

"Você está pagando R$10/dia para ter uma equipe de marketing
que funciona 24 horas, 7 dias por semana, sem férias."
```

### Os 5 valores que o comerciante SENTE:

1. **Tempo:** "Você para de perder tempo respondendo WhatsApp"
2. **Profissionalismo:** "Seu Instagram fica bonito como os das franquias"
3. **Alcance:** "Clientes que passam na porta veem você online"
4. **Atendimento:** "Ninguém fica sem resposta, nem de madrugada"
5. **Relatório:** "Você sabe quantas pessoas mandaram mensagem esse mês"

---

## PARTE 5 — ORDEM DE EXECUÇÃO

```
HOJE (sexta):
□ Criar conta Oracle Cloud Free Tier
□ Subir VPS Ubuntu + instalar Node.js + PM2
□ Instalar Evolution API (bot WhatsApp)
□ Configurar 1 bot demo genérico ("Pet Shop Modelo")

AMANHÃ (sábado — comércios abertos):
□ Sair com o celular carregado
□ Tirar foto de 5 comércios
□ KAIROS gera 3 posts para cada um (em casa, 30 min total)
□ Mandar por WhatsApp como amostra grátis
□ Voltar presencialmente para os que responderem

EM 48H:
□ Ter pelo menos 1 cliente pagante (R$297)
□ Setup do bot no WhatsApp do cliente (20 min)
□ Gerar os 15 posts do mês 1
□ RESPIRAR 💨

EM 1 SEMANA:
□ 3-4 clientes → R$891-1.188/mês recorrente
□ Pipeline rodando: amostra → demo → fechamento
□ Cada cliente novo = 20 min de setup + 30 min/mês
```

---

## CONTINGÊNCIA — SEM CARTÃO PARA ORACLE

Se não tiver cartão para verificar na Oracle:

1. **Render.com** → não pede cartão, free tier funcional
2. **Rodar o bot local** → seu PC fica ligado com PM2, tethering ativo.
   Não é ideal mas funciona como prova de conceito para fechar o primeiro cliente.
   Com o R$297 do primeiro cliente, compra VPS básica de R$20/mês.
3. **Vercel** → hospeda a landing page grátis, sem cartão

---

*"O primeiro R$297 não é sobre lucro.
É sobre provar que o sistema funciona.
Depois disso, é escala."*

**ID:** RP-20260228-CAÇA-PADRONIZADA-MVP
**Versão:** 1.0
**Próximo passo:** Criar conta Oracle Cloud + subir a VPS AGORA
