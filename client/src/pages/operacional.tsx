import { useMemo, useState } from "react";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { aggregateTicketData, calculateSLADistribution, minutosToHoraString } from "@/services/dataAggregator";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { ChartCard, SimpleDonutChart, SimpleBarChart } from "@/components/charts";
import { DataTable, type Column } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, AlertTriangle } from "lucide-react";
import type { TicketRaw } from "@shared/schema";

export default function Operacional() {
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

  const filteredOperadores = useMemo(() => {
    if (!aggregatedData?.operadorMetrics) return [];
    if (!searchTerm) return aggregatedData.operadorMetrics;
    return aggregatedData.operadorMetrics.filter((op: any) =>
      op.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [aggregatedData?.operadorMetrics, searchTerm]);

  const filteredTickets = useMemo(() => {
    if (!ticketsResponse?.lista) return [];
    if (!searchTerm) return ticketsResponse.lista;
    return ticketsResponse.lista.filter(
      (ticket: TicketRaw) =>
        ticket.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.codigo.toString().includes(searchTerm) ||
        ticket.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ticketsResponse?.lista, searchTerm]);

  const operadorColumns: Column<any>[] = [
    {
      key: "nome",
      header: "Operador",
      accessor: (row: any) => <span className="font-medium">{row.nome}</span>,
      sortable: true,
      sortKey: (row: any) => row.nome,
    },
    {
      key: "ticketsResolvidos",
      header: "Tickets Resolvidos",
      accessor: (row: any) => (
        <div className="text-right">
          <span className="font-semibold">{row.ticketsResolvidos}</span>
        </div>
      ),
      sortable: true,
      sortKey: (row: any) => row.ticketsResolvidos,
    },
    {
      key: "tempoMedioRespostaMinutos",
      header: "Tempo Resposta",
      accessor: (row: any) => (
        <div className="text-right">
          <span className="font-mono text-sm">{minutosToHoraString(row.tempoMedioRespostaMinutos)}</span>
        </div>
      ),
      sortable: true,
      sortKey: (row: any) => row.tempoMedioRespostaMinutos,
    },
    {
      key: "tempoMedioAtendimentoMinutos",
      header: "Tempo Atendimento",
      accessor: (row: any) => (
        <div className="text-right">
          <span className="font-mono text-sm">{minutosToHoraString(row.tempoMedioAtendimentoMinutos)}</span>
        </div>
      ),
      sortable: true,
      sortKey: (row: any) => row.tempoMedioAtendimentoMinutos,
    },
    {
      key: "totalHorasAtendimento",
      header: "Total Horas",
      accessor: (row: any) => (
        <div className="text-right">
          <span className="font-mono text-sm">{row.totalHorasAtendimento.toFixed(2)}h</span>
        </div>
      ),
      sortable: true,
      sortKey: (row: any) => row.totalHorasAtendimento,
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
          <p className="font-medium truncate">{row.assunto}</p>
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
      key: "status",
      header: "Status",
      accessor: (row: TicketRaw) => (
        <Badge
          variant={
            row.status.text === "Finalizado"
              ? "default"
              : row.status.text === "Aberto"
              ? "destructive"
              : "secondary"
          }
        >
          {row.status.text}
        </Badge>
      ),
    },
    {
      key: "mesa_trabalho",
      header: "Mesa",
      accessor: (row: TicketRaw) => <span className="text-sm text-muted-foreground">{row.mesa_trabalho.text}</span>,
    },
    {
      key: "data_criacao",
      header: "Criado",
      accessor: (row: TicketRaw) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.data_criacao).toLocaleDateString("pt-BR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
      sortable: true,
      sortKey: (row: TicketRaw) => row.data_criacao,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader titulo="Operacional" subtitulo="Painel de operadores e tickets em tempo real" />
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
      <PageHeader titulo="Operacional" subtitulo="Nenhum dado disponível para o período selecionado" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Operacional"
        subtitulo="Painel de operadores e gestão de tickets em tempo real"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Total Tickets"
          valor={aggregatedData.totalTickets.toLocaleString()}
          icone={<Ticket className="w-5 h-5" />}
          destaque="success"
        />
        <KPICard
          titulo="Finalizados"
          valor={aggregatedData.ticketsFinalizados.toLocaleString()}
          icone={<Ticket className="w-5 h-5" />}
          destaque="success"
        />
        <KPICard
          titulo="Em Aberto"
          valor={aggregatedData.ticketsEmAberto.toLocaleString()}
          icone={<AlertTriangle className="w-5 h-5" />}
          destaque={aggregatedData.ticketsEmAberto > 20 ? "danger" : "warning"}
        />
        <KPICard
          titulo="Operadores Ativos"
          valor={aggregatedData.totalOperadores.toString()}
          icone={<Users className="w-5 h-5" />}
          destaque="success"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard titulo="Distribuição por Status" subtitulo="Total de chamados por status">
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
        <ChartCard titulo="Tickets por Mesa de Trabalho" subtitulo="Distribuição por mesa">
          <SimpleBarChart
            data={aggregatedData.distribuicaoPorMesaTrabalho.map((d) => ({
              label: d.mesa,
              value: d.quantidade,
            }))}
            dataKeys={[{ key: "value", label: "Tickets" }]}
          />
        </ChartCard>
      </div>

      {/* Operadores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Operadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filtrar por nome do operador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <DataTable 
            columns={operadorColumns} 
            data={filteredOperadores}
            keyExtractor={(row: any) => row.nome}
          />
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Chamados</CardTitle>
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
