import { useMemo, useState } from "react";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { aggregateTicketData, calculateSLADistribution, calculateSLAStatus } from "@/services/dataAggregator";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { ChartCard, SimpleDonutChart, SimpleBarChart } from "@/components/charts";
import { DataTable, type Column } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { TicketRaw } from "@shared/schema";

export default function SLA() {
  const { filters } = useFilters();
  const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);
  const [searchTerm, setSearchTerm] = useState("");

  const aggregatedData = useMemo(() => {
    if (!ticketsResponse?.lista) return null;
    return aggregateTicketData(ticketsResponse.lista);
  }, [ticketsResponse]);

  const slaData = useMemo(() => {
    if (!ticketsResponse?.lista) return null;
    return calculateSLADistribution(ticketsResponse.lista);
  }, [ticketsResponse]);

  const slaByOperador = useMemo(() => {
    if (!ticketsResponse?.lista) return [];

    const operadorMap = new Map<
      string,
      { emDia: number; emRisco: number; estourado: number }
    >();

    ticketsResponse.lista.forEach((ticket: TicketRaw) => {
      const nomeOperador = ticket.nome;
      const status = calculateSLAStatus(ticket.horas_ticket);

      if (!operadorMap.has(nomeOperador)) {
        operadorMap.set(nomeOperador, {
          emDia: 0,
          emRisco: 0,
          estourado: 0,
        });
      }

      const data = operadorMap.get(nomeOperador)!;
      if (status === "em_dia") data.emDia += 1;
      else if (status === "em_risco") data.emRisco += 1;
      else data.estourado += 1;
    });

    return Array.from(operadorMap.entries()).map(([operador, data]) => ({
      operador,
      ...data,
      total: data.emDia + data.emRisco + data.estourado,
      conformidade: (
        (data.emDia / (data.emDia + data.emRisco + data.estourado)) *
        100
      ).toFixed(1),
    }));
  }, [ticketsResponse?.lista]);

  const filteredTickets = useMemo(() => {
    if (!ticketsResponse?.lista) return [];

    let filtered = ticketsResponse.lista.filter((ticket: TicketRaw) => {
      const status = calculateSLAStatus(ticket.horas_ticket);
      return status === "em_risco" || status === "estourado";
    });

    if (!searchTerm) return filtered;
    return filtered.filter(
      (ticket: TicketRaw) =>
        ticket.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.codigo.toString().includes(searchTerm) ||
        ticket.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  }, [ticketsResponse?.lista, searchTerm]);

  const slaTableColumns: Column<any>[] = [
    {
      key: "operador",
      header: "Operador",
      accessor: (row: any) => <span className="font-medium">{row.operador}</span>,
      sortable: true,
      sortKey: (row: any) => row.operador,
    },
    {
      key: "emDia",
      header: "Em Dia",
      accessor: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {row.emDia}
        </span>
      ),
      sortable: true,
      sortKey: (row: any) => row.emDia,
    },
    {
      key: "emRisco",
      header: "Em Risco",
      accessor: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {row.emRisco}
        </span>
      ),
      sortable: true,
      sortKey: (row: any) => row.emRisco,
    },
    {
      key: "estourado",
      header: "Estourado",
      accessor: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {row.estourado}
        </span>
      ),
      sortable: true,
      sortKey: (row: any) => row.estourado,
    },
    {
      key: "conformidade",
      header: "Conformidade %",
      accessor: (row: any) => (
        <div className="text-right font-mono font-semibold">{row.conformidade}%</div>
      ),
      sortable: true,
      sortKey: (row: any) => parseFloat(row.conformidade),
    },
  ];

  const ticketColumns: Column<TicketRaw>[] = [
    {
      key: "codigo",
      header: "Código",
      accessor: (row: TicketRaw) => <span className="font-mono font-bold text-sm">{row.codigo}</span>,
      sortable: true,
      sortKey: (row: TicketRaw) => row.codigo,
    },
    {
      key: "assunto",
      header: "Assunto",
      accessor: (row: TicketRaw) => (
        <div className="max-w-xs">
          <p className="font-medium truncate text-red-600">{row.assunto}</p>
          <p className="text-xs text-muted-foreground">{row.nome_fantasia}</p>
        </div>
      ),
      sortable: true,
      sortKey: (row: TicketRaw) => row.assunto,
    },
    {
      key: "nome",
      header: "Operador",
      accessor: (row: TicketRaw) => <span className="text-sm">{row.nome}</span>,
      sortable: true,
      sortKey: (row: TicketRaw) => row.nome,
    },
    {
      key: "horas_ticket",
      header: "Tempo SLA",
      accessor: (row: TicketRaw) => {
        const status = calculateSLAStatus(row.horas_ticket);
        return (
          <Badge
            variant={
              status === "estourado"
                ? "destructive"
                : status === "em_risco"
                ? "secondary"
                : "default"
            }
          >
            {row.horas_ticket}
          </Badge>
        );
      },
    },
    {
      key: "data_criacao",
      header: "Criado",
      accessor: (row: TicketRaw) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.data_criacao).toLocaleDateString("pt-BR")}
        </span>
      ),
      sortable: true,
      sortKey: (row: TicketRaw) => row.data_criacao,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="SLA & Performance" subtitulo="Conformidade e análise de prazos" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!aggregatedData || !slaData) {
    return (
      <PageHeader
        titulo="SLA & Performance"
        subtitulo="Nenhum dado disponível para o período selecionado"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="SLA & Performance"
        subtitulo="Monitoramento de conformidade com prazos de atendimento"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conformidade Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {((slaData.emDia / (slaData.emDia + slaData.emRisco + slaData.estourado)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">SLA dentro do prazo</p>
          </CardContent>
        </Card>

        <KPICard
          titulo="Em Dia"
          valor={slaData.emDia}
          icone={<CheckCircle className="w-5 h-5" />}
          destaque="success"
        />

        <KPICard
          titulo="Em Risco"
          valor={slaData.emRisco}
          icone={<AlertTriangle className="w-5 h-5" />}
          destaque="warning"
        />
      </div>

      {/* Estourado Card */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-base text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Chamados Estourados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-red-700">{slaData.estourado}</div>
          <p className="text-xs text-red-600 mt-2">SLA acima do prazo</p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard titulo="Distribuição SLA" subtitulo="Status de SLA dos chamados">
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
            centerValue={(slaData.emDia + slaData.emRisco + slaData.estourado)}
            centerLabel="Total"
          />
        </ChartCard>

        <ChartCard titulo="SLA por Operador" subtitulo="Conformidade por operador">
          <SimpleBarChart
            data={slaByOperador.map((op: any) => ({
              label: op.operador,
              value: parseFloat(op.conformidade),
            }))}
            dataKeys={[{ key: "value", label: "Conformidade %" }]}
            layout="horizontal"
          />
        </ChartCard>
      </div>

      {/* SLA By Operador Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conformidade por Operador</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={slaTableColumns} 
            data={slaByOperador}
            keyExtractor={(row: any) => row.operador}
          />
        </CardContent>
      </Card>

      {/* Critical Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Chamados em Risco ou Estourados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filtrar por código, assunto ou operador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <DataTable 
            columns={ticketColumns} 
            data={filteredTickets}
            keyExtractor={(row: TicketRaw) => `${row.id}-${row.codigo}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
