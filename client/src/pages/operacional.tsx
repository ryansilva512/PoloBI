import { useMemo, useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Clock4, ChevronDown, Check } from "lucide-react";
import type { TicketRaw } from "@shared/schema";
import { newTicketsStore } from "@/stores/newTicketsStore";

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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [protocoloTerm, setProtocoloTerm] = useState("");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estado para IDs de chamados recém-abertos (para destaque visual)
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  // Estado para armazenar detalhes dos novos chamados
  const [newTicketsData, setNewTicketsData] = useState<Map<number, any>>(new Map());

  // Chamados em Atendimento (da API de Chamados)
  const [chamadosEmAtendimento, setChamadosEmAtendimento] = useState<any[]>([]);
  const [loadingAtendimento, setLoadingAtendimento] = useState(false);

  // Ler status da URL ao montar (ex: link vindo da Home)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');
    if (statusParam) {
      const statuses = statusParam.split(',');
      setSelectedStatuses(statuses);
    }
  }, []);

  // Buscar chamados em atendimento
  useEffect(() => {
    const fetchChamadosEmAtendimento = async () => {
      setLoadingAtendimento(true);
      try {
        const response = await fetch('/api/proxy/chamado/listagem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'EmAtendimento',
            total_registros: 100,
            pagina: 1
          }),
        });

        if (!response.ok) {
          console.error('Erro na API de chamados:', response.status);
          setChamadosEmAtendimento([]);
          return;
        }

        const data = await response.json();
        const lista = data?.lista || [];

        console.log('📋 Chamados em atendimento recebidos:', lista.length, 'de', data?.meta?.paginate?.total || 0);
        setChamadosEmAtendimento(lista);
      } catch (e) {
        console.error('Erro ao buscar chamados em atendimento:', e);
        setChamadosEmAtendimento([]);
      } finally {
        setLoadingAtendimento(false);
      }
    };

    fetchChamadosEmAtendimento();
    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchChamadosEmAtendimento, 60000);
    return () => clearInterval(interval);
  }, []);

  // Subscrever ao store de novos chamados
  useEffect(() => {
    const unsubscribe = newTicketsStore.subscribe(tickets => {
      setHighlightedIds(new Set(tickets.keys()));
      setNewTicketsData(tickets);
    });
    // Carregar estado inicial
    setHighlightedIds(newTicketsStore.getIds());
    setNewTicketsData(newTicketsStore.getTickets());
    return unsubscribe;
  }, []);

  const dataInicialDate = useMemo(() => parseDateSafely(filters.data_inicial), [filters.data_inicial]);
  const dataFinalDate = useMemo(() => parseDateSafely(filters.data_final), [filters.data_final]);

  const ticketsFiltrados = useMemo(() => {
    const lista = ticketsResponse?.lista ?? [];
    if (!lista.length) return [];

    const start = dataInicialDate;
    const end = dataFinalDate;
    const filtroAnalista = normalizeName(filters.analista);

    const dentroPeriodo = lista.filter((ticket) => {
      const dataRef = ticket.data_criacao || ticket.data_inicial || ticket.data_final;
      const dataTicket = parseDateSafely(dataRef);
      const operador = normalizeName(ticket.nome);

      if (filtroAnalista && operador !== filtroAnalista) return false;
      if (start && dataTicket && dataTicket < start) return false;
      if (end && dataTicket && dataTicket > end) return false;
      return true;
    });

    // Deduplicacao apos aplicar o filtro de datas/analista para manter apenas chamados do intervalo
    const refDate = (ticket: TicketRaw) =>
      parseDateSafely(ticket.data_final) ||
      parseDateSafely(ticket.data_inicial) ||
      parseDateSafely(ticket.data_criacao);

    const dedupKey = (ticket: TicketRaw) =>
      ticket.codigo ?? ticket.id ?? `${ticket.id}-${ticket.codigo}`;

    const map = new Map<number | string, TicketRaw>();
    dentroPeriodo.forEach((ticket) => {
      const key = dedupKey(ticket);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, ticket);
        return;
      }

      const newDate = refDate(ticket)?.getTime() || -Infinity;
      const oldDate = refDate(existing)?.getTime() || -Infinity;

      if (newDate >= oldDate) {
        map.set(key, ticket);
      }
    });

    return Array.from(map.values());
  }, [ticketsResponse?.lista, filters, dataInicialDate, dataFinalDate]);

  const tempoMedioAbertura = useMemo(() => {
    if (!ticketsFiltrados.length) {
      return { minutos: null as number | null, total: 0, considerados: 0 };
    }

    const duracoesMin = ticketsFiltrados
      .map((ticket) => {
        const dataCriacao = parseDateSafely(ticket.data_criacao);
        const dataInicial = parseDateSafely(ticket.data_inicial);
        if (!dataCriacao || !dataInicial) return null;
        const diffMs = dataInicial.getTime() - dataCriacao.getTime();
        if (!Number.isFinite(diffMs) || diffMs < 0) return null;
        return diffMs / (1000 * 60);
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    if (!duracoesMin.length) return { minutos: null, total: 0, considerados: 0 };

    const semOutlier = duracoesMin.filter((v) => v <= 24 * 60); // remove valores acima de 24h
    const trim = Math.floor(semOutlier.length * 0.05); // descarta top 5%
    const base =
      semOutlier.length > trim ? semOutlier.slice(0, semOutlier.length - trim) : semOutlier;

    const soma = base.reduce((a, b) => a + b, 0);
    return {
      minutos: base.length ? soma / base.length : null,
      total: duracoesMin.length,
      considerados: base.length,
    };
  }, [ticketsFiltrados]);

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
    if (!ticketsFiltrados.length) return [];
    const unique = new Set<string>();
    ticketsFiltrados.forEach((ticket) => {
      if (ticket.nome) unique.add(ticket.nome);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ticketsFiltrados]);

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

  // Converter TODOS os chamados da API /chamado/listagem para TicketRaw (incluindo Pausado)
  // Estrutura real da API Milvus /chamado/listagem:
  // - tecnico: string direta (ex: "Abraao Lima")
  // - cliente: string direta (ex: "Instituto Cultural Brasil...")  
  // - mesa_trabalho: string direta (ex: "Suporte Técnico")
  // - status: string direta (ex: "Atendendo", "Pausado")
  const chamadosAbertoFormatados = useMemo(() => {
    return chamadosEmAtendimento.map((ticket: any) => ({
      id: ticket.id || ticket.codigo,
      codigo: ticket.codigo,
      assunto: ticket.assunto || ticket.descricao || 'Sem assunto',
      nome: ticket.tecnico || 'Não atribuído',
      nome_fantasia: ticket.cliente || 'Cliente',
      status: { text: ticket.status || 'Atendendo', id: 0 },
      mesa_trabalho: { text: ticket.mesa_trabalho || 'Suporte', id: 0 },
      data_criacao: ticket.data_criacao || new Date().toISOString(),
      data_inicial: ticket.data_resposta,
      data_final: ticket.data_solucao,
      tempo_abertura_atendimento: ticket.tempo_abertura_atendimento || '',
      tempo_atendimento: ticket.tempo_atendimento || '',
    } as unknown as TicketRaw));
  }, [chamadosEmAtendimento]);

  // Combinar chamados do relatório (finalizados) com chamados abertos (Atendendo/Pausado)
  // Aplicando também o filtro de analista aos chamados ativos
  const todosChamados = useMemo(() => {
    const filtroAnalista = normalizeName(filters.analista);

    // Filtrar chamados ativos pelo analista se houver filtro
    const chamadosAtivosFiltrados = filtroAnalista
      ? chamadosAbertoFormatados.filter(ticket =>
        normalizeName(ticket.nome) === filtroAnalista
      )
      : chamadosAbertoFormatados;

    const merged: TicketRaw[] = [...ticketsFiltrados, ...chamadosAtivosFiltrados];
    // Remover duplicatas pelo codigo
    const uniqueMap = new Map<number, TicketRaw>();
    merged.forEach(ticket => {
      if (!uniqueMap.has(ticket.codigo)) {
        uniqueMap.set(ticket.codigo, ticket);
      }
    });
    return Array.from(uniqueMap.values());
  }, [ticketsFiltrados, chamadosAbertoFormatados, filters.analista]);

  const filteredTickets = useMemo(() => {
    // Se nenhum status selecionado, mostrar todos
    const hasStatusFilter = selectedStatuses.length > 0;

    return todosChamados.filter((ticket: TicketRaw) => {
      // Filtro de status (multi-select)
      if (hasStatusFilter && !selectedStatuses.includes(ticket.status.text)) {
        return false;
      }
      // Filtro de protocolo
      if (protocoloTerm && !ticket.codigo.toString().includes(protocoloTerm)) {
        return false;
      }
      // Filtro de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          ticket.assunto.toLowerCase().includes(term) ||
          ticket.nome.toLowerCase().includes(term) ||
          ticket.nome_fantasia.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [todosChamados, searchTerm, selectedStatuses, protocoloTerm]);

  // Paginação dos tickets filtrados
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTickets.slice(start, end);
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatuses, protocoloTerm]);

  // Lista de status disponíveis para o dropdown
  const statusDisponiveis = useMemo(() => {
    const unique = new Set<string>();

    // Adicionar status dos tickets do relatório
    ticketsFiltrados.forEach((ticket) => {
      if (ticket.status?.text) unique.add(ticket.status.text);
    });

    // Adicionar status dos chamados abertos
    chamadosEmAtendimento.forEach((ticket: any) => {
      if (ticket.status) unique.add(ticket.status);
    });

    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ticketsFiltrados, chamadosEmAtendimento]);

  // Handler para toggle de status
  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearStatusFilter = () => {
    setSelectedStatuses([]);
    setStatusPopoverOpen(false);
  };

  const applyStatusFilter = () => {
    setStatusPopoverOpen(false);
  };

  const tempoMedioAberturaFormatado =
    tempoMedioAbertura.minutos !== null
      ? minutosToHoraString(Math.round(tempoMedioAbertura.minutos))
      : "--:--";

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
        <div className="text-center">
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
        <div className="text-center">
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
        <div className="text-center">
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
        <div className="text-center">
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
      accessor: (row: TicketRaw) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm">{row.codigo}</span>
          {highlightedIds.has(row.codigo) && (
            <Badge
              variant="destructive"
              className="animate-pulse text-xs px-1.5 py-0.5"
              onClick={(e) => {
                e.stopPropagation();
                newTicketsStore.clearId(row.codigo);
              }}
            >
              NOVO
            </Badge>
          )}
        </div>
      ),
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
      header: "STATUS",
      accessor: (row: TicketRaw) => {
        // Cores personalizadas por status
        const statusColors: Record<string, string> = {
          'Atendendo': 'bg-green-500 hover:bg-green-600 text-white',
          'Finalizado': 'bg-blue-500 hover:bg-blue-600 text-white',
          'Pausado': 'bg-yellow-500 hover:bg-yellow-600 text-black',
        };
        const colorClass = statusColors[row.status.text] || 'bg-secondary';

        return (
          <Badge className={colorClass}>
            {row.status.text}
          </Badge>
        );
      },
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

  // Só mostra "nenhum dado" se não houver dados do relatório E também não houver chamados ativos
  if ((!aggregatedData || !slaData) && todosChamados.length === 0) {
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


      {/* Novos Chamados Abertos (Dashboard de Alertas) */}
      {highlightedIds.size > 0 && (
        <Card className="border-red-500/50 bg-red-500/5 animate-pulse">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-600 flex items-center gap-2">
              🔔 Chamados Recém-Abertos ({highlightedIds.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(newTicketsData.values()).map((ticket) => (
                <div
                  key={ticket.codigo}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-700 dark:text-red-400">
                        #{ticket.codigo}
                      </span>
                      <Badge variant="destructive" className="text-xs">NOVO</Badge>
                    </div>
                    <p className="font-medium text-sm mt-1">{ticket.assunto}</p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.nome_fantasia || 'Cliente não identificado'} • {ticket.nome || 'Não atribuído'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => newTicketsStore.clearId(ticket.codigo)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Marcar como visto
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gestão de Chamados - PRIMEIRO */}
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
            {/* Dropdown Multi-Select de Status */}
            <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                  <span className="truncate">
                    {selectedStatuses.length === 0
                      ? "Todos os status"
                      : selectedStatuses.length === 1
                        ? selectedStatuses[0]
                        : `${selectedStatuses.length} selecionados`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <div className="p-3 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Filtrar por status</p>
                  <div className="space-y-2">
                    {statusDisponiveis.map((status) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded px-2 py-1.5"
                        onClick={() => toggleStatus(status)}
                      >
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <label
                          htmlFor={`status-${status}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {status}
                        </label>
                        {selectedStatuses.includes(status) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={clearStatusFilter}
                    >
                      Limpar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={applyStatusFilter}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Seletor de itens por página */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Exibir:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={ticketColumns}
            data={paginatedTickets}
            keyExtractor={(row: TicketRaw) => `${row.id}-${row.codigo}`}
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTickets.length)} de {filteredTickets.length} itens
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </Button>

                {/* Números das páginas */}
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[36px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <>
                    <span className="px-2 text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="min-w-[36px]"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance dos Operadores - POR ÚLTIMO */}
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
    </div>
  );
}
