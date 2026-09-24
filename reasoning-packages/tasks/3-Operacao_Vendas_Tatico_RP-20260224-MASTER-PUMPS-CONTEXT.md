# RP-20260224-MASTER-PUMPS-CONTEXT — KAIROS Intelligence Report

## Target: Master Pumps (Indústria ABC Paulista)
## Estratégia: Trojan Horse (Land and Expand)
## Uso: Contexto base para Agentes de Venda e Operação (Experia)

---

## 🎯 1. Visão Geral do Alvo

Com base na estrutura organizacional (Matriz + Filial), a Master Pumps é uma indústria de porte médio-grande (80-150 funcionários) com processos altamente estruturados, mas possivelmente engessados.

**Decisores Finais (Aprovam Orçamento):**
- Diretor Presidente
- Diretor Administrativo (Felipe Mitsui / Wellington J. Ferreira)
- Suelen Simonatto (Influenciadora / Elaboradora de Processos)

**O Problema Visível:** 
Organogramas densos (3-4 níveis hierárquicos num único departamento, ex: PCP e Faturamento) indicam muita burocracia, reportes manuais e comunicação fragmentada entre Matriz e Filial.

**O Fit KAIROS:**
Ideal para o **Plano Elite/Enterprise**. O KAIROS atua exatamente colapsando essa hierarquia de comunicação através de relatórios multi-agente em tempo real.

---

## 🪓 2. A Estratégia Trojan Horse (Pontos de Entrada)

A estratégia *Trojan Horse* consiste em entrar resolvendo UMA dor específica (geralmente de gestores de nível médio/operacional) de forma tão absurda que o KAIROS se torna indispensável, expandindo naturalmente para a diretoria.

### Cavalo de Troia 1: O "Gargalo do Faturamento" (Prioridade Alta)
- **Alvo:** Líder de Faturamento / Assistentes
- **A Dor:** Muitas notas, conciliação manual, relatórios lentos de inadimplência.
- **A Solução KAIROS:** Um agente especializado que lê planilhas/sistemas via integração simples e envia um resumo no WhatsApp do Líder às 17:00 todos os dias: *"Temos 14 notas pendentes, 3 clientes em atraso. Quer que eu dispare o lembrete de cobrança?"*
- **A Expansão:** O Líder mostra isso pro Supervisor Administrativo, que leva pro Diretor.

### Cavalo de Troia 2: O "Caos do RH e Onboarding" (Via Contato Direto)
- **Alvo:** Coord. de RH (Contato do cunhado) / Analista de RH
- **A Dor:** Gestão de dezenas de aprendizes, auxiliares de limpeza e chãos de fábrica. Muitas dúvidas repetitivas, onboarding manual demorado.
- **A Solução KAIROS:** Um "Agente de RH 24/7" no WhatsApp. O funcionário manda mensagem: *"Como funciona o feriado pontilhado?"* ou *"Meu holerite não chegou"*. O KAIROS responde na hora baseado na política da empresa.
- **A Expansão:** O RH economiza 20h/semana e reporta ganho de eficiência brutal à Diretoria Administrativa.

### Cavalo de Troia 3: "O Abismo Matriz-Filial" (Logística)
- **Alvo:** Coord. de Logística (Matriz) e (Filial)
- **A Dor:** Comunicação descruzada entre estoques. Onde está a mercadoria?
- **A Solução KAIROS:** Um grupo de WhatsApp com as duas pontas + o Agente KAIROS. O KAIROS condensa os relatórios de entrada/saída de ambas as filiais num único "Morning Briefing".

---

## 💬 3. O Pitch de Aproximação (Draft para o Contato via Cunhado)

Como você tem o canal via cunhado direto no RH, a aproximação **não deve ser uma venda de software**, mas uma "consultoria de IA" ou uma "ferramenta beta exclusiva".

**Script Base Whatsapp (Ajustar com o tom do Gabriel):**
> *"Opa [Nome do contato], o [Nome do Cunhado] comentou comigo sobre a estrutura de vocês aí na Master Pumps. Cara, eu tô operando um ecossistema de Inteligência Artificial autônoma (KAIROS) que acabamos de lançar para o setor industrial. Pelos organogramas que vi, vocês têm uma complexidade de RH e Faturamento que a IA resolve brincando hoje em dia.*
> 
> *Eu queria rodar um teste cego aí com vocês, de graça. Pego 1 processo chato do seu RH (tipo dúvidas de funcionários ou onboardings), coloco um agente KAIROS rodando no WhatsApp pra resolver isso 24/7, e você me diz se alivia o seu time. O que acha de um papo rápido amanhã pra eu te mostrar a tela dele funcionando?"*

---

## 🧠 4. Configuração Inicial do Agente Experia para MP

Se o teste avançar, este é o perfil do primeiro agente que criaremos no seu sistema para a Master Pumps:

```yaml
agent:
  name: KAIROS RH (Master Pumps)
  id: mp-rh-bot
  title: Assistente Autônomo de Recursos Humanos

persona:
  role: Suporte primário aos 100+ funcionários (Operacional, Administrativo, Matriz e Filial).
  identity: Sou o assistente de RH da Master Pumps. Respondo rápido, com tom respeitoso, industrial e objetivo. Conheço as normas ditadas pelo Wellington e Felipe.
  core_principles:
    - Nunca expor dados financeiros
    - Se a dúvida for complexa (ex: rescisão), escalar imediatamente para a Coordenadora de RH
    - Falar a linguagem acessível para o chão de fábrica (Auxiliares/Aprendizes)
```

## Próximos Passos Recomendados:
1. Validar qual dos 3 Cavalos de Troia usar primeiro.
2. Usar o contato do cunhado para agendar uma call de 15 minutos (focada em dor, não em tecnologia).
3. Na janela da call, rodar a demonstração ao vivo pelo OBS mostrando o KAIROS no Telegram "pensando" e entregando o resultado.
