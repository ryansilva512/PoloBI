import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { FilterBar, type FilterState } from "@/components/filter-bar";
import { ChartCard, SimpleLineChart, SimpleBarChart, SimpleDonutChart, ChartSkeleton } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, TrendingUp, Star, Users, Frown } from "lucide-react";
import type { DashboardSummary, SatisfactionResponse, TimeSeriesPoint } from "@shared/schema";

export default function Satisfacao() {
  const [filtros, setFiltros] = useState<FilterState>({
    periodo: "30dias",
  });

  const { data: summary, isLoading: loadingSummary } = useQuery<DashboardSummary>({
    queryKey: [`/api/dashboard/summary?periodo=${filtros.periodo}`],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/summary?periodo=${filtros.periodo}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: csatDist, isLoading: loadingCSAT } = useQuery<SatisfactionResponse[]>({
    queryKey: ["/api/dashboard/csat-distribuicao"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/csat-distribuicao");
      if (!res.ok) throw new Error("Failed to fetch CSAT distribution");
      return res.json();
    },
  });

  const { data: csatTrend, isLoading: loadingTrend } = useQuery<TimeSeriesPoint[]>({
    queryKey: [`/api/dashboard/csat-tendencia?periodo=${filtros.periodo}`],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/csat-tendencia?periodo=${filtros.periodo}`);
      if (!res.ok) throw new Error("Failed to fetch CSAT trend");
      return res.json();
    },
  });

  const { data: npsTrend, isLoading: loadingNPS } = useQuery<TimeSeriesPoint[]>({
    queryKey: [`/api/dashboard/nps-tendencia?periodo=${filtros.periodo}`],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/nps-tendencia?periodo=${filtros.periodo}`);
      if (!res.ok) throw new Error("Failed to fetch NPS trend");
      return res.json();
    },
  });

  const csatDonutData = csatDist?.map((c) => ({
    name: c.label,
    value: c.count,
    color:
      c.nota >= 4
        ? "hsl(142, 71%, 45%)"
        : c.nota === 3
        ? "hsl(38, 92%, 50%)"
        : "hsl(0, 72%, 38%)",
  })) || [];

  const csatLineData = csatTrend?.map((t) => ({
    data: t.data,
    csat: t.valor,
  })) || [];

  const npsLineData = npsTrend?.map((t) => ({
    data: t.data,
    nps: t.valor,
  })) || [];

  const npsCategory = summary
    ? summary.nps >= 50
      ? { label: "Excelente", color: "text-success" }
      : summary.nps >= 0
      ? { label: "Bom", color: "text-warning" }
      : { label: "Precisa Melhorar", color: "text-destructive" }
    : { label: "-", color: "" };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Satisfação do Cliente"
        subtitulo="Métricas de satisfação, NPS e esforço do cliente para avaliar a qualidade do atendimento"
      />

      <FilterBar
        filtros={filtros}
        onFiltroChange={setFiltros}
        onExportar={() => console.log("Exportar")}
      />

      {/* KPIs de Satisfação */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-md">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : summary ? (
          <>
            <KPICard
              titulo="CSAT"
              valor={`${summary.csat}%`}
              icone={<ThumbsUp className="h-4 w-4" />}
              meta="90%"
              variacao={2.5}
              tooltip="Customer Satisfaction Score - Percentual de clientes satisfeitos"
              destaque={summary.csat >= 90 ? "success" : summary.csat >= 80 ? "warning" : "danger"}
              testId="kpi-csat"
            />
            <KPICard
              titulo="NPS"
              valor={summary.nps}
              icone={<TrendingUp className="h-4 w-4" />}
              meta="> 50"
              variacao={5.0}
              tooltip="Net Promoter Score - Propensão a recomendar (-100 a 100)"
              destaque={summary.nps >= 50 ? "success" : summary.nps >= 0 ? "warning" : "danger"}
              testId="kpi-nps"
            />
            <KPICard
              titulo="CES"
              valor={summary.ces.toFixed(1)}
              unidade="/ 7"
              icone={<Star className="h-4 w-4" />}
              meta="< 3"
              tooltip="Customer Effort Score - Esforço do cliente (1-7, menor é melhor)"
              destaque={summary.ces <= 3 ? "success" : summary.ces <= 4 ? "warning" : "danger"}
              testId="kpi-ces"
            />
            <KPICard
              titulo="FCR"
              valor={`${summary.taxaResolucaoPrimeiraChamada}%`}
              icone={<Users className="h-4 w-4" />}
              meta="70%"
              variacao={1.8}
              tooltip="First Call Resolution - Resolução na primeira chamada"
              destaque={summary.taxaResolucaoPrimeiraChamada >= 70 ? "success" : "warning"}
              testId="kpi-fcr"
            />
          </>
        ) : null}
      </div>

      {/* NPS Detalhado */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-md lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">NPS Detalhado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <span className="text-5xl font-bold font-mono">{summary?.nps || 0}</span>
              <p className={`text-sm font-medium mt-1 ${npsCategory.color}`}>
                {npsCategory.label}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-success" />
                    Promotores
                  </span>
                  <span className="font-mono">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-warning" />
                    Neutros
                  </span>
                  <span className="font-mono">35%</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                    Detratores
                  </span>
                  <span className="font-mono">20%</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              NPS = % Promotores - % Detratores
            </p>
          </CardContent>
        </Card>

        <ChartCard
          titulo="Evolução NPS"
          subtitulo="Tendência ao longo do período"
          className="lg:col-span-2"
          testId="chart-nps-evolucao"
        >
          {loadingNPS ? (
            <ChartSkeleton altura={280} />
          ) : (
            <SimpleLineChart
              data={npsLineData}
              dataKeys={[{ key: "nps", label: "NPS" }]}
              altura={280}
            />
          )}
        </ChartCard>
      </div>

      {/* CSAT */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          titulo="Distribuição CSAT"
          subtitulo="Notas das pesquisas de satisfação"
          testId="chart-csat-dist"
        >
          {loadingCSAT ? (
            <ChartSkeleton altura={280} />
          ) : (
            <SimpleDonutChart
              data={csatDonutData}
              altura={280}
              centerLabel="CSAT"
              centerValue={`${summary?.csat || 0}%`}
            />
          )}
        </ChartCard>

        <ChartCard
          titulo="Evolução CSAT"
          subtitulo="Tendência da satisfação ao longo do tempo"
          testId="chart-csat-evolucao"
        >
          {loadingTrend ? (
            <ChartSkeleton altura={280} />
          ) : (
            <SimpleLineChart
              data={csatLineData}
              dataKeys={[{ key: "csat", label: "CSAT (%)" }]}
              altura={280}
              formatoY={(v) => `${v}%`}
            />
          )}
        </ChartCard>
      </div>

      {/* Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-success" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">1.</span>
                <span>Tempo de resposta inicial consistentemente abaixo da meta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">2.</span>
                <span>Alta taxa de resolução na primeira chamada (FCR)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">3.</span>
                <span>Feedback positivo sobre cordialidade dos agentes</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Frown className="h-4 w-4 text-destructive" />
              Oportunidades de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">1.</span>
                <span>Tickets de infraestrutura têm CSAT 15% abaixo da média</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">2.</span>
                <span>Canal telefone apresenta maior índice de insatisfação</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">3.</span>
                <span>Clientes relatam dificuldade em encontrar informações no portal</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
