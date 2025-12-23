import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
    format,
    parseISO,
    isValid,
    startOfDay,
    endOfDay,
    differenceInCalendarDays,
    parse,
} from "date-fns";
import { useFilters } from "@/context/FilterContext";
import { useTicketsData } from "@/hooks/api/useTicketsData";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Wrench, Clock4, Users, BarChart3, Building2 } from "lucide-react";
import type { TicketRaw } from "@shared/schema";

const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

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
        } catch {
            // ignore and try next format
        }
    }
    return null;
};

const formatMinutosCompleto = (minutos: number | null) => {
    if (minutos === null || !Number.isFinite(minutos)) return "--:--:--";
    const totalSeconds = Math.round(minutos * 60);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function ManutencaoPreventiva() {
    const { filters, updateFilters } = useFilters();
    const { data: ticketsResponse, isLoading } = useTicketsData(filters, true);
    const [, setLocation] = useLocation();
    const [analistaFiltro, setAnalistaFiltro] = useState<string | undefined>(undefined);

    // Filtrar apenas tickets de Manutenção Preventiva
    const ticketsManutencao = useMemo(() => {
        const lista = ticketsResponse?.lista ?? [];
        return lista.filter(
            (ticket) => ticket.tipo_chamado?.text === "Manutenção Preventiva"
        );
    }, [ticketsResponse?.lista]);

    // Aplicar filtro de analista
    const ticketsFiltrados = useMemo(() => {
        if (!analistaFiltro) return ticketsManutencao;
        return ticketsManutencao.filter((t) => t.nome === analistaFiltro);
    }, [ticketsManutencao, analistaFiltro]);

    // Período de dias
    const periodoDias = useMemo(() => {
        const start = filters.data_inicial ? parseDateSafely(filters.data_inicial.split(' ')[0]) : null;
        const end = filters.data_final ? parseDateSafely(filters.data_final.split(' ')[0]) : null;
        if (!start || !end || !isValid(start) || !isValid(end)) return 30;
        return Math.max(differenceInCalendarDays(end, start) + 1, 1);
    }, [filters.data_inicial, filters.data_final]);

    // Total de manutenções
    const totalManutencoes = ticketsFiltrados.length;

    // Tempo médio de atendimento
    const tempoMedioAtendimento = useMemo(() => {
        const tempos = ticketsFiltrados
            .map((ticket) => {
                const inicio = parseDateSafely(ticket.data_inicial);
                const fim = parseDateSafely(ticket.data_final) || parseDateSafely(ticket.data_solucao);
                if (!inicio || !fim) return null;
                const diffMs = fim.getTime() - inicio.getTime();
                if (!Number.isFinite(diffMs) || diffMs < 0) return null;
                return diffMs / (1000 * 60);
            })
            .filter((v): v is number => v !== null);

        if (!tempos.length) return 0;
        return tempos.reduce((a, b) => a + b, 0) / tempos.length;
    }, [ticketsFiltrados]);

    // Quantidade por analista
    const qtdPorAnalista = useMemo(() => {
        const map = new Map<string, number>();
        ticketsFiltrados.forEach((ticket) => {
            const nome = ticket.nome || "Sem operador";
            map.set(nome, (map.get(nome) || 0) + 1);
        });
        return Array.from(map.entries())
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total);
    }, [ticketsFiltrados]);

    // Tempo médio por analista
    const tempoPorAnalista = useMemo(() => {
        const map = new Map<string, { totalMinutos: number; count: number }>();

        ticketsFiltrados.forEach((ticket) => {
            const inicio = parseDateSafely(ticket.data_inicial);
            const fim = parseDateSafely(ticket.data_final) || parseDateSafely(ticket.data_solucao);
            if (!inicio || !fim) return;
            const diffMs = fim.getTime() - inicio.getTime();
            if (!Number.isFinite(diffMs) || diffMs < 0) return;
            const minutos = diffMs / (1000 * 60);
            const nome = ticket.nome || "Sem operador";

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
                tempoMedio: data.count ? data.totalMinutos / data.count : 0,
            }))
            .sort((a, b) => b.tempoMedio - a.tempoMedio);
    }, [ticketsFiltrados]);

    // Clientes por operador com contagem
    const clientesPorOperador = useMemo(() => {
        const map = new Map<string, Map<string, number>>();

        ticketsFiltrados.forEach((ticket) => {
            const operador = ticket.nome || "Sem operador";
            const cliente = ticket.nome_fantasia || "Cliente desconhecido";

            if (!map.has(cliente)) {
                map.set(cliente, new Map());
            }
            const clienteMap = map.get(cliente)!;
            clienteMap.set(operador, (clienteMap.get(operador) || 0) + 1);
        });

        const result: { cliente: string; operador: string; contagem: number }[] = [];
        map.forEach((operadorMap, cliente) => {
            operadorMap.forEach((contagem, operador) => {
                result.push({ cliente, operador, contagem });
            });
        });

        return result.sort((a, b) => b.contagem - a.contagem);
    }, [ticketsFiltrados]);

    // Lista de analistas para filtro
    const analistas = useMemo(() => {
        const set = new Set<string>();
        ticketsManutencao.forEach((t) => {
            if (t.nome) set.add(t.nome);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [ticketsManutencao]);

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
            updateFilters({ data_inicial: format(startOfDay(parsed), DATE_FORMAT) });
        } else {
            updateFilters({ data_final: format(endOfDay(parsed), DATE_FORMAT) });
        }
    };

    const dataInicialDate = filters.data_inicial ? parseDateSafely(filters.data_inicial) : null;
    const dataFinalDate = filters.data_final ? parseDateSafely(filters.data_final) : null;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    titulo="Manutenção Preventiva"
                    subtitulo="Dashboard de chamados de manutenção preventiva"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    const maxQtd = qtdPorAnalista[0]?.total || 1;
    const maxTempo = tempoPorAnalista[0]?.tempoMedio || 1;

    return (
        <div className="space-y-6">
            {/* Header com estilo vermelho */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3">
                    <Wrench className="h-8 w-8" />
                    <div>
                        <h1 className="text-2xl font-bold">Manutenção Preventiva</h1>
                        <p className="text-red-100 text-sm">
                            Dashboard de chamados de manutenção preventiva
                        </p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <Card className="border-dashed">
                <CardContent className="flex flex-wrap gap-4 py-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Data Inicial
                        </label>
                        <Input
                            type="date"
                            value={dataInicialDate ? format(dataInicialDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDateChange("start", e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Data Final
                        </label>
                        <Input
                            type="date"
                            value={dataFinalDate ? format(dataFinalDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDateChange("end", e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Analista
                        </label>
                        <Select
                            value={analistaFiltro || "todos"}
                            onValueChange={(v) => setAnalistaFiltro(v === "todos" ? undefined : v)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                {analistas.map((a) => (
                                    <SelectItem key={a} value={a}>
                                        {a}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setAnalistaFiltro(undefined);
                                updateFilters({ data_inicial: undefined, data_final: undefined });
                            }}
                        >
                            Limpar filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Wrench className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total de Manutenções</p>
                                <p className="text-4xl font-bold font-mono">{totalManutencoes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Clock4 className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tempo Médio de Atendimento</p>
                                <p className="text-4xl font-bold font-mono">
                                    {formatMinutosCompleto(tempoMedioAtendimento)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos de barras horizontais */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Quantidade por Analista */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <BarChart3 className="h-5 w-5" />
                            Qtd de Manutenções por Analista
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {qtdPorAnalista.length === 0 && (
                            <p className="text-sm text-muted-foreground">Sem dados para o período.</p>
                        )}
                        {qtdPorAnalista.slice(0, 10).map((op) => {
                            const value = (op.total / maxQtd) * 100;
                            return (
                                <TooltipProvider key={op.nome} delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="space-y-1 cursor-pointer"
                                                onClick={() => {
                                                    updateFilters({ analista: op.nome });
                                                    setLocation("/operacional");
                                                }}
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{op.nome}</span>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {op.total}
                                                    </span>
                                                </div>
                                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300"
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-semibold">{op.nome}</p>
                                            <p>Manutenções: {op.total}</p>
                                            <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Tempo Médio por Analista */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <Clock4 className="h-5 w-5" />
                            Tempo Médio por Analista
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tempoPorAnalista.length === 0 && (
                            <p className="text-sm text-muted-foreground">Sem dados para o período.</p>
                        )}
                        {tempoPorAnalista.slice(0, 10).map((op) => {
                            const value = (op.tempoMedio / maxTempo) * 100;
                            return (
                                <TooltipProvider key={op.nome} delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="space-y-1 cursor-pointer"
                                                onClick={() => {
                                                    updateFilters({ analista: op.nome });
                                                    setLocation("/operacional");
                                                }}
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{op.nome}</span>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {formatMinutosCompleto(op.tempoMedio)}
                                                    </span>
                                                </div>
                                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-semibold">{op.nome}</p>
                                            <p>Tempo médio: {formatMinutosCompleto(op.tempoMedio)}</p>
                                            <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de clientes por operador */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-red-500" />
                        Clientes por Operador
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>
                            Manutenções preventivas agrupadas por cliente e operador no período de{" "}
                            {periodoDias} dia(s).
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome Fantasia do Cliente</TableHead>
                                <TableHead>Nome do Operador</TableHead>
                                <TableHead className="text-center">Contagem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clientesPorOperador.slice(0, 20).map((item, idx) => (
                                <TableRow key={`${item.cliente}-${item.operador}-${idx}`}>
                                    <TableCell className="font-medium">{item.cliente}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-sm">
                                            {item.operador}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center font-mono font-bold">
                                        {item.contagem}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {clientesPorOperador.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        Nenhum dado encontrado para o período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
