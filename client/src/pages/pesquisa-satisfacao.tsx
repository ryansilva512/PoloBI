import { useEffect, useMemo, useState } from "react";
import { format, parseISO, isValid, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useFilters } from "@/context/FilterContext";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    isSatisfactionEvaluationWithinRange,
    parseSatisfactionEvaluationDate,
} from "@/services/satisfactionSurveyClassifier";
import {
    Star,
    Send,
    MessageSquare,
    Percent,
    TrendingUp,
    User,
    Building2,
    Calendar,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from "lucide-react";

interface PesquisaItem {
    data_criacao: string;
    contato: string;
    descricao_avaliacao: string;
    nota: string;
    data_avaliacao: string;
    ticket: string;
    razao_social: string;
    categoria: string;
    operador: string;
    ticket_excluido: string;
}

const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

const parseDateSafely = (value?: string | null) => {
    if (!value) return null;
    try {
        // Tenta formatos comuns
        const parsed = parseISO(value);
        if (isValid(parsed)) return parsed;

        // Tenta formato dd/MM/yyyy
        const parts = value.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (isValid(date)) return date;
        }
    } catch {
        // ignore
    }
    return null;
};

// Hook para buscar dados de pesquisa
function usePesquisasData(dataInicial?: string, dataFinal?: string) {
    return useQuery({
        queryKey: ["pesquisas", dataInicial, dataFinal],
        queryFn: async () => {
            const response = await fetch("/api/proxy/pesquisas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data_inicial: dataInicial,
                    data_final: dataFinal,
                }),
            });
            if (!response.ok) throw new Error("Erro ao buscar pesquisas");
            return response.json();
        },
        refetchInterval: 60000, // Atualiza a cada 60 segundos
        staleTime: 30000,
    });
}

// Componente de estrelas
function StarRating({ rating }: { rating: number }) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={cn(
                        "h-4 w-4",
                        i <= fullStars
                            ? "fill-yellow-400 text-yellow-400"
                            : i === fullStars + 1 && hasHalf
                                ? "fill-yellow-400/50 text-yellow-400"
                                : "text-muted-foreground/30"
                    )}
                />
            ))}
            <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
        </div>
    );
}

