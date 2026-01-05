# Análise dos Cálculos de Tempo no Dashboard

**Data:** 05 de Janeiro de 2026  
**Autor:** Assistente de Desenvolvimento  
**Contexto:** Revisão dos cálculos de tempo do dashboard Power BI

---

## Sumário Executivo

Foi identificada uma série de inconsistências nos cálculos de tempo do dashboard. O principal problema é que o sistema calcula manualmente os tempos de resposta e atendimento, quando a API do Milvus já retorna esses dados prontos nos campos de SLA.

---

## Problemas Identificados

### 1. Dupla Fonte de Dados

O dashboard utiliza duas fontes diferentes para calcular tempos:

| Fonte | Endpoint | Uso |
|-------|----------|-----|
| API Principal | `/relatorio-atendimento/listagem` | Retorna `data_inicial`, `data_final`, `total_horas_atendimento` |
| Relatório CSV | `/relatorio-personalizado/exportar` | Retorna campos detalhados incluindo SLA |

**Impacto:** Pode haver divergência entre os valores calculados e os valores oficiais do Milvus.

### 2. Campos do CSV Não Utilizados

O relatório CSV retorna campos importantes que estão sendo ignorados:

```javascript
// Campos disponíveis no CSV (server/routes.ts linhas 751-778)
{
  status_sla_resposta: row['STATUS SLA RESPOSTA'],       // ← NÃO UTILIZADO
  status_sla_solucao: row['STATUS SLA SOLUÇÃO'],         // ← NÃO UTILIZADO
  data_expiracao_sla_resposta: row['DATA DE EXPIRAÇÃO SLA RESPOSTA'],
  hora_expiracao_sla_resposta: row['HORA DE EXPIRAÇÃO SLA RESPOSTA'],
  data_expiracao_sla_solucao: row['DATA DE EXPIRAÇÃO SLA SOLUÇÃO'],
  hora_expiracao_sla_solucao: row['HORA DE EXPIRAÇÃO SLA SOLUÇÃO'],
  tempo_atendimento_interno: row['TEMPO DE ATENDIMENTO INTERNO DENTRO DO EXPEDIENTE'],
  tempo_atendimento_externo: row['TEMPO DE ATENDIMENTO EXTERNO DENTRO DO EXPEDIENTE'],
}
```

### 3. Cálculo Manual Não Considera Expediente

O cálculo atual (home.tsx linhas 541-557):

```javascript
// Cálculo ATUAL - NÃO considera expediente
const dataPrimeiroAtend = parseDataHoraCSV(t.data_primeiro_atendimento, t.hora_primeiro_atendimento);
if (dataCriacao && dataPrimeiroAtend) {
  const diffMs = dataPrimeiroAtend.getTime() - dataCriacao.getTime();
  const minutos = diffMs / (1000 * 60);
  temposResposta.push(minutos);
}
```

**Problema:** Um chamado criado sexta-feira às 17h e atendido segunda às 8h aparece como 63 horas, quando na verdade deveria ser 1 hora de trabalho.

### 4. Metas Hardcoded

As metas estão fixas no código (home.tsx linhas 61-62):

```javascript
const META_RESPOSTA_MINUTOS = 5;      // 5 minutos
const META_ATENDIMENTO_HORAS = 4;     // 4 horas
```

**Recomendação:** Estas metas deveriam vir de configuração ou do próprio Milvus.

### 5. Caps de Tempo Podem Distorcer Médias

O código aplica limites máximos:

```javascript
// home.tsx linhas 1220-1229
const respMedia = calcularMediaCap(respValid, 180);   // cap 3 horas
const atendMedia = calcularMediaCap(atendValid, 480); // cap 8 horas
```

**Impacto:** Chamados com tempo acima desses limites são excluídos do cálculo, podendo mascarar problemas reais de SLA.

---

## Arquitetura Atual dos Cálculos

