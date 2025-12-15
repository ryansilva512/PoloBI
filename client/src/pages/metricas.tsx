import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Target, Clock, ThumbsUp, DollarSign, TrendingUp } from "lucide-react";
import type { KPIDefinition } from "@shared/schema";

const kpiDefinitions: KPIDefinition[] = [
  // SLA & Tempo
  {
    id: "frt",
    nome: "Tempo de Primeira Resposta (FRT)",
    categoria: "sla",
    formula: "Soma(tempo até primeira resposta) / Total de tickets",
    objetivo: "Medir a rapidez do primeiro contato com o cliente",
    decisoes: "Identificar gargalos no atendimento inicial; Ajustar alocação de equipe",
    unidade: "minutos",
    metaIdeal: "< 30 minutos",
  },
  {
    id: "aht",
    nome: "Tempo Médio de Atendimento (AHT)",
    categoria: "sla",
    formula: "Soma(tempo de resolução) / Total de tickets resolvidos",
    objetivo: "Avaliar eficiência na resolução de chamados",
    decisoes: "Identificar tickets complexos; Otimizar processos; Treinamento de equipe",
    unidade: "minutos",
    metaIdeal: "< 120 minutos",
  },
  {
    id: "sla-compliance",
    nome: "Conformidade de SLA",
    categoria: "sla",
    formula: "(Tickets dentro do prazo / Total de tickets) x 100",
    objetivo: "Medir o cumprimento dos acordos de nível de serviço",
    decisoes: "Revisar prazos de SLA; Priorizar tickets em risco; Escalar recursos",
    unidade: "percentual",
    metaIdeal: "> 95%",
  },
  {
    id: "escalation-rate",
    nome: "Taxa de Escalonamento",
    categoria: "sla",
    formula: "(Tickets escalonados / Total de tickets) x 100",
    objetivo: "Monitorar complexidade e capacitação do primeiro nível",
    decisoes: "Investir em treinamento; Revisar matriz de escalonamento; Identificar gaps",
    unidade: "percentual",
    metaIdeal: "< 15%",
  },
  // Satisfação
  {
    id: "csat",
    nome: "CSAT (Customer Satisfaction Score)",
    categoria: "satisfacao",
    formula: "(Respostas positivas / Total de respostas) x 100",
    objetivo: "Medir satisfação geral do cliente com o atendimento",
    decisoes: "Identificar pontos de melhoria; Reconhecer boas práticas; Treinar equipe",
    unidade: "percentual",
    metaIdeal: "> 90%",
  },
  {
    id: "nps",
    nome: "NPS (Net Promoter Score)",
    categoria: "satisfacao",
    formula: "% Promotores (9-10) - % Detratores (0-6)",
    objetivo: "Medir propensão do cliente a recomendar o serviço",
    decisoes: "Estratégias de fidelização; Ações de recuperação de detratores",
    unidade: "pontos (-100 a 100)",
    metaIdeal: "> 50",
  },
  {
    id: "ces",
    nome: "CES (Customer Effort Score)",
    categoria: "satisfacao",
    formula: "Média das notas de esforço (escala 1-7)",
    objetivo: "Medir o esforço do cliente para resolver seu problema",
    decisoes: "Simplificar processos; Melhorar autoatendimento; Reduzir fricção",
    unidade: "pontos (1-7, menor é melhor)",
    metaIdeal: "< 3",
  },
  {
    id: "fcr",
    nome: "FCR (First Call Resolution)",
    categoria: "satisfacao",
    formula: "(Tickets resolvidos no primeiro contato / Total) x 100",
    objetivo: "Medir efetividade da resolução no primeiro contato",
    decisoes: "Capacitar equipe; Melhorar base de conhecimento; Empoderar agentes",
    unidade: "percentual",
    metaIdeal: "> 70%",
  },
  // Operacional
  {
    id: "backlog",
    nome: "Backlog de Tickets",
    categoria: "operacional",
    formula: "Tickets abertos + Tickets em andamento",
    objetivo: "Monitorar volume de trabalho pendente",
    decisoes: "Dimensionar equipe; Priorizar atendimentos; Identificar gargalos",
    unidade: "quantidade",
    metaIdeal: "Manter estável ou decrescente",
  },
  {
    id: "reopen-rate",
    nome: "Taxa de Reabertura",
    categoria: "operacional",
    formula: "(Tickets reabertos / Total resolvidos) x 100",
    objetivo: "Medir qualidade das resoluções",
    decisoes: "Revisar qualidade do atendimento; Identificar agentes com alta reabertura",
    unidade: "percentual",
    metaIdeal: "< 10%",
  },
  // Custos
  {
    id: "cost-per-ticket",
    nome: "Custo por Chamado",
    categoria: "custos",
    formula: "Custo total operacional / Total de tickets",
    objetivo: "Medir eficiência financeira do suporte",
    decisoes: "Otimizar processos; Investir em automação; Revisar modelo de atendimento",
    unidade: "reais",
    metaIdeal: "< R$ 25,00",
  },
  {
    id: "abandonment-rate",
    nome: "Taxa de Abandono",
    categoria: "custos",
    formula: "(Chamadas abandonadas / Total de chamadas) x 100",
    objetivo: "Medir chamadas perdidas antes do atendimento",
    decisoes: "Dimensionar equipe telefônica; Revisar URA; Oferecer callback",
    unidade: "percentual",
    metaIdeal: "< 5%",
  },
];

