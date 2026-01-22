# Atividade por Dia da Semana - Por Operador

**Data:** 22 de Janeiro de 2026

## Descrição da Alteração

Foi adicionado um novo componente no dashboard "Visão Geral" que exibe a quantidade de chamados finalizados por operador em cada dia da semana (Domingo a Sábado).

## Localização

O componente foi adicionado na área superior do dashboard, entre o card "Chamados Ativos" e o calendário "Chamados por Dia".

## Arquivo Modificado

- `client/src/pages/home.tsx`

## Alterações Realizadas

### 1. Novo useMemo: `atividadePorOperadorDiaSemana`

Criado um hook `useMemo` que:
- Utiliza os dados de `ticketsDetalhados` (relatório CSV)
- Agrupa os chamados por operador e dia da semana
- Usa a `data_solucao` para determinar o dia da semana
- Respeita os filtros de data aplicados no dashboard
- Ignora tickets excluídos
- Retorna um array ordenado por total de chamados (descendente)

```typescript
const atividadePorOperadorDiaSemana = useMemo(() => {
  // Map: operador -> [dom, seg, ter, qua, qui, sex, sab]
  const map = new Map<string, number[]>();
  
  ticketsDetalhados.forEach((t) => {
    // Filtros e agrupamento por operador/dia da semana
    const diaSemana = dataTicket.getDay(); // 0 = Domingo, 6 = Sábado
    dias[diaSemana] += 1;
  });

  return Array.from(map.entries())
    .map(([operador, dias]) => ({ operador, dias, total }))
    .sort((a, b) => b.total - a.total);
}, [ticketsDetalhados, filters.data_inicial, filters.data_final]);
```

### 2. Novo Card no Layout

Adicionado um Card com tabela visual contendo:
- **Cabeçalho**: Ícone + título "Atividade por Dia da Semana"
- **Colunas**: Técnico, Dom, Seg, Ter, Qua, Qui, Sex, Sáb
- **Linhas**: Todos os operadores ordenados por total de chamados
- **Células**: Badges coloridos indicando quantidade
  - Azul claro: 1-2 chamados
  - Azul escuro: 3-5 chamados
  - Laranja: 6+ chamados
- **Scroll**: Vertical para acomodar todos os operadores
- **Altura**: Flexível, acompanha a altura do calendário adjacente

## Estrutura Visual

```
┌─────────────────────────────────────────┐
│ 📊 Atividade por Dia da Semana          │
├─────────────────────────────────────────┤
│ Técnico  │ Dom │ Seg │ Ter │ Qua │ ... │
├──────────┼─────┼─────┼─────┼─────┼─────┤
│ Operador │  -  │ (2) │ (2) │ (1) │ ... │
│ Operador │  -  │ (2) │ (1) │  -  │ ... │
└─────────────────────────────────────────┘
```

## Dependências

- Utiliza dados de `ticketsDetalhados` já existentes no componente
- Utiliza filtros de data do contexto `useFilters`
- Utiliza componentes UI existentes: Card, CardContent
- Utiliza ícone Activity do Lucide

## Atualização - Reorganização do Layout

O layout foi reorganizado para otimizar o espaço:

### Nova Estrutura
- **Coluna 1**: Visão Geral + Top Avaliados + Chamados Ativos + PERÍODO/METAS (abaixo)
- **Coluna 2**: Atividade por Dia da Semana
- **Coluna 3**: Chamados por Dia (Calendário) + ATUALIZAÇÃO AUTOMÁTICA (abaixo)

### Benefícios
- Eliminou espaço vazio entre os componentes
- Layout mais compacto e organizado
- Melhor aproveitamento do espaço vertical

