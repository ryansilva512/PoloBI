import { useMemo } from "react";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { aggregateTicketData, calculateSLADistribution, minutosToHoraString } from "@/services/dataAggregator";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { ChartCard, SimpleDonutChart, SimpleBarChart } from "@/components/charts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Ticket,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";

export default function Home() {
  const { filters } = useFilters();
  const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);

  console.log("Home - Filters:", filters);
  console.log("Home - TicketsResponse:", ticketsResponse);
  console.log("Home - IsLoading:", isLoading);

  const aggregatedData = useMemo(() => {
    if (!ticketsResponse?.lista) return null;
    return aggregateTicketData(ticketsResponse.lista);
  }, [ticketsResponse]);

  const slaData = useMemo(() => {
    if (!ticketsResponse?.lista) return null;
    return calculateSLADistribution(ticketsResponse.lista);
  }, [ticketsResponse]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          titulo="Visão Geral"
          subtitulo="Dashboard executivo com indicadores principais"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!aggregatedData || !slaData) {
    return (
      <PageHeader
        titulo="Visão Geral"
        subtitulo="Nenhum dado disponível para o período selecionado"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Visão Geral"
        subtitulo="Dashboard executivo com indicadores principais do Help Desk"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Total de Chamados"
          valor={aggregatedData.totalTickets.toLocaleString()}
          icone={<Ticket className="w-5 h-5" />}
          destaque="success"
        />
        <KPICard
          titulo="Finalizados"
          valor={aggregatedData.ticketsFinalizados.toLocaleString()}
          icone={<CheckCircle className="w-5 h-5" />}
          destaque="success"
        />
        <KPICard
          titulo="Em Aberto"
          valor={aggregatedData.ticketsEmAberto.toLocaleString()}
          icone={<AlertTriangle className="w-5 h-5" />}
          destaque={aggregatedData.ticketsEmAberto > 50 ? "danger" : "warning"}
        />
        <KPICard
          titulo="Operadores"
          valor={aggregatedData.totalOperadores.toString()}
          icone={<Users className="w-5 h-5" />}
          destaque="success"
        />
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard titulo="Distribuição por Status" subtitulo="Visão geral dos chamados">
          <SimpleDonutChart
            data={aggregatedData.distribuicaoPorStatus.map((d) => ({
              name: d.status,
              value: d.quantidade,
              color:
                d.status === "Finalizado"
                  ? "hsl(142, 71%, 45%)"
                  : d.status === "Aberto"
                  ? "hsl(0, 84%, 60%)"
                  : "hsl(38, 92%, 50%)",
            }))}
            centerValue={aggregatedData.totalTickets}
            centerLabel="Total"
          />
        </ChartCard>

        <ChartCard titulo="Conformidade SLA" subtitulo="Status de SLA dos chamados">
          <SimpleDonutChart
            data={[
              {
                name: "Em Dia",
                value: slaData.emDia,
                color: "hsl(142, 71%, 45%)",
              },
              {
                name: "Em Risco",
                value: slaData.emRisco,
                color: "hsl(38, 92%, 50%)",
              },
              {
                name: "Estourado",
                value: slaData.estourado,
                color: "hsl(0, 84%, 60%)",
              },
            ]}
            centerValue={`${((slaData.emDia / (slaData.emDia + slaData.emRisco + slaData.estourado)) * 100).toFixed(0)}%`}
            centerLabel="Conformidade"
          />
        </ChartCard>
      </div>

      {/* Mesa de Trabalho Distribution */}
      <ChartCard titulo="Distribuição por Mesa de Trabalho" subtitulo="Tickets distribuídos por mesa">
        <SimpleBarChart
          data={aggregatedData.distribuicaoPorMesaTrabalho.map((d) => ({
            label: d.mesa,
            value: d.quantidade,
          }))}
          dataKeys={[{ key: "value", label: "Tickets" }]}
        />
      </ChartCard>
    </div>
  );
}