const categorias = [
  { id: "todas", label: "Todas", icon: TrendingUp },
  { id: "sla", label: "SLA & Tempo", icon: Clock },
  { id: "satisfacao", label: "Satisfação", icon: ThumbsUp },
  { id: "operacional", label: "Operacional", icon: Target },
  { id: "custos", label: "Custos", icon: DollarSign },
];

export default function Metricas() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas");

  const metricasFiltradas = kpiDefinitions.filter((kpi) => {
    const matchBusca =
      kpi.nome.toLowerCase().includes(busca.toLowerCase()) ||
      kpi.objetivo.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria =
      categoriaAtiva === "todas" || kpi.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Biblioteca de Métricas"
        subtitulo="Dicionário completo de KPIs utilizados nos dashboards com definições, fórmulas e orientações"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar métricas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
            data-testid="input-busca-metricas"
          />
        </div>
      </div>

      <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categorias.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="gap-2"
              data-testid={`tab-${cat.id}`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={categoriaAtiva} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {metricasFiltradas.map((kpi) => (
              <Card key={kpi.id} className="rounded-md" data-testid={`card-kpi-${kpi.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold">
                      {kpi.nome}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {categorias.find((c) => c.id === kpi.categoria)?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                      Fórmula
                    </h4>
                    <p className="text-sm font-mono bg-muted/50 p-2 rounded">
                      {kpi.formula}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                      Objetivo
                    </h4>
                    <p className="text-sm text-muted-foreground">{kpi.objetivo}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                      Decisões que Suporta
                    </h4>
                    <p className="text-sm text-muted-foreground">{kpi.decisoes}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Unidade: <span className="font-medium">{kpi.unidade}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-success/30 text-success text-xs"
                    >
                      Meta: {kpi.metaIdeal}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {metricasFiltradas.length === 0 && (
            <Card className="rounded-md">
              <CardContent className="flex flex-col items-center justify-center h-40 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Nenhuma métrica encontrada para os filtros selecionados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="rounded-md bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Métricas de Vaidade vs. Métricas Acionáveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uma métrica acionável é aquela que leva diretamente a uma decisão ou ação.
            Métricas de vaidade podem parecer impressionantes, mas não ajudam na tomada de decisão.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-md bg-success/5 border border-success/20">
              <h4 className="text-sm font-medium text-success mb-2">Métricas Acionáveis</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Taxa de conformidade SLA por prioridade</li>
                <li>CSAT segmentado por tipo de issue</li>
                <li>Backlog por idade do ticket</li>
                <li>Taxa de reabertura por agente</li>
              </ul>
            </div>
            <div className="p-4 rounded-md bg-destructive/5 border border-destructive/20">
              <h4 className="text-sm font-medium text-destructive mb-2">Métricas de Vaidade</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Total de tickets desde o início</li>
                <li>Número de acessos ao portal (sem contexto)</li>
                <li>Quantidade de agentes cadastrados</li>
                <li>Total de emails enviados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
