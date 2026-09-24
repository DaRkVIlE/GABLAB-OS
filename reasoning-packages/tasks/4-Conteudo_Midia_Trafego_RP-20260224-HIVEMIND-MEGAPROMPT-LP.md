# 🧠 HIVEMIND MEGA-PROMPT — Landing Page Experia Solutions

## Mentes Convocadas

| Mente                | Contribuição para este Prompt                                                         |
| :------------------- | :------------------------------------------------------------------------------------ |
| **Seth Godin**       | A "Purple Cow" — cada seção deve ser impossível de ignorar                            |
| **Rick Rubin**       | Minimalismo intencional — o que NÃO está na página é tão importante quanto o que está |
| **Russell Brunson**  | Estrutura de funil — cada scroll é um passo mais perto da conversão                   |
| **Alex Hormozi**     | Grand Slam Offer — o valor percebido deve ESMAGAR o preço                             |
| **Simon Sinek**      | Golden Circle — WHY antes de WHAT                                                     |
| **Jordan Belfort**   | Straight Line — cada elemento direciona para UMA ação                                 |
| **UX Design Expert** | Micro-interações, hierarquia visual, acessibilidade                                   |

---

## O Prompt (Cole INTEIRO no Framer AI)

```
You are designing a premium, award-winning landing page for "Experia Solutions" — a company that sells Autonomous Digital Governance powered by AI for healthcare clinics in Brazil. This page must convert cold visitors into warm leads.

═══════════════════════════════════════
BRAND IDENTITY — NON-NEGOTIABLE
═══════════════════════════════════════

Color System:
- Background: #0a0a0f (pure midnight black, NOT dark blue, NOT dark gray)
- Primary: #00e5ff (Neon Cyan — CTAs, highlights, active states, link underlines)
- Secondary: #7c3aed (Electric Purple — gradient endpoints, hover states)
- Accent: #ff0080 (Neon Magenta — badges, urgency indicators, sparingly)
- Success: #00c853 (Neon Green — check marks, positive indicators)
- Text Primary: #fafafa (near-white, never pure white)
- Text Secondary: #a0a0b0 (muted gray-lavender for body copy)
- Card backgrounds: rgba(15, 15, 25, 0.6) with backdrop-filter: blur(20px) and border: 1px solid rgba(0, 229, 255, 0.1)

Typography:
- Headings (h1-h3): "Orbitron" from Google Fonts — weight 700-900, uppercase for h1
- Sub-headings (h4-h6): "Outfit" weight 600
- Body: "Inter" weight 400-500
- Monospace numbers/stats: "Share Tech Mono"
- Base size: 16px, scale ratio 1.25

Visual Effects (CRITICAL for premium feel):
- All cards: glassmorphism (bg rgba with backdrop-blur-20px, border 1px solid white/5%)
- CTA buttons: neon cyan glow (box-shadow: 0 0 30px rgba(0,229,255,0.4), 0 0 60px rgba(0,229,255,0.2))
- CTA hover: glow intensifies to 0.7 opacity + translateY(-2px) + scale(1.02)
- Highlighted text: CSS gradient from #00e5ff to #7c3aed applied via background-clip: text
- Background: subtle circuit-board dot pattern (radial-gradient dots at 40px intervals, cyan at 10% opacity)
- Section dividers: horizontal line with gradient from transparent → cyan → transparent

═══════════════════════════════════════
PAGE STRUCTURE — SECTION BY SECTION
═══════════════════════════════════════

—— SECTION 1: NAVIGATION BAR ——
Fixed top, glassmorphism background, 80px height.
Left: "EXPERIA" in Orbitron, neon cyan color, letter-spacing 4px.
Right: "Soluções" | "Como Funciona" | "Resultados" | "Contato" (Inter, 14px, white/70%, hover: cyan)
Far right: CTA button "Falar com Jarvis" (small, outlined, cyan border, hover: filled)

—— SECTION 2: HERO (Full viewport height, min 100vh) ——
Background: The circuit-board dot pattern, plus a large radial gradient glow (cyan at 5% opacity) centered top-right, 800px diameter, heavily blurred.
A subtle horizontal scan-line animation (thin cyan line, 1px, sweeps top to bottom once on load, 2s duration).

Content (centered, max-width 900px):
- Eyebrow tag: Small pill badge, glassmorphism, cyan border, text "Inteligência Artificial para Saúde", uppercase, 12px, tracking-widest, Outfit font
- H1 (main headline): "Governança Digital" on line 1, "Autônoma" on line 2 — the word "Autônoma" should be in gradient text (cyan→purple). Orbitron, 56px desktop / 36px mobile, weight 800, line-height 1.1
- Subheadline (below h1, 24px Inter, text-secondary color, max-width 700px): "Transformamos clínicas operando no caos em ecossistemas de alta eficiência. Redução de até 60% nos custos. Zero furos de agenda. Inteligência Artificial que opera, decide e evolui."
- CTA Button: "Automatizar Minha Clínica →" (Orbitron, 16px, weight 700, padding 20px 40px, background gradient cyan→purple, neon glow, rounded-xl). Below the button, small text in secondary color: "Demo gratuita de 15 minutos • Sem compromisso"
- Social proof strip below CTA: horizontal row of 3 items separated by vertical cyan lines: "🏥 Clínicas no ABC" | "🤖 Agentes Ativos 24/7" | "📈 60% Redução de Custos"

Animations: 
- H1 slides up from 40px below with opacity 0→1, 0.8s, spring easing
- Subheadline: same, 0.15s delay
- CTA: same, 0.3s delay
- Social proof: fade in, 0.5s delay
- The scan-line plays once on page load

—— SECTION 3: "O PROBLEMA" (Pain Section) ——
Background: slightly lighter than hero (#0d0d14), no pattern.
Full-width, padding 120px vertical.

Left side (60% width): 
- Section tag (small, magenta badge): "A REALIDADE"
- H2: "Enquanto Você Dorme," on line 1, "Seu Negócio Perde Pacientes" on line 2. "Perde Pacientes" in magenta/red gradient.
- Body text (Inter, 18px, secondary color): "Ligações sem resposta. Follow-ups esquecidos. Agendas com buracos. Leads que viram concorrência. A cada dia sem automação inteligente, receita escapa."

Right side (40% width):
- A glassmorphism card with 4 "pain stats":
  • "73%" — "das ligações para clínicas não são atendidas" (number in Share Tech Mono, 48px, magenta glow)
  • "R$7.500" — "perdidos por mês em leads não respondidos"
  • "2-4h" — "tempo médio de resposta a um novo lead"
  • "47%" — "dos pacientes não retornam após 1ª consulta"
  Each stat: number large + bold, description small below. Separated by thin border lines.

Animation: Stats count up from 0 when scrolled into view

—— SECTION 4: "A SOLUÇÃO" (The Big Reveal) ——
Background: back to #0a0a0f with circuit pattern.
Padding 120px vertical.

Center-aligned:
- Section tag (cyan badge): "A SOLUÇÃO"
- H2: "Conheça o" on line 1, "KAIROS" on line 2 — "KAIROS" in Orbitron, 72px, full gradient text (cyan→purple→magenta), with text-shadow glow
- Subtitle: "O ecossistema de IA que OPERA seu negócio. Não é chatbot. Não é automação. É Governança Digital Autônoma." (Inter, 20px)

Below: 3 feature cards in a row (responsive: stack on mobile), each a glassmorphism card:

Card 1 — "JARVIS":
- Icon: Brain/Bot icon, 48px, cyan color
- Title: "Jarvis — Seu Assistente 24/7" (Outfit, 20px, white)
- Description: "Secretária IA no WhatsApp. Agenda, responde, faz triagem, manda relatório no seu Telegram toda manhã. Nunca dorme." (Inter, 15px, secondary)
- Bottom tag: "WhatsApp + Telegram" (small, cyan)
- Hover: card border glows cyan, slight translateY(-4px)

Card 2 — "CRM AUTÔNOMO":
- Icon: Database/Pipeline icon, 48px, purple color
- Title: "CRM Inteligente"
- Description: "Gestão automática de leads. Scoring. Follow-up em 48h. Reativação em 30 dias. Pipeline visual. Nenhum lead esquecido, nunca."
- Bottom tag: "Gestão Completa"
- Hover: card border glows purple

Card 3 — "ANÁLISE PREDITIVA":
- Icon: Chart/Analytics icon, 48px, green color
- Title: "Inteligência Analítica"
- Description: "Dashboards de receita e performance. 'Terças têm 40% mais cancelamentos.' O sistema identifica padrões que humanos não veem."
- Bottom tag: "Insights em Tempo Real"
- Hover: card border glows green

—— SECTION 5: "COMO FUNCIONA" (3-step process) ——
Background: #0d0d14
Padding 100px vertical.

Center-aligned:
- H2: "3 Passos para a" line 1, "Autonomia Digital" line 2 — "Autonomia Digital" in gradient text

Horizontal timeline (3 nodes connected by a cyan gradient line):

Step 1: "DIAGNÓSTICO" 
- Number "01" in Orbitron, 48px, cyan
- "Check-up digital gratuito da sua clínica. Analisamos tempo de resposta, processos e gaps."
- Icon: Magnifying glass

Step 2: "IMPLEMENTAÇÃO"
- Number "02" in Orbitron, 48px, purple
- "Em 7 dias, seu KAIROS está operando. 3 agentes configurados com a linguagem da sua clínica."
- Icon: Rocket

Step 3: "EVOLUÇÃO"
- Number "03" in Orbitron, 48px, magenta
- "Todo mês o sistema fica mais inteligente. Reunião mensal de evolução. Novos agentes conforme necessidade."
- Icon: Trending up

—— SECTION 6: "O JARVIS EM AÇÃO" (Demo Preview) ——
Background: #0a0a0f
Full-width, padding 120px vertical.

Left side (55%):
- H2: "Imagine Acordar" line 1, "E Ler Isso:" line 2 — "Isso:" in cyan
- A mock phone/telegram message card (glassmorphism, rounded-2xl, max-width 400px):
  ```
  🤖 Jarvis — 07:00
  ─────────────────
  Bom dia! Relatório de ontem:
  
  📊 12 atendimentos
  🆕 3 leads novos
  📅 Agenda de hoje: 8 consultas
  
  ⚠️ Maria (lead quente — harmonização)
  não respondeu há 48h. Já enviei
  incentivo com 10% de desconto.
  
  🕐 2 horários vagos: 14h e 16h.
  Oferecer para leads em standby?
  
  [Sim, oferecer] [Ver detalhes]
  ```
  The card should look like a real Telegram message with subtle animations (typing indicator dots before revealing text).

Right side (45%):
- Pull quote in large text (Outfit, 28px, italic): "Nenhum chatbot do mundo faz isso."
- Below: "Esse é o momento em que 93% dos donos de clínica decidem: 'Eu preciso disso.'" (Inter, 16px, secondary)
- CTA: "Ver Demo ao Vivo" button (cyan glow)

—— SECTION 7: "INVESTIMENTO" (Pricing — Grand Slam) ——
Background: #0d0d14
Padding 120px vertical.

- H2: "Investimento que se" line 1, "Paga no Primeiro Mês" line 2 — gradient text on "Primeiro Mês"

3 pricing cards side by side (middle one highlighted — "MAIS POPULAR"):

Card 1 — ESSENCIAL: 
- Price: "R$2.997/mês"
- "3 agentes + Jarvis + Follow-up"
- 6-8 bullet features
- CTA: "Começar Agora" (outlined button)

Card 2 — AVANÇADO (highlighted, larger, cyan border glow, "★ MAIS POPULAR" badge):
- Price: "R$4.997/mês" 
- "6 agentes + CRM + Conteúdo IG"
- 8-10 bullet features
- CTA: "Escolher Avançado" (filled gradient button, stronger glow)

Card 3 — ELITE:
- Price: "R$9.997/mês"
- "10+ agentes + KAIROS Full"
- 10+ bullet features
- CTA: "Falar com Gabriel" (outlined)

Below pricing: "Garantia de 30 dias. Não funcionou, devolvo 100%. Sem contrato mínimo." (centered, small, underlined)

—— SECTION 8: LEAD CAPTURE FORM ——
Background: #0a0a0f with strong circuit pattern
Padding 120px vertical.

Centered glassmorphism card, max-width 500px, neon cyan border glow (always on, not just hover):
- H3: "Descubra o Nível de" line 1, "Maturidade Digital da Sua Clínica" line 2 — gradient text
- Subtitle: "Preencha abaixo. Resposta em até 4 horas." (Inter, 14px)
- Fields: Nome Completo, WhatsApp (with mask), E-mail
- Each input: dark background, cyan border on focus, smooth transition
- Submit button: "Analisar Maturidade Digital →" (full gradient, strong glow, Orbitron font, uppercase)
- Below button: "🔒 Seus dados estão seguros. Não compartilhamos com terceiros."

—— SECTION 9: FOOTER ——
Dark, minimal. 
Left: "EXPERIA" logo text (Orbitron, cyan)
Center: "Governança Digital Autônoma | ABC Paulista, SP"
Right: Social icons (Instagram, WhatsApp, Email) with cyan hover
Bottom: "© 2026 Experia Solutions. Powered by KAIROS." (small, muted)

═══════════════════════════════════════
GLOBAL ANIMATION RULES
═══════════════════════════════════════
- Every section: fade-in + slide-up (30px) on scroll, 0.6s duration, spring easing
- Stats/numbers: count-up animation triggered on viewport entry
- CTA buttons: continuous subtle pulse-glow animation (opacity oscillates 0.3→0.5 on the shadow)
- Cards: hover lifts (translateY -4px) + border glow intensifies
- Hero scan-line: plays once on load
- Parallax: hero background moves at 0.5x scroll speed
- ALL transitions: cubic-bezier(0.16, 1, 0.3, 1) — smooth, premium feel

═══════════════════════════════════════
RESPONSIVE RULES
═══════════════════════════════════════
- Mobile: Single column, cards stack vertically
- H1: 36px on mobile, 56px on desktop
- Navigation: hamburger menu on mobile
- Pricing cards: horizontal scroll or stack
- Form: full-width on mobile with larger touch targets
- Minimum touch target: 48px

═══════════════════════════════════════
CRITICAL QUALITY RULES
═══════════════════════════════════════
- NO stock photos. Use icons only (Lucide or Phosphor icon set)
- NO generic gradients (blue→purple template look). Only use the exact hex codes above.
- NO rounded-full buttons (too playful). Use rounded-xl (12-16px radius)
- NO light mode. This page is DARK ONLY.
- NO serif fonts anywhere.
- Every section must have clear visual hierarchy: one focal point per viewport
- White space is sacred — generous padding between sections (100-120px)
- The overall feeling should be: "This company is from the future, and they brought their technology to help you."
```

---

## Instruções Pós-Geração no Framer

1. **Verifique as fontes**: Se Orbitron não carregou, adicione via Google Fonts no painel de projeto.
2. **Ajuste cores manualmente**: Clique em qualquer elemento → painel de Design → substitua cores pelo hex exato.
3. **Teste mobile**: Use o preview do Framer em 375px width para verificar responsividade.
4. **Publique**: Framer → Publish → seu site sobe em `seu-projeto.framer.app`.

---

*Prompt gerado pelo KAIROS Hivemind: Godin + Rubin + Brunson + Hormozi + Sinek + Belfort + UX Expert*
*Baseado em: LIVRO-DO-OURO-EXPERIA.md (1160 linhas) + Quiz Cyberpunk Identity (336 linhas CSS)*
*Data: 24/02/2026*