```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │  ticketsFiltrados│         │ticketsDetalhados│               │
│  │  (API Milvus)    │         │  (CSV Milvus)   │               │
│  └────────┬────────┘         └────────┬────────┘               │
│           │                           │                         │
│           ▼                           ▼                         │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │ tempoMetrics    │         │temposDoRelatorio│               │
│  │ (cálculo manual)│         │(cálculo manual) │               │
│  └─────────────────┘         └─────────────────┘               │
│           │                           │                         │
│           └───────────┬───────────────┘                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │  EXIBIÇÃO NO    │                                │
│              │   DASHBOARD     │                                │
│              └─────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Solução Recomendada

### Opção A: Usar Campos de SLA do Milvus (Recomendado)

Modificar o código para usar diretamente os campos `STATUS SLA RESPOSTA` e `STATUS SLA SOLUÇÃO` que já vêm calculados pelo Milvus, considerando expediente e configurações do sistema.

```javascript
// PROPOSTA: Usar campos nativos do Milvus
const tempoMetricsFromMilvus = useMemo(() => {
  if (!ticketsDetalhados.length) return defaultMetrics;
  
  let respostaEmDia = 0;
  let respostaEstourada = 0;
  let solucaoEmDia = 0;
  let solucaoEstourada = 0;
  
  ticketsDetalhados.forEach((t) => {
    // Usar status SLA que já vem calculado pelo Milvus
    if (t.status_sla_resposta === 'Dentro do prazo' || 
        t.status_sla_resposta === 'Em dia') {
      respostaEmDia++;
    } else if (t.status_sla_resposta) {
      respostaEstourada++;
    }
    
    if (t.status_sla_solucao === 'Dentro do prazo' || 
        t.status_sla_solucao === 'Em dia') {
      solucaoEmDia++;
    } else if (t.status_sla_solucao) {
      solucaoEstourada++;
    }
  });
  
  return {
    respostaEmDia,
    respostaEstourada,
    atendimentoEmDia: solucaoEmDia,
    atendimentoExpirado: solucaoEstourada,
  };
}, [ticketsDetalhados]);
```

### Opção B: Usar Tempo Interno do Expediente

Se precisar calcular médias de tempo, usar o campo `tempo_atendimento_interno` que já desconta pausas e horário fora do expediente:

```javascript
// PROPOSTA: Usar tempo interno para médias mais precisas
const tempoMedioAtendimentoReal = useMemo(() => {
  const temposValidos = ticketsDetalhados
    .filter(t => t.tempo_atendimento_interno && t.tempo_atendimento_interno !== 'Não possui')
    .map(t => horaStringToMinutos(t.tempo_atendimento_interno))
    .filter(m => m > 0);
  
  if (!temposValidos.length) return 0;
  return temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length;
}, [ticketsDetalhados]);
```

---

## Campos Disponíveis no CSV (Referência)

| Campo CSV | Nome no Código | Descrição |
|-----------|----------------|-----------|
| TICKET | ticket | Número do ticket |
| DATA DE CRIAÇÃO DO TICKET | data_criacao | Data de abertura |
| HORA DE CRIAÇÃO DO TICKET | hora_criacao | Hora de abertura |
| DATA DO PRIMEIRO ATENDIMENTO | data_primeiro_atendimento | Data da primeira resposta |
| HORA DO PRIMEIRO ATENDIMENTO | hora_primeiro_atendimento | Hora da primeira resposta |
| DATA DA SOLUÇÃO | data_solucao | Data de fechamento |
| HORA DA SOLUÇÃO | hora_solucao | Hora de fechamento |
| TEMPO TOTAL DE ATENDIMENTO | tempo_total_atendimento | Tempo bruto total |
| **STATUS SLA RESPOSTA** | status_sla_resposta | **JÁ CALCULADO PELO MILVUS** |
| **STATUS SLA SOLUÇÃO** | status_sla_solucao | **JÁ CALCULADO PELO MILVUS** |
| TEMPO DE ATENDIMENTO INTERNO | tempo_atendimento_interno | Tempo dentro do expediente |
| TEMPO DE ATENDIMENTO EXTERNO | tempo_atendimento_externo | Tempo fora do expediente |
| DATA EXPIRAÇÃO SLA RESPOSTA | data_expiracao_sla_resposta | Prazo limite para resposta |
| DATA EXPIRAÇÃO SLA SOLUÇÃO | data_expiracao_sla_solucao | Prazo limite para solução |

---

## Modificações Realizadas (05/01/2026)

### 1. CORREÇÃO CRÍTICA: Campo Errado para Tempo de Atendimento

**Problema identificado:** Os gráficos de "Tempo Médio de Atendimento" mostravam valores como **08:41:00 para Victor**, quando o Power BI mostrava **04:20:50** (exatamente metade!).

**Causa raiz:** O sistema estava usando o campo errado:
- ❌ `total_horas_atendimento` = tempo TOTAL (inclui tempo fora do expediente)
- ✅ `horas_internas` = tempo DENTRO do expediente (o que o Power BI usa!)

**Solução:** Substituir `total_horas_atendimento` por `horas_internas` em todos os cálculos.

#### Arquivos corrigidos:

**`client/src/pages/home.tsx`:**
- `diffsAtendimentoMin`: Agora usa `horas_internas || total_horas_atendimento`
- `operadoresPorAtendimento`: Agora usa `horas_internas || total_horas_atendimento`
- `tempoAtendimentoPorOperadorCSV`: Agora usa `tempo_atendimento_interno || tempo_total_atendimento`
- `temposDoRelatorio.tempoMedioSolucao`: Agora usa `tempo_atendimento_interno || tempo_total_atendimento`

**`client/src/pages/registros-expirados.tsx`:**
- `atendimentosExpirados`: Agora usa `horas_internas || total_horas_atendimento`

**`client/src/services/dataAggregator.ts`:**
- `calculateOperatorMetrics`: Agora usa `horas_internas || total_horas_atendimento`

### 2. Interface `TicketDetalhado` atualizada

Adicionados novos campos para capturar os dados de SLA nativos do Milvus:

```typescript
interface TicketDetalhado {
  // ... campos existentes ...
  // NOVOS campos de SLA nativos do Milvus
  status_sla_resposta: string;
  status_sla_solucao: string;
  data_expiracao_sla_resposta: string;
  hora_expiracao_sla_resposta: string;
  data_expiracao_sla_solucao: string;
  hora_expiracao_sla_solucao: string;
}
```

### 3. Nova função `metricasSLAMilvus`

Criado um novo `useMemo` que calcula métricas usando os campos nativos do Milvus:

```typescript
const metricasSLAMilvus = useMemo(() => {
  // Usa status_sla_resposta e status_sla_solucao
  // Valores: "Dentro do prazo", "Em dia", "Fora do prazo", "Expirado"
  // ...
}, [ticketsDetalhados, filters]);
```

### 4. Card de Diagnóstico Adicionado

Adicionado um card de comparação na interface que mostra lado a lado:
- **SLA Resposta (Milvus)** vs **Resposta (Cálculo Manual)**
- **SLA Solução (Milvus)** vs **Atendimento (Cálculo Manual)**

Isso permite identificar discrepâncias entre os dois métodos de cálculo.

---

## Mapeamento Correto dos Campos de Tempo

### API Principal (TicketRaw)
| Campo | Descrição | Usar para |
|-------|-----------|-----------|
| `horas_internas` | Tempo DENTRO do expediente | ✅ Tempo de atendimento |
| `total_horas_atendimento` | Tempo TOTAL (inclui fora expediente) | ❌ NÃO USAR |
| `horas_operador` | Horas trabalhadas pelo operador | Total de horas |
| `horas_externas` | Tempo FORA do expediente | Análise apenas |

### CSV (Relatório Personalizado)
| Campo | Descrição | Usar para |
|-------|-----------|-----------|
| `tempo_atendimento_interno` | Tempo DENTRO do expediente | ✅ Tempo de atendimento |
| `tempo_total_atendimento` | Tempo TOTAL (inclui fora expediente) | ❌ NÃO USAR |
| `tempo_atendimento_externo` | Tempo FORA do expediente | Análise apenas |

---

## Próximos Passos

1. [x] ~~Verificar valores possíveis de `STATUS SLA RESPOSTA` e `STATUS SLA SOLUÇÃO` no CSV~~
2. [x] ~~Implementar uso dos campos nativos do Milvus~~
3. [x] ~~Corrigir cálculo de tempo de atendimento (usar `horas_internas` / `tempo_atendimento_interno`)~~
4. [x] ~~Corrigir página de registros expirados~~
5. [x] ~~Corrigir dataAggregator.ts~~
6. [ ] Testar com dados reais para validar os valores
7. [ ] Criar configuração para metas de SLA (ao invés de hardcoded)

---

## Arquivos Modificados

| Arquivo | Modificação |
|---------|-------------|
| `client/src/pages/home.tsx` | Corrigido para usar `horas_internas` (API) e `tempo_atendimento_interno` (CSV) |
| `client/src/pages/registros-expirados.tsx` | Corrigido para usar `horas_internas` |
| `client/src/services/dataAggregator.ts` | Corrigido para usar `horas_internas` |
| `docs/2026-01-05-analise-tempos-dashboard.md` | Documentação criada e atualizada |

---

## Como Testar

1. Acesse o dashboard e verifique o card "Diagnóstico SLA"
2. Compare os valores entre "SLA Resposta (Milvus)" e "Resposta (Cálculo Manual)"
3. Se houver grande diferença, os dados do Milvus são mais precisos
4. Verifique o console do navegador para logs detalhados (`📊 Métricas SLA Milvus`)

---

## Referências

- Documentação API Milvus: `/api/relatorio-personalizado/exportar`
- Documentação API Milvus: `/api/relatorio-atendimento/listagem`

