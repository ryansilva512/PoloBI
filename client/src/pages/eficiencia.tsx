import { useMemo } from "react";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { aggregateTicketData } from "@/services/dataAggregator";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { ChartCard, SimpleDonutChart, SimpleBarChart } from "@/components/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

export default function Eficiencia() {
  const { filters } = useFilters();
  const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);

  const aggregatedData = useMemo(() => {
    if (!ticketsResponse?.lista) return null;
    return aggregateTicketData(ticketsResponse.lista);
  }, [ticketsResponse]);

  const volumeMetrics = useMemo(() => {
    if (!ticketsResponse?.lista) return null;

    const tickets = ticketsResponse.lista;
    const finalizados = tickets.filter((t: any) => t.status.text === "Finalizado").length;
    const custoMedio = finalizados > 0 ? 250 : 0; // Valor fictício para demonstração

    return {
      totalChamados: tickets.length,
      chamadosFinalizados: finalizados,
      custoPorChamado: custoMedio,
      custoTotal: finalizados * custoMedio,
    };
  }, [ticketsResponse?.lista]);

  const distribuicaoTipoChamado = useMemo(() => {
    if (!ticketsResponse?.lista) return [];

    const typeMap = new Map<string, number>();

    ticketsResponse.lista.forEach((ticket: any) => {
      const tipo = ticket.tipo_chamado.text;
      typeMap.set(tipo, (typeMap.get(tipo) || 0) + 1);
    });

    return Array.from(typeMap.entries())
      .map(([tipo, quantidade]) => ({
        label: tipo,
        value: quantidade,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [ticketsResponse?.lista]);

  const distribuicaoCategoria = useMemo(() => {
    if (!ticketsResponse?.lista) return [];

    const categoryMap = new Map<string, number>();

    ticketsResponse.lista.forEach((ticket: any) => {
      const categoria = ticket.categoria_primaria;
      categoryMap.set(categoria, (categoryMap.get(categoria) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([categoria, quantidade]) => ({
        name: categoria,
        value: quantidade,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [ticketsResponse?.lista]);

  if (isLoading || !aggregatedData) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Eficiência & Custos" subtitulo="Análise de produtividade e custos operacionais" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!volumeMetrics) {
    return (
      <PageHeader
        titulo="Eficiência & Custos"
        subtitulo="Nenhum dado disponível para o período selecionado"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Eficiência & Custos"
        subtitulo="Análise de produtividade e custos operacionais do Help Desk"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Total de Chamados"
          valor={volumeMetrics.totalChamados}
          icone={<BarChart3 className="w-5 h-5" />}
          destaque="success"
        />
        <KPICard
          titulo="Finalizados"
          valor={volumeMetrics.chamadosFinalizados}
          icone={<TrendingUp className="w-5 h-5" />}
          destaque="success"
        />
        <KPICard
          titulo="Custo/Chamado"
          valor={`R$ ${volumeMetrics.custoPorChamado}`}
          icone={<PieChart className="w-5 h-5" />}
          destaque="neutral"
        />
        <KPICard
          titulo="Custo Total"
          valor={`R$ ${volumeMetrics.custoTotal.toLocaleString()}`}
          icone={<BarChart3 className="w-5 h-5" />}
          destaque="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard titulo="Distribuição por Tipo de Chamado" subtitulo="Top 8 tipos">
          <SimpleBarChart
            data={distribuicaoTipoChamado}
            dataKeys={[{ key: "value", label: "Quantidade" }]}
          />
        </ChartCard>

        <ChartCard titulo="Distribuição por Categoria Primária" subtitulo="Top 8 categorias">
          <SimpleDonutChart
            data={distribuicaoCategoria}
            showLabel={true}
          />
        </ChartCard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {volumeMetrics.totalChamados > 0 
                ? ((volumeMetrics.chamadosFinalizados / volumeMetrics.totalChamados) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {volumeMetrics.chamadosFinalizados} de {volumeMetrics.totalChamados} finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {aggregatedData.totalOperadores > 0 
                ? (volumeMetrics.chamadosFinalizados / aggregatedData.totalOperadores).toFixed(1) 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Chamados finalizados por operador
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