export default function PesquisaSatisfacao() {
    const { filters, updateFilters } = useFilters();
    const { data: pesquisasResponse, isLoading, isError, error, refetch, isFetching } = usePesquisasData(
        filters.data_inicial,
        filters.data_final,
    );
    const [analistaFiltro, setAnalistaFiltro] = useState<string | undefined>(undefined);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const pesquisas: PesquisaItem[] = pesquisasResponse?.lista ?? [];

    // Datas de filtro
    const dataInicialDate = useMemo(
        () => (filters.data_inicial ? parseDateSafely(filters.data_inicial) : startOfMonth(new Date())),
        [filters.data_inicial]
    );
    const dataFinalDate = useMemo(
        () => (filters.data_final ? parseDateSafely(filters.data_final) : new Date()),
        [filters.data_final]
    );

    // Mantém os KPIs de envio e taxa de resposta vinculados à coorte de
    // pesquisas criada no período selecionado.
    const pesquisasFiltradas = useMemo(() => {
        if (!pesquisas.length) return [];

        return pesquisas.filter((p) => {
            // Remover tickets excluídos
            if (p.ticket_excluido === 'Sim') return false;

            const dataPesquisa = parseDateSafely(p.data_criacao);
            if (dataInicialDate && dataPesquisa && dataPesquisa < startOfDay(dataInicialDate)) return false;
            if (dataFinalDate && dataPesquisa && dataPesquisa > endOfDay(dataFinalDate)) return false;
            if (analistaFiltro && p.operador !== analistaFiltro) return false;
            return true;
        });
    }, [pesquisas, dataInicialDate, dataFinalDate, analistaFiltro]);

    // Tabela e rankings representam avaliações recebidas no período, portanto
    // usam a data da resposta do cliente, não a criação do chamado.
    const avaliacoesFiltradas = useMemo(() => {
        if (!pesquisas.length) return [];

        return pesquisas.filter((p) => {
            if (p.ticket_excluido === 'Sim') return false;
            if (!isSatisfactionEvaluationWithinRange(
                p,
                dataInicialDate ? startOfDay(dataInicialDate) : null,
                dataFinalDate ? endOfDay(dataFinalDate) : null,
            )) return false;
            if (analistaFiltro && p.operador !== analistaFiltro) return false;
            return true;
        });
    }, [pesquisas, dataInicialDate, dataFinalDate, analistaFiltro]);

    // Métricas
    const metricas = useMemo(() => {
        const enviadas = pesquisasFiltradas.length;
        // Respondidas agora considera quem deu nota (pedido do usuário)
        const comNota = pesquisasFiltradas.filter(p => p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')))).length;
        const respondidas = comNota;

        // A média acompanha as avaliações efetivamente recebidas no período.
        const notas = avaliacoesFiltradas
            .map(p => parseFloat(p.nota?.replace(',', '.') || '0'))
            .filter(n => !isNaN(n) && n > 0);
        const mediaNotas = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
        const percentualRespondidas = enviadas > 0 ? (respondidas / enviadas) * 100 : 0;

        return {
            enviadas,
            respondidas,
            comNota,
            mediaNotas,
            percentualRespondidas
        };
    }, [pesquisasFiltradas, avaliacoesFiltradas]);

    // Pesquisas filtradas para a tabela (apenas respondidas)
    const pesquisasTabela = useMemo(() => {
        return avaliacoesFiltradas.filter(p => {
            const temNota = p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')));
            const temDescricao = p.descricao_avaliacao &&
                p.descricao_avaliacao.trim() !== '' &&
                p.descricao_avaliacao !== 'Não possui' &&
                p.descricao_avaliacao !== 'Sem resposta';
            return temNota || temDescricao;
        });
    }, [avaliacoesFiltradas]);

    // Ranking por quantidade de pesquisas avaliadas (com nota)
    const rankingQuantidade = useMemo(() => {
        const map = new Map<string, number>();
        avaliacoesFiltradas.forEach(p => {
            if (p.operador && p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')))) {
                map.set(p.operador, (map.get(p.operador) || 0) + 1);
            }
        });
        return Array.from(map.entries())
            .map(([operador, quantidade]) => ({ operador, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade);
    }, [avaliacoesFiltradas]);

    // Ranking por média de notas
    const rankingMedia = useMemo(() => {
        const map = new Map<string, { soma: number; count: number }>();
        avaliacoesFiltradas.forEach(p => {
            if (p.operador && p.nota) {
                const nota = parseFloat(p.nota.replace(',', '.'));
                if (!isNaN(nota) && nota > 0) {
                    const current = map.get(p.operador) || { soma: 0, count: 0 };
                    map.set(p.operador, { soma: current.soma + nota, count: current.count + 1 });
                }
            }
        });
        return Array.from(map.entries())
            .map(([operador, { soma, count }]) => ({ operador, media: soma / count, count }))
            .filter(r => r.count >= 1)
            .sort((a, b) => b.media - a.media);
    }, [avaliacoesFiltradas]);

    // Lista de analistas para filtro
    const analistas = useMemo(() => {
        const set = new Set<string>();
        pesquisas.forEach((p) => {
            if (p.operador) set.add(p.operador);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [pesquisas]);

    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize, analistaFiltro, filters.data_inicial, filters.data_final, pesquisasTabela.length]);

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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    titulo="Pesquisa de Satisfação"
                    subtitulo="Análise de avaliações e satisfação dos clientes"
                />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader titulo="Pesquisa de Satisfação" subtitulo="Análise de avaliações e satisfação dos clientes" />
                <Card className="border-destructive/25 bg-destructive/[0.04]">
                    <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center">
                        <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold">Não foi possível carregar as pesquisas</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {error instanceof Error ? error.message : "Verifique a conexão e tente novamente."}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={cn(isFetching && "animate-spin")} aria-hidden="true" />
                            Tentar novamente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                titulo="Pesquisa de Satisfação"
                subtitulo="Análise de avaliações e satisfação dos clientes"
            />

            {/* Filtros */}
            <Card className="glass-subtle border-0 rounded-2xl">
                <CardContent className="grid items-end gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,12rem))_auto] sm:px-6">
                    <div className="space-y-1.5">
                        <label htmlFor="survey-start-date" className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Data Inicial
                        </label>
                        <Input
                            id="survey-start-date"
                            type="date"
                            value={dataInicialDate ? format(dataInicialDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDateChange("start", e.target.value)}
                            className="w-full bg-white/5 border-white/10 focus:border-blue-500/50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="survey-end-date" className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Data Final
                        </label>
                        <Input
                            id="survey-end-date"
                            type="date"
                            value={dataFinalDate ? format(dataFinalDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDateChange("end", e.target.value)}
                            className="w-full bg-white/5 border-white/10 focus:border-blue-500/50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="survey-analyst" className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Analista
                        </label>
                        <Select
                            value={analistaFiltro || "todos"}
                            onValueChange={(v) => setAnalistaFiltro(v === "todos" ? undefined : v)}
                        >
                            <SelectTrigger id="survey-analyst" className="w-full bg-white/5 border-white/10">
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAnalistaFiltro(undefined)}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                    >
                        Limpar filtros
                    </Button>
                </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Pesquisas Enviadas */}
                <Card className="glass glow-blue border-0 rounded-2xl overflow-hidden animate-fade-in hover-lift">
                    <CardContent className="py-5 px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 ring-2 ring-blue-500/30">
                                <Send className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-4xl font-bold font-mono text-blue-400 number-highlight">{metricas.enviadas}</p>
                                <p className="text-xs font-medium text-slate-400 mt-1">Pesquisas Enviadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pesquisas Respondidas */}
                <Card className="glass glow-emerald border-0 rounded-2xl overflow-hidden animate-fade-in-delay-1 hover-lift">
                    <CardContent className="py-5 px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 ring-2 ring-emerald-500/30">
                                <MessageSquare className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-4xl font-bold font-mono text-emerald-400 number-highlight">{metricas.respondidas}</p>
                                <p className="text-xs font-medium text-slate-400 mt-1">Pesquisas Respondidas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* % Respondidas */}
                <Card className="glass border-0 rounded-2xl overflow-hidden animate-fade-in-delay-2 hover-lift">
                    <CardContent className="py-5 px-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 ring-2 ring-purple-500/30">
                                        <Percent className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-400">% Respondidas</span>
                                </div>
                                <span className="text-2xl font-bold font-mono text-purple-400">
                                    {metricas.percentualRespondidas.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-400 rounded-full transition-all duration-700"
                                    style={{ width: `${metricas.percentualRespondidas}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Média de Notas */}
                <Card className="glass glow-amber border-0 rounded-2xl overflow-hidden animate-fade-in-delay-3 hover-lift">
                    <CardContent className="py-5 px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 ring-2 ring-yellow-500/30 pulse-ring">
                                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold font-mono text-yellow-400">{metricas.mediaNotas.toFixed(1)}</span>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "h-4 w-4",
                                                    i <= Math.round(metricas.mediaNotas)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-slate-600"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-400 mt-1">Média das Notas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking por Média de Notas */}
                <Card className="glass glow-amber border-0 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                                <TrendingUp className="h-5 w-5 text-yellow-400" />
                            </div>
                            <span className="font-bold">Média de Notas por Analista</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {rankingMedia.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">Nenhum dado disponível</p>
                        ) : (
                            rankingMedia.slice(0, 8).map((item, idx) => {
                                const maxMedia = 5;
                                const barWidth = (item.media / maxMedia) * 100;
                                return (
                                    <div key={item.operador} className="space-y-2 group">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-200 flex items-center gap-3 text-base">
                                                <span className={cn(
                                                    "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center",
                                                    idx === 0 ? "bg-yellow-500/30 text-yellow-400 ring-2 ring-yellow-500/40" :
                                                        idx === 1 ? "bg-slate-400/20 text-slate-300" :
                                                            idx === 2 ? "bg-amber-600/20 text-amber-400" :
                                                                "bg-slate-600/30 text-slate-400"
                                                )}>{idx + 1}</span>
                                                <span className="truncate max-w-[160px]">{item.operador}</span>
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-sm text-yellow-400 font-bold">{item.media.toFixed(1)}</span>
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((i) => (
                                                        <Star
                                                            key={i}
                                                            className={cn(
                                                                "h-3 w-3",
                                                                i <= Math.round(item.media)
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-slate-600"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500 group-hover:shadow-lg",
                                                    idx === 0 ? "bg-yellow-500 group-hover:shadow-yellow-500/40" :
                                                        "bg-yellow-500 group-hover:shadow-yellow-500/30"
                                                )}
                                                style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg, #ca8a04, #eab308, #fcd34d)' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Ranking por Quantidade */}
                <Card className="glass glow-blue border-0 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20">
                                <User className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className="font-bold">Pesquisas Avaliadas por Analista</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {rankingQuantidade.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">Nenhum dado disponível</p>
                        ) : (
                            rankingQuantidade.slice(0, 8).map((item, idx) => {
                                const maxQtd = rankingQuantidade[0]?.quantidade || 1;
                                const barWidth = (item.quantidade / maxQtd) * 100;
                                return (
                                    <div key={item.operador} className="space-y-2 group">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-200 flex items-center gap-3 text-base">
                                                <span className={cn(
                                                    "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center",
                                                    idx === 0 ? "bg-blue-500/30 text-blue-400 ring-2 ring-blue-500/40" :
                                                        idx === 1 ? "bg-slate-400/20 text-slate-300" :
                                                            idx === 2 ? "bg-sky-600/20 text-sky-400" :
                                                                "bg-slate-600/30 text-slate-400"
                                                )}>{idx + 1}</span>
                                                <span className="truncate max-w-[160px]">{item.operador}</span>
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                                                {item.quantidade}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500 group-hover:shadow-lg",
                                                    idx === 0 ? "bg-blue-500 group-hover:shadow-blue-500/40" :
                                                        "bg-blue-500 group-hover:shadow-blue-500/30"
                                                )}
                                                style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6, #38bdf8)' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de detalhes */}
            <Card className="glass border-0 rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-col items-stretch justify-between gap-3 px-5 pb-3 sm:flex-row sm:items-center sm:px-6">
                    <CardTitle className="flex min-w-0 flex-wrap items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-slate-600/20">
                            <Calendar className="h-5 w-5 text-slate-400" />
                        </div>
                        <span className="font-bold">Detalhes das Pesquisas</span>
                        <span className="ml-2 px-3 py-1 rounded-full bg-white/10 text-slate-400 text-sm font-medium">
                            {pesquisasTabela.length} registros
                        </span>
                    </CardTitle>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-sm text-slate-400">Exibir:</span>
                        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                            <SelectTrigger aria-label="Quantidade de pesquisas por página" className="w-20 bg-white/5 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-xl overflow-hidden mx-4 mb-4 border border-white/5">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/10">
                                    <TableHead className="text-slate-300 font-semibold w-[100px]">Data</TableHead>
                                    <TableHead className="text-slate-300 font-semibold w-[100px]">Ticket</TableHead>
                                    <TableHead className="text-slate-300 font-semibold">Contato</TableHead>
                                    <TableHead className="text-slate-300 font-semibold">Empresa</TableHead>
                                    <TableHead className="text-slate-300 font-semibold">Descrição</TableHead>
                                    <TableHead className="text-slate-300 font-semibold">Operador</TableHead>
                                    <TableHead className="text-slate-300 font-semibold text-center">Nota</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pesquisasTabela.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-16">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <AlertTriangle className="h-8 w-8 text-slate-500" />
                                                <p className="text-sm text-slate-400">Nenhuma pesquisa encontrada</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pesquisasTabela.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p, idx) => {
                                        const nota = parseFloat(p.nota?.replace(',', '.') || '0');
                                        const dataAvaliacao = parseSatisfactionEvaluationDate(p.data_avaliacao);
                                        return (
                                            <TableRow
                                                key={`${p.ticket}-${idx}`}
                                                className={cn(
                                                    "transition-all border-b border-white/5",
                                                    "hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent",
                                                    idx % 2 === 0 && "bg-white/[0.02]"
                                                )}
                                            >
                                                <TableCell className="text-xs text-slate-400 whitespace-nowrap font-mono">
                                                    {dataAvaliacao ? format(dataAvaliacao, "dd/MM/yyyy HH:mm") : "-"}
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-blue-400">{p.ticket}</TableCell>
                                                <TableCell className="truncate max-w-[120px] text-slate-300">{p.contato || "-"}</TableCell>
                                                <TableCell className="truncate max-w-[150px] text-slate-300">{p.razao_social || "-"}</TableCell>
                                                <TableCell className="max-w-[200px] text-xs">
                                                    {p.descricao_avaliacao && p.descricao_avaliacao !== 'Não possui' ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button type="button" className="block w-full truncate rounded text-left text-slate-300 focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Ler comentário completo: ${p.descricao_avaliacao}`}>
                                                                        {p.descricao_avaliacao}
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-[400px] whitespace-pre-wrap bg-slate-900 border-slate-700">
                                                                    <p>{p.descricao_avaliacao}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <span className="text-slate-500">Sem resposta</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="truncate max-w-[100px] text-slate-300 font-medium">{p.operador || "-"}</TableCell>
                                                <TableCell className="text-center">
                                                    {nota > 0 ? (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg",
                                                                nota >= 4 ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30" :
                                                                    nota >= 3 ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 shadow-yellow-500/30" :
                                                                        "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/30"
                                                            )}>
                                                                <Star className="h-3 w-3 fill-current" />
                                                                {nota.toFixed(0)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-slate-400">
                        Exibindo {pesquisasTabela.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, pesquisasTabela.length)} de {pesquisasTabela.length}
                    </p>
                    {Math.ceil(pesquisasTabela.length / pageSize) > 1 && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Página anterior">
                                <ChevronLeft aria-hidden="true" />
                                <span className="hidden sm:inline">Anterior</span>
                            </Button>
                            <span className="min-w-16 text-center text-xs text-slate-400">
                                {currentPage} de {Math.ceil(pesquisasTabela.length / pageSize)}
                            </span>
                            <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => setCurrentPage((page) => Math.min(Math.ceil(pesquisasTabela.length / pageSize), page + 1))} disabled={currentPage >= Math.ceil(pesquisasTabela.length / pageSize)} aria-label="Próxima página">
                                <span className="hidden sm:inline">Próxima</span>
                                <ChevronRight aria-hidden="true" />
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
