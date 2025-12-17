import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { FilterBar, type FilterState } from "@/components/filter-bar";
import { ChartCard, SimpleBarChart, SimpleLineChart, ChartSkeleton } from "@/components/charts";
import { DataTable, TableSkeleton, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Building2, Mail, TrendingUp } from "lucide-react";
import type { Agent, DepartmentPerformance, ChannelDistribution } from "@shared/schema";

export default function Analises() {
  const [filtros, setFiltros] = useState<FilterState>({
    periodo: "30dias",
  });

  const [activeTab, setActiveTab] = useState("agentes");

  const { data: agentes, isLoading: loadingAgentes } = useQuery<Agent[]>({
    queryKey: ["/api/agentes"],
    queryFn: async () => {
      const res = await fetch("/api/agentes");
      if (!res.ok) throw new Error("Failed to fetch agentes");
      return res.json();
    },
  });

  const { data: departamentos, isLoading: loadingDept } = useQuery<DepartmentPerformance[]>({
    queryKey: ["/api/dashboard/departamento-performance"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/departamento-performance");
      if (!res.ok) throw new Error("Failed to fetch departamento-performance");
      return res.json();
    },
  });

  const { data: canais, isLoading: loadingCanais } = useQuery<ChannelDistribution[]>({
    queryKey: ["/api/dashboard/canal-distribuicao"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/canal-distribuicao");
      if (!res.ok) throw new Error("Failed to fetch canal-distribuicao");
      return res.json();
    },
  });

  const agenteColumns: Column<Agent>[] = [
    {
      key: "nome",
      header: "Agente",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {row.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.nome}</p>
            <p className="text-xs text-muted-foreground">{row.departamento}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: (row) => row.nome,
    },
    {
      key: "ticketsResolvidos",
      header: "Resolvidos",
      accessor: (row) => (
        <span className="font-mono font-medium">{row.ticketsResolvidos}</span>
      ),
      sortable: true,
      sortKey: (row) => row.ticketsResolvidos,
    },
    {
      key: "tempoMedio",
      header: "Tempo Médio",
      accessor: (row) => (
        <span className="font-mono text-sm">{row.tempoMedioResolucao} min</span>
      ),
      sortable: true,
      sortKey: (row) => row.tempoMedioResolucao,
    },
    {
      key: "csat",
      header: "CSAT",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Progress value={row.csat} className="w-16 h-2" />
          <span className="font-mono text-xs">{row.csat}%</span>
        </div>
      ),
      sortable: true,
      sortKey: (row) => row.csat,
    },
    {
      key: "reabertura",
      header: "Reabertura",
      accessor: (row) => (
        <Badge
          variant="outline"
          className={
            row.taxaReavertura <= 5
              ? "border-success/30 text-success"
              : row.taxaReavertura <= 10
              ? "border-warning/30 text-warning"
              : "border-destructive/30 text-destructive"
          }
        >
          {row.taxaReavertura}%
        </Badge>
      ),
      sortable: true,
      sortKey: (row) => row.taxaReavertura,
    },
  ];

  const deptData = departamentos?.map((d) => ({
    label: d.departamento,
    resolvidos: d.ticketsResolvidos,
    csat: d.csat,
  })) || [];

  const canalData = canais?.map((c) => ({
    label: c.canal === "email" ? "E-mail" : c.canal === "telefone" ? "Telefone" : c.canal === "chat" ? "Chat" : c.canal === "whatsapp" ? "WhatsApp" : "Portal",
    chamados: c.count,
    percentual: c.percentual,
  })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Análises Detalhadas"
        subtitulo="Drill-down por agente, departamento, canal e tipo de issue para identificar padrões e tendências"
      />

      <FilterBar
        filtros={filtros}
        onFiltroChange={setFiltros}
        onExportar={() => console.log("Exportar")}
        opcoesDepartamento={["TI", "Financeiro", "RH", "Comercial"]}
        opcoesAgente={agentes?.map(a => a.nome) || []}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="agentes" className="gap-2" data-testid="tab-agentes">
            <Users className="h-4 w-4" />
            Por Agente
          </TabsTrigger>
          <TabsTrigger value="departamentos" className="gap-2" data-testid="tab-departamentos">
            <Building2 className="h-4 w-4" />
            Por Departamento
          </TabsTrigger>
          <TabsTrigger value="canais" className="gap-2" data-testid="tab-canais">
            <Mail className="h-4 w-4" />
            Por Canal
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="gap-2" data-testid="tab-tendencias">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agentes" className="mt-6 space-y-6">
          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">
                  Performance por Agente
                </CardTitle>
                <Badge variant="secondary" className="font-mono">
                  {agentes?.length || 0} agentes
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Analise os agentes com maior taxa de reabertura ou menor CSAT para treinamento direcionado
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingAgentes ? (
                <TableSkeleton rows={5} columns={5} />
              ) : agentes ? (
                <DataTable
                  data={agentes}
                  columns={agenteColumns}
                  keyExtractor={(row) => row.id}
                  testId="table-agentes"
                />
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Top 5 - Maior Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentes?.slice(0, 5).map((agent, index) => (
                    <div key={agent.id} className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-4">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.nome}</p>
                      </div>
                      <span className="font-mono text-sm">{agent.ticketsResolvidos}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Top 5 - Melhor CSAT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentes?.sort((a, b) => b.csat - a.csat).slice(0, 5).map((agent, index) => (
                    <div key={agent.id} className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-4">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.nome}</p>
                      </div>
                      <Badge variant="outline" className="border-success/30 text-success font-mono">
                        {agent.csat}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departamentos" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              titulo="Tickets por Departamento"
              subtitulo="Volume de tickets resolvidos"
              testId="chart-dept-volume"
            >
              {loadingDept ? (
                <ChartSkeleton altura={280} />
              ) : (
                <SimpleBarChart
                  data={deptData}
                  dataKeys={[{ key: "resolvidos", label: "Tickets Resolvidos" }]}
                  altura={280}
                />
              )}
            </ChartCard>

            <ChartCard
              titulo="CSAT por Departamento"
              subtitulo="Satisfação do cliente por área"
              testId="chart-dept-csat"
            >
              {loadingDept ? (
                <ChartSkeleton altura={280} />
              ) : (
                <SimpleBarChart
                  data={deptData}
                  dataKeys={[{ key: "csat", label: "CSAT (%)", color: "hsl(142, 71%, 45%)" }]}
                  altura={280}
                />
              )}
            </ChartCard>
          </div>

          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Comparativo de Departamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departamentos?.map((dept) => (
                  <div key={dept.departamento} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dept.departamento}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{dept.ticketsResolvidos} tickets</span>
                        <span className="font-mono">{dept.tempoMedioResolucao}min</span>
                        <Badge
                          variant="outline"
                          className={
                            dept.conformidadeSLA >= 95
                              ? "border-success/30 text-success"
                              : dept.conformidadeSLA >= 85
                              ? "border-warning/30 text-warning"
                              : "border-destructive/30 text-destructive"
                          }
                        >
                          SLA: {dept.conformidadeSLA}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={dept.csat} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canais" className="mt-6 space-y-6">
          <ChartCard
            titulo="Distribuição por Canal"
            subtitulo="Volume de chamados por canal de atendimento"
            testId="chart-canal"
          >
            {loadingCanais ? (
              <ChartSkeleton altura={300} />
            ) : (
              <SimpleBarChart
                data={canalData}
                dataKeys={[{ key: "chamados", label: "Chamados" }]}
                altura={300}
                layout="horizontal"
              />
            )}
          </ChartCard>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {canalData.map((canal) => (
              <Card key={canal.label} className="rounded-md">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {canal.label}
                  </p>
                  <p className="text-2xl font-bold font-mono mt-1">{canal.chamados}</p>
                  <p className="text-xs text-muted-foreground">{canal.percentual}% do total</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="mt-6 space-y-6">
          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Padrões Identificados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-md bg-muted/50 space-y-2">
                  <h4 className="text-sm font-medium">Picos de Demanda</h4>
                  <p className="text-xs text-muted-foreground">
                    Segundas-feiras entre 9h e 11h apresentam 40% mais chamados que a média.
                  </p>
                </div>
                <div className="p-4 rounded-md bg-muted/50 space-y-2">
                  <h4 className="text-sm font-medium">Sazonalidade</h4>
                  <p className="text-xs text-muted-foreground">
                    Final de mês tem aumento de 25% em tickets do departamento Financeiro.
                  </p>
                </div>
                <div className="p-4 rounded-md bg-muted/50 space-y-2">
                  <h4 className="text-sm font-medium">Tipo de Issue</h4>
                  <p className="text-xs text-muted-foreground">
                    "Reset de senha" representa 18% dos chamados - candidato a automação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
