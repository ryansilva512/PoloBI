import { useMemo, useState } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  parseISO,
  parse,
  isValid,
} from "date-fns";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { aggregateTicketData, calculateSLADistribution, minutosToHoraString } from "@/services/dataAggregator";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { TicketRaw } from "@shared/schema";

const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

const normalizeName = (value?: string | null) => (value ?? "").trim().toLowerCase();

const parseDateSafely = (value?: string | null) => {
  if (!value) return null;

  const parsers = [
    () => parseISO(value),
    () => parse(value, DATE_FORMAT, new Date()),
    () => parse(value, "yyyy-MM-dd", new Date()),
    () => parse(value, "dd/MM/yyyy HH:mm:ss", new Date()),
    () => parse(value, "dd/MM/yyyy", new Date()),
  ];

  for (const tryParse of parsers) {
    try {
      const parsed = tryParse();
      if (isValid(parsed)) return parsed;
    } catch (err) {
      // ignore and try next format
    }
  }
  return null;
};

export default function Operacional() {
  const { filters, updateFilters, updateFilter } = useFilters();
  const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [protocoloTerm, setProtocoloTerm] = useState("");

  const ticketsUnicos = useMemo(() => {
    if (!ticketsResponse?.lista) return [];
    const map = new Map<number | string, TicketRaw>();
    ticketsResponse.lista.forEach((ticket) => {
      const key = ticket.id ?? ticket.codigo;
      map.set(key, ticket);
    });
    return Array.from(map.values());
  }, [ticketsResponse?.lista]);

  const dataInicialDate = useMemo(() => parseDateSafely(filters.data_inicial), [filters.data_inicial]);
  const dataFinalDate = useMemo(() => parseDateSafely(filters.data_final), [filters.data_final]);

  const ticketsFiltrados = useMemo(() => {
    if (!ticketsUnicos.length) return [];

    const start = dataInicialDate;
    const end = dataFinalDate;
    const filtroAnalista = normalizeName(filters.analista);

    return ticketsUnicos.filter((ticket) => {
      const dataRef = ticket.data_criacao || ticket.data_inicial || ticket.data_final;
      const dataTicket = parseDateSafely(dataRef);
      const operador = normalizeName(ticket.nome);

      if (filtroAnalista && operador !== filtroAnalista) return false;
      if (start && dataTicket && dataTicket < start) return false;
      if (end && dataTicket && dataTicket > end) return false;
      return true;
    });
  }, [ticketsUnicos, filters, dataInicialDate, dataFinalDate]);

  const aggregatedData = useMemo(() => {
    if (!ticketsFiltrados.length) return null;
    return aggregateTicketData(ticketsFiltrados);
  }, [ticketsFiltrados]);

  const slaData = useMemo(() => {
    if (!ticketsFiltrados.length) return null;
    return calculateSLADistribution(ticketsFiltrados);
  }, [ticketsFiltrados]);

  const filteredOperadores = useMemo(() => {
    if (!aggregatedData?.operadorMetrics) return [];
    if (!searchTerm) return aggregatedData.operadorMetrics;
    return aggregatedData.operadorMetrics.filter((op: any) =>
      op.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [aggregatedData?.operadorMetrics, searchTerm]);

  const operadoresDisponiveis = useMemo(() => {
    if (!ticketsUnicos.length) return [];
    const unique = new Set<string>();
    ticketsUnicos.forEach((ticket) => {
      if (ticket.nome) unique.add(ticket.nome);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ticketsUnicos]);

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (!value) {
      updateFilters({
        [type === "start" ? "data_inicial" : "data_final"]: undefined,
      } as Partial<typeof filters>);
      return;
    }

    const parsed = parseISO(value);
    if (!isValid(parsed)) return;

    if (type === "start") {
      updateFilters({ data_inicial: format(startOfDay(parsed), DATE_FORMAT) });
    } else {
      updateFilters({ data_final: format(endOfDay(parsed), DATE_FORMAT) });
    }
  };

  const handleOperatorFilter = (nome?: string) => {
    if (!nome || filters.analista === nome) {
      updateFilter("analista", undefined);
    } else {
      updateFilter("analista", nome);
    }
  };

  const filteredTickets = useMemo(() => {
    if (!ticketsFiltrados.length) return [];
    return ticketsFiltrados.filter((ticket: TicketRaw) => {
      if (statusFilter && ticket.status.text !== statusFilter) return false;
      if (protocoloTerm && !ticket.codigo.toString().includes(protocoloTerm)) return false;
      if (!searchTerm) return true;
      return (
        ticket.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [ticketsFiltrados, searchTerm, statusFilter, protocoloTerm]);

  const statusDisponiveis = useMemo(() => {
    if (!ticketsResponse?.lista) return [];
    const unique = new Set<string>();
    ticketsResponse.lista.forEach((ticket) => {
      if (ticket.status?.text) unique.add(ticket.status.text);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ticketsResponse?.lista]);

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
      header: "Codigo",
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
      <PageHeader titulo="Operacional" subtitulo="Nenhum dado disponivel para o periodo selecionado" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Operacional"
        subtitulo="Painel de operadores e gestao de tickets em tempo real"
      />

      {/* Filtros de data e operadores */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 py-4">
          {ticketsResponse?.mock && (
            <div className="rounded-md bg-amber-100 text-amber-900 px-3 py-2 text-sm">
              Aviso: exibindo dados mock porque a API real não respondeu. Verifique a conexão/API MILVUS.
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              Periodo
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                value={dataInicialDate ? format(dataInicialDate, "yyyy-MM-dd") : ""}
                onChange={(e) => handleDateChange("start", e.target.value)}
                className="sm:max-w-xs"
              />
              <Input
                type="date"
                value={dataFinalDate ? format(dataFinalDate, "yyyy-MM-dd") : ""}
                onChange={(e) => handleDateChange("end", e.target.value)}
                className="sm:max-w-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateFilters({
                    data_inicial: undefined,
                    data_final: undefined,
                  })
                }
              >
                Limpar datas
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              Operadores
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={!filters.analista ? "default" : "outline"}
                onClick={() => handleOperatorFilter()}
              >
                Todos
              </Button>
              {operadoresDisponiveis.map((operador) => (
                <Button
                  key={operador}
                  size="sm"
                  variant={filters.analista === operador ? "default" : "secondary"}
                  onClick={() => handleOperatorFilter(operador)}
                >
                  {operador}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apenas cards-chave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          titulo="Em Aberto"
          valor={aggregatedData.ticketsEmAberto.toLocaleString()}
          icone={<AlertTriangle className="w-5 h-5" />}
          destaque={aggregatedData.ticketsEmAberto > 20 ? "danger" : "warning"}
        />
        <KPICard
          titulo="Qtd de Status"
          valor={aggregatedData.distribuicaoPorStatus.length.toString()}
          icone={<AlertTriangle className="w-5 h-5" />}
          destaque="success"
        />
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
          <CardTitle>Gestao de Chamados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <Input
              placeholder="Buscar por assunto, operador ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:max-w-sm"
            />
            <Input
              placeholder="Pesquisar por protocolo (codigo)..."
              value={protocoloTerm}
              onChange={(e) => setProtocoloTerm(e.target.value)}
              className="md:max-w-xs"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                variant={!statusFilter ? "default" : "outline"}
                onClick={() => setStatusFilter(undefined)}
              >
                Todos os status
              </Button>
              {statusDisponiveis.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "secondary"}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
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
