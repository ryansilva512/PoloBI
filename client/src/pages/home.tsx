import { useMemo } from "react";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { format, parseISO, isValid, startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
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
  // Conta dias de forma inclusiva (mesmo dia = 1)
  const dias = differenceInCalendarDays(endOfDay(fim), startOfDay(inicio)) + 1;
  return Math.max(dias, 1);
};

export default function Home() {
  const { filters, updateFilters } = useFilters();
  const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);

  const tickets = ticketsResponse?.lista ?? [];

  const dataInicialDate = useMemo(
    () => (filters.data_inicial ? parseDateSafely(filters.data_inicial) : null),
    [filters.data_inicial]
  );
  const dataFinalDate = useMemo(
    () => (filters.data_final ? parseDateSafely(filters.data_final) : null),
    [filters.data_final]
  );

  const ticketsFiltrados = useMemo(() => {
    if (!tickets.length) return [];

    const dedupKey = (ticket: typeof tickets[0]) =>
      ticket.codigo ?? ticket.id ?? `${ticket.id}-${ticket.codigo}`;

    const dentroDoPeriodo = tickets.filter((ticket) => {
      const dataRef = ticket.data_criacao || ticket.data_inicial || ticket.data_final;
      const dataTicket = parseDateSafely(dataRef);
      if (dataInicialDate && dataTicket && dataTicket < dataInicialDate) return false;
      if (dataFinalDate && dataTicket && dataTicket > dataFinalDate) return false;
      return true;
    });

    // Deduplicacao apos o filtro de data para manter apenas chamados do intervalo selecionado.
    // Quando existem multiplos registros do mesmo codigo, mantemos o mais recente.
    const map = new Map<number | string, typeof tickets[0]>();
    dentroDoPeriodo.forEach((t) => {
      const key = dedupKey(t);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
        return;
      }

      const refDate = (ticket: typeof tickets[0]) =>
        parseDateSafely(ticket.data_final) ||
        parseDateSafely(ticket.data_inicial) ||
        parseDateSafely(ticket.data_criacao);

      const newDate = refDate(t)?.getTime() || -Infinity;
      const oldDate = refDate(existing)?.getTime() || -Infinity;

      if (newDate >= oldDate) {
        map.set(key, t);
      }
    });

    return Array.from(map.values());
  }, [tickets, dataInicialDate, dataFinalDate]);

  // Helpers para diffs baseados em datas
  const diffsRespostaMin = useMemo(() => {
    return ticketsFiltrados
      .map((ticket) => {
        const criacao = parseDateSafely(ticket.data_criacao);
        const inicio = parseDateSafely(ticket.data_inicial);
        if (!criacao || !inicio) return null;
        const diffMs = inicio.getTime() - criacao.getTime();
        if (!Number.isFinite(diffMs) || diffMs < 0) return null;
        return diffMs / (1000 * 60);
      })
      .filter((v): v is number => v !== null);
  }, [ticketsFiltrados]);

  const diffsAtendimentoMin = useMemo(() => {
    return ticketsFiltrados
      .map((ticket) => {
        const inicio = parseDateSafely(ticket.data_inicial);
        const fim =
          parseDateSafely(ticket.data_final) ||
          parseDateSafely((ticket as any).data_solucao) ||
          parseDateSafely(ticket.data_final);
        if (!inicio || !fim) return null;
        const diffMs = fim.getTime() - inicio.getTime();
        if (!Number.isFinite(diffMs) || diffMs < 0) return null;
        return diffMs / (1000 * 60);
      })
      .filter((v): v is number => v !== null);
  }, [ticketsFiltrados]);

  const calcularMediaCap = (valores: number[], capMinutos: number) => {
    const filtrados = valores.filter((v) => v <= capMinutos);
    if (!filtrados.length) return { media: 0, considerados: 0, total: valores.length };
    const soma = filtrados.reduce((a, b) => a + b, 0);
    return { media: soma / filtrados.length, considerados: filtrados.length, total: valores.length };
  };

  const aggregatedData = useMemo(() => {
    if (!ticketsFiltrados.length) return null;
    return aggregateTicketData(ticketsFiltrados);
  }, [ticketsFiltrados]);

  const slaData = useMemo(() => {
    if (!ticketsFiltrados.length) return null;
    return calculateSLADistribution(ticketsFiltrados);
  }, [ticketsFiltrados]);

  // Tempo médio de abertura/resposta (data_inicial - data_criacao) com cap de 3h
  const tempoMedioAbertura = useMemo(() => {
    if (!diffsRespostaMin.length) return { minutos: 0, total: 0, considerados: 0 };
    const { media, considerados, total } = calcularMediaCap(diffsRespostaMin, 180); // cap 3h
    return { minutos: media, total, considerados };
  }, [diffsRespostaMin]);

  const tempoRespostaPorOperador = useMemo(() => {
    if (!ticketsFiltrados.length) return [];

    const capMinutos = 180; // cap em 3h para evitar distorÇõÇœes

    const map = new Map<
      string,
      {
        totalMinutos: number;
        count: number;
      }
    >();

    ticketsFiltrados.forEach((ticket) => {
      const criacao = parseDateSafely(ticket.data_criacao);
      const inicio = parseDateSafely(ticket.data_inicial);

      if (!criacao || !inicio) return;

      const diffMs = inicio.getTime() - criacao.getTime();
      if (!Number.isFinite(diffMs) || diffMs < 0) return;

      const minutos = Math.min(diffMs / (1000 * 60), capMinutos);
      const nome = ticket.nome;

      if (!map.has(nome)) {
        map.set(nome, { totalMinutos: 0, count: 0 });
      }

      const data = map.get(nome)!;
      data.totalMinutos += minutos;
      data.count += 1;
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        tempoMedioMinutos: data.count ? data.totalMinutos / data.count : 0,
      }))
      .sort((a, b) => b.tempoMedioMinutos - a.tempoMedioMinutos);
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

    // Resposta (data_inicial - data_criacao)
    const respValid = diffsRespostaMin;
    const respEmDia = respValid.filter((m) => m <= META_RESPOSTA_MINUTOS).length;
    const respEstourada = respValid.filter((m) => m > META_RESPOSTA_MINUTOS).length;
    const respMedia = calcularMediaCap(respValid, 180).media; // cap 3h

    // Atendimento (data_final - data_inicial)
    const atendValid = diffsAtendimentoMin;
    const atendEmDia = atendValid.filter((m) => m <= META_ATENDIMENTO_HORAS * 60).length;
    const atendExpirado = atendValid.filter((m) => m > META_ATENDIMENTO_HORAS * 60).length;
    const atendMedia = calcularMediaCap(atendValid, 480).media; // cap 8h

    return {
      tempoMedioResposta: respMedia,
      tempoMedioAtendimento: atendMedia,
      respostaEmDia: respEmDia,
      respostaEstourada: respEstourada,
      atendimentoEmDia: atendEmDia,
      atendimentoExpirado: atendExpirado,
      totalRespMedida: respValid.length,
      totalAtendMedida: atendValid.length,
    };
  }, [ticketsFiltrados, diffsRespostaMin, diffsAtendimentoMin]);

  const conformidadePercentual =
    slaData && tickets.length
      ? (slaData.emDia / (slaData.emDia + slaData.emRisco + slaData.estourado)) * 100
      : 0;

  const mediaEstimadaNotas = Number(((conformidadePercentual / 100) * 5).toFixed(1));

  const operadoresPorAtendimento = useMemo(() => {
    if (!ticketsFiltrados.length) return [];
    const capMinutos = 480; // cap 8h
    const map = new Map<
      string,
      {
        totalMinutos: number;
        count: number;
      }
    >();

    ticketsFiltrados.forEach((ticket) => {
      const inicio = parseDateSafely(ticket.data_inicial);
      const fim =
        parseDateSafely(ticket.data_final) ||
        parseDateSafely((ticket as any).data_solucao);
      if (!inicio || !fim) return;
      const diffMs = fim.getTime() - inicio.getTime();
      if (!Number.isFinite(diffMs) || diffMs < 0) return;
      const minutos = Math.min(diffMs / (1000 * 60), capMinutos);
      const nome = ticket.nome;

      if (!map.has(nome)) {
        map.set(nome, { totalMinutos: 0, count: 0 });
      }
      const data = map.get(nome)!;
      data.totalMinutos += minutos;
      data.count += 1;
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        tempoMedioAtendimentoMinutos: data.count ? data.totalMinutos / data.count : 0,
      }))
      .sort((a, b) => b.tempoMedioAtendimentoMinutos - a.tempoMedioAtendimentoMinutos);
  }, [ticketsFiltrados]);

  const rankingOperadores = useMemo(() => {
    if (!ticketsFiltrados.length) return [];
    const map = new Map<string, number>();
    ticketsFiltrados.forEach((ticket) => {
      const nome = ticket.nome || "Sem nome";
      map.set(nome, (map.get(nome) || 0) + 1);
    });
    const periodoDias = parseDateRangeDias(filters.data_inicial, filters.data_final);
    return Array.from(map.entries())
      .map(([nome, total]) => ({
        nome,
        total,
        mediaDiaria: periodoDias > 0 ? total / periodoDias : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [ticketsFiltrados, filters.data_inicial, filters.data_final]);

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

  const tempoMedioRespostaGlobal = tempoMedioAbertura.minutos;

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
              {formatMinutosCompleto(tempoMedioRespostaGlobal)}
            </div>
            <div className="space-y-2">
              {tempoRespostaPorOperador.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para operadores.</p>
              )}
              {tempoRespostaPorOperador.slice(0, 8).map((op) => {
                const maxValor = tempoRespostaPorOperador[0]?.tempoMedioMinutos || 1;
                const value = maxValor ? (op.tempoMedioMinutos / maxValor) * 100 : 0;
                return (
                  <div key={op.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{op.nome}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatMinutosCompleto(op.tempoMedioMinutos)}
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
                {formatMinutosCompleto(tempoMedioAbertura.minutos)}
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
                {rankingOperadores.map((op) => {
                  const mediaDiaria =
                    periodoDias > 0 ? op.mediaDiaria.toFixed(2) : "0.00";
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
                        {op.total}
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
