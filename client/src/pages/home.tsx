import { useMemo } from "react";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import {
  aggregateTicketData,
  calculateSLADistribution,
  horaStringToMinutos,
} from "@/services/dataAggregator";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Phone,
  Timer,
  Clock4,
  AlertTriangle,
  Activity,
  Star,
} from "lucide-react";

const META_RESPOSTA_MINUTOS = 5;
const META_ATENDIMENTO_HORAS = 4;

const parseDateSafely = (value?: string | null) => {
  if (!value) return null;

  const parsers = [
    () => parseISO(value),
    () => parseISO(value.replace(" ", "T")),
    () => parseISO(value + "Z"),
    () => parseISO(value.split(" ")[0]),
  ];

  for (const tryParse of parsers) {
    try {
      const parsed = tryParse();
      if (isValid(parsed)) return parsed;
    } catch (err) {
      // ignore
    }
  }
  return null;
};

const formatMinutosCompleto = (minutos: number): string => {
  const totalSegundos = Math.round(minutos * 60);
  const horas = Math.floor(totalSegundos / 3600);
  const mins = Math.floor((totalSegundos % 3600) / 60);
  const secs = totalSegundos % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(horas)}:${pad(mins)}:${pad(secs)}`;
};

const parseDateRangeDias = (dataInicial?: string, dataFinal?: string) => {
  if (!dataInicial || !dataFinal) return 30;
  const inicio = new Date(dataInicial.replace(" ", "T"));
  const fim = new Date(dataFinal.replace(" ", "T"));
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return 30;
  const diffMs = Math.max(fim.getTime() - inicio.getTime(), 0);
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(dias, 1);
};

export default function Home() {
  const { filters, updateFilters } = useFilters();
  const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);

  const tickets = ticketsResponse?.lista ?? [];

  const ticketsUnicos = useMemo(() => {
    if (!tickets.length) return [];
    const map = new Map<number | string, typeof tickets[0]>();
    tickets.forEach((t) => {
      const key = t.codigo ?? t.id;
      if (!map.has(key)) map.set(key, t);
    });
    return Array.from(map.values());
  }, [tickets]);

  const dataInicialDate = useMemo(
    () => (filters.data_inicial ? parseDateSafely(filters.data_inicial) : null),
    [filters.data_inicial]
  );
  const dataFinalDate = useMemo(
    () => (filters.data_final ? parseDateSafely(filters.data_final) : null),
    [filters.data_final]
  );

  const ticketsFiltrados = useMemo(() => {
    if (!ticketsUnicos.length) return [];
    return ticketsUnicos.filter((ticket) => {
      const dataRef = ticket.data_criacao || ticket.data_inicial || ticket.data_final;
      const dataTicket = parseDateSafely(dataRef);
      if (dataInicialDate && dataTicket && dataTicket < dataInicialDate) return false;
      if (dataFinalDate && dataTicket && dataTicket > dataFinalDate) return false;
      return true;
    });
  }, [ticketsUnicos, dataInicialDate, dataFinalDate]);

  const aggregatedData = useMemo(() => {
    if (!ticketsFiltrados.length) return null;
    return aggregateTicketData(ticketsFiltrados);
  }, [ticketsFiltrados]);

  const slaData = useMemo(() => {
    if (!ticketsFiltrados.length) return null;
    return calculateSLADistribution(ticketsFiltrados);
  }, [ticketsFiltrados]);

  const periodoDias = useMemo(
    () => parseDateRangeDias(filters.data_inicial, filters.data_final),
    [filters.data_inicial, filters.data_final]
  );

  const tempoMetrics = useMemo(() => {
    if (!ticketsFiltrados.length) {
      return {
        tempoMedioResposta: 0,
        tempoMedioAtendimento: 0,
        respostaEmDia: 0,
        respostaEstourada: 0,
        atendimentoEmDia: 0,
        atendimentoExpirado: 0,
        totalRespMedida: 0,
        totalAtendMedida: 0,
      };
    }

    let somaResp = 0;
    let somaAtend = 0;
    let contResp = 0;
    let contAtend = 0;
    let emDiaResp = 0;
    let estouradaResp = 0;
    let emDiaAtend = 0;
    let expiradoAtend = 0;

    ticketsFiltrados.forEach((ticket) => {
      const minutosResp = horaStringToMinutos(ticket.horas_operador);
      const minutosAtend =
        horaStringToMinutos(ticket.total_horas_atendimento) ||
        horaStringToMinutos(ticket.horas_ticket);

      if (minutosResp > 0) {
        somaResp += minutosResp;
        contResp += 1;
        if (minutosResp <= META_RESPOSTA_MINUTOS) {
          emDiaResp += 1;
        } else {
          estouradaResp += 1;
        }
      }

      if (minutosAtend > 0) {
        somaAtend += minutosAtend;
        contAtend += 1;
        if (minutosAtend <= META_ATENDIMENTO_HORAS * 60) {
          emDiaAtend += 1;
        } else {
          expiradoAtend += 1;
        }
      }
    });

    return {
      tempoMedioResposta: contResp ? somaResp / contResp : 0,
      tempoMedioAtendimento: contAtend ? somaAtend / contAtend : 0,
      respostaEmDia: emDiaResp,
      respostaEstourada: estouradaResp,
      atendimentoEmDia: emDiaAtend,
      atendimentoExpirado: expiradoAtend,
      totalRespMedida: contResp,
      totalAtendMedida: contAtend,
    };
  }, [ticketsFiltrados]);

  const conformidadePercentual =
    slaData && tickets.length
      ? (slaData.emDia / (slaData.emDia + slaData.emRisco + slaData.estourado)) * 100
      : 0;

  const mediaEstimadaNotas = Number(((conformidadePercentual / 100) * 5).toFixed(1));

  const operadoresPorResposta =
    aggregatedData?.operadorMetrics
      .slice()
      .sort((a, b) => b.tempoMedioRespostaMinutos - a.tempoMedioRespostaMinutos) ?? [];

  const operadoresPorAtendimento =
    aggregatedData?.operadorMetrics
      .slice()
      .sort(
        (a, b) => b.tempoMedioAtendimentoMinutos - a.tempoMedioAtendimentoMinutos
      ) ?? [];

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (!value) {
      updateFilters({
        [type === "start" ? "data_inicial" : "data_final"]: undefined,
      });
      return;
    }

    const parsed = parseISO(value);
    if (!isValid(parsed)) return;

    if (type === "start") {
      updateFilters({ data_inicial: format(startOfDay(parsed), "yyyy-MM-dd HH:mm:ss") });
    } else {
      updateFilters({ data_final: format(endOfDay(parsed), "yyyy-MM-dd HH:mm:ss") });
    }
  };

  const dataInicialDateInput = useMemo(
    () => (filters.data_inicial ? parseDateSafely(filters.data_inicial) : null),
    [filters.data_inicial]
  );
  const dataFinalDateInput = useMemo(
    () => (filters.data_final ? parseDateSafely(filters.data_final) : null),
    [filters.data_final]
  );

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

  const kpiCards = [
    {
      titulo: "Tickets Gerais",
      valor: aggregatedData.totalTickets.toLocaleString("pt-BR"),
      detalhe: "",
      icon: <Phone className="h-5 w-5 text-emerald-400" />,
      className: "bg-emerald-500/10 border-emerald-500/40",
    },
    {
      titulo: "Qtd Resposta em Dia",
      valor: tempoMetrics.respostaEmDia.toLocaleString("pt-BR"),
      detalhe: tempoMetrics.totalRespMedida
        ? `${((tempoMetrics.respostaEmDia / tempoMetrics.totalRespMedida) * 100).toFixed(2)}%`
        : "0%",
      icon: <Timer className="h-5 w-5 text-sky-300" />,
      className: "bg-slate-500/10 border-slate-400/40",
    },
    {
      titulo: "Qtd Atendimento em Dia",
      valor: tempoMetrics.atendimentoEmDia.toLocaleString("pt-BR"),
      detalhe: tempoMetrics.totalAtendMedida
        ? `${((tempoMetrics.atendimentoEmDia / tempoMetrics.totalAtendMedida) * 100).toFixed(2)}%`
        : "0%",
      icon: <Clock4 className="h-5 w-5 text-emerald-300" />,
      className: "bg-slate-500/10 border-slate-400/40",
    },
    {
      titulo: "Qtd Resposta Estourada",
      valor: tempoMetrics.respostaEstourada.toLocaleString("pt-BR"),
      detalhe: tempoMetrics.totalRespMedida
        ? `${((tempoMetrics.respostaEstourada / tempoMetrics.totalRespMedida) * 100).toFixed(2)}%`
        : "0%",
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
      className: "bg-red-500/10 border-red-500/40",
    },
    {
      titulo: "Qtd Atendimento Expirado",
      valor: tempoMetrics.atendimentoExpirado.toLocaleString("pt-BR"),
      detalhe: tempoMetrics.totalAtendMedida
        ? `${((tempoMetrics.atendimentoExpirado / tempoMetrics.totalAtendMedida) * 100).toFixed(2)}%`
        : "0%",
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
      className: "bg-red-600/10 border-red-500/50",
    },
  ];

  const renderStars = () => {
    const cheias = Math.floor(mediaEstimadaNotas);
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={cn(
              "h-5 w-5",
              idx < cheias ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Visão Geral"
        subtitulo="Dashboard executivo inspirado no painel compartilhado"
      />

      {/* Filtro de datas */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Data inicial</span>
              <Input
                type="date"
                value={dataInicialDateInput ? format(dataInicialDateInput, "yyyy-MM-dd") : ""}
                onChange={(e) => handleDateChange("start", e.target.value)}
                className="sm:max-w-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Data final</span>
              <Input
                type="date"
                value={dataFinalDateInput ? format(dataFinalDateInput, "yyyy-MM-dd") : ""}
                onChange={(e) => handleDateChange("end", e.target.value)}
                className="sm:max-w-xs"
              />
            </div>
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
        </CardContent>
      </Card>

      {/* Faixa de KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <Card
            key={card.titulo}
            className={cn(
              "rounded-md shadow-sm border bg-gradient-to-br from-background via-background to-background",
              card.className
            )}
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{card.titulo}</span>
                {card.icon}
              </div>
              <div className="text-3xl font-mono font-bold leading-tight">
                {card.valor}
              </div>
              {card.detalhe && (
                <div className="text-sm text-muted-foreground">{card.detalhe}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos de tempo médio + notas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-foreground/80" />
              Tempo Médio de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Meta: {formatMinutosCompleto(META_RESPOSTA_MINUTOS)} • Atual:{" "}
              {formatMinutosCompleto(tempoMetrics.tempoMedioResposta)}
            </div>
            <div className="space-y-2">
              {operadoresPorResposta.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para operadores.</p>
              )}
              {operadoresPorResposta.slice(0, 8).map((op) => {
                const maxValor = operadoresPorResposta[0]?.tempoMedioRespostaMinutos || 1;
                const value = maxValor ? (op.tempoMedioRespostaMinutos / maxValor) * 100 : 0;
                return (
                  <div key={op.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{op.nome}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatMinutosCompleto(op.tempoMedioRespostaMinutos)}
                      </span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock4 className="h-4 w-4 text-foreground/80" />
              Tempo Médio de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Meta: {formatMinutosCompleto(META_ATENDIMENTO_HORAS * 60)} • Atual:{" "}
              {formatMinutosCompleto(tempoMetrics.tempoMedioAtendimento)}
            </div>
            <div className="space-y-2">
              {operadoresPorAtendimento.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para operadores.</p>
              )}
              {operadoresPorAtendimento.slice(0, 8).map((op) => {
                const maxValor =
                  operadoresPorAtendimento[0]?.tempoMedioAtendimentoMinutos || 1;
                const value = maxValor
                  ? (op.tempoMedioAtendimentoMinutos / maxValor) * 100
                  : 0;
                return (
                  <div key={op.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{op.nome}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatMinutosCompleto(op.tempoMedioAtendimentoMinutos)}
                      </span>
                    </div>
                    <Progress value={value} className="h-2 bg-muted" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-foreground/80" />
              Média das Notas (estimada via conformidade)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono">
                {mediaEstimadaNotas.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
            {renderStars()}
            <p className="text-sm text-muted-foreground">
              Calculado a partir da conformidade de SLA (em dia vs. total).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metas + ranking de operadores */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-emerald-500/10 border-emerald-500/40">
            <CardHeader>
              <CardTitle className="text-emerald-400">META 00:05:00</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-mono font-bold">
                {formatMinutosCompleto(tempoMetrics.tempoMedioResposta)}
              </div>
              <p className="text-sm text-muted-foreground">Tempo médio de abertura</p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border-emerald-500/40">
            <CardHeader>
              <CardTitle className="text-emerald-400">META 04:00:00</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-mono font-bold">
                {formatMinutosCompleto(tempoMetrics.tempoMedioAtendimento)}
              </div>
              <p className="text-sm text-muted-foreground">Tempo médio de solução</p>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Ranking por operador</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Média diária calculada para o período de {periodoDias} dia(s) selecionado(s).
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Quantidade Total</TableHead>
                  <TableHead>Média de Chamados por Dia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregatedData.operadorMetrics.map((op) => {
                  const mediaDiaria =
                    periodoDias > 0
                      ? (op.ticketsResolvidos / periodoDias).toFixed(2)
                      : "0.00";
                  return (
                    <TableRow key={op.nome}>
                      <TableCell className="font-medium">{op.nome}</TableCell>
                      <TableCell>
                        <Avatar className="h-10 w-10 border border-border/80">
                          <AvatarFallback className="bg-muted text-foreground">
                            {op.nome.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {op.ticketsResolvidos}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{mediaDiaria}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
