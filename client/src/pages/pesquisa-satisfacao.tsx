import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    Star,
    Send,
    MessageSquare,
    Percent,
    TrendingUp,
    User,
    Building2,
    Calendar,
    AlertTriangle
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
function usePesquisasData() {
    return useQuery({
        queryKey: ["pesquisas"],
        queryFn: async () => {
            const response = await fetch("/api/proxy/pesquisas", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
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
    const { data: pesquisasResponse, isLoading } = usePesquisasData();
    const [analistaFiltro, setAnalistaFiltro] = useState<string | undefined>(undefined);
    const [pageSize, setPageSize] = useState(10);

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

    // Pesquisas filtradas por período
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

    // Métricas
    const metricas = useMemo(() => {
        const enviadas = pesquisasFiltradas.length;
        // Respondidas agora considera quem deu nota (pedido do usuário)
        const comNota = pesquisasFiltradas.filter(p => p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')))).length;
        const respondidas = comNota;

        const notas = pesquisasFiltradas
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
    }, [pesquisasFiltradas]);

    // Pesquisas filtradas para a tabela (apenas respondidas)
    const pesquisasTabela = useMemo(() => {
        return pesquisasFiltradas.filter(p => {
            const temNota = p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')));
            const temDescricao = p.descricao_avaliacao &&
                p.descricao_avaliacao.trim() !== '' &&
                p.descricao_avaliacao !== 'Não possui' &&
                p.descricao_avaliacao !== 'Sem resposta';
            return temNota || temDescricao;
        });
    }, [pesquisasFiltradas]);

    // Ranking por quantidade de pesquisas avaliadas (com nota)
    const rankingQuantidade = useMemo(() => {
        const map = new Map<string, number>();
        pesquisasFiltradas.forEach(p => {
            if (p.operador && p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')))) {
                map.set(p.operador, (map.get(p.operador) || 0) + 1);
            }
        });
        return Array.from(map.entries())
            .map(([operador, quantidade]) => ({ operador, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade);
    }, [pesquisasFiltradas]);

    // Ranking por média de notas
    const rankingMedia = useMemo(() => {
        const map = new Map<string, { soma: number; count: number }>();
        pesquisasFiltradas.forEach(p => {
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
    }, [pesquisasFiltradas]);

    // Lista de analistas para filtro
    const analistas = useMemo(() => {
        const set = new Set<string>();
        pesquisas.forEach((p) => {
            if (p.operador) set.add(p.operador);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [pesquisas]);

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                titulo="Pesquisa de Satisfação"
                subtitulo="Análise de avaliações e satisfação dos clientes"
            />

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
                            onClick={() => setAnalistaFiltro(undefined)}
                        >
                            Limpar filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Pesquisas Enviadas */}
                <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                    <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-500/20 ring-2 ring-blue-500/30">
                                <Send className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold font-mono text-blue-500">{metricas.enviadas}</p>
                                <p className="text-xs font-medium text-muted-foreground">Pesquisas Enviadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pesquisas Respondidas */}
                <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-green-500/20 ring-2 ring-green-500/30">
                                <MessageSquare className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold font-mono text-green-500">{metricas.respondidas}</p>
                                <p className="text-xs font-medium text-muted-foreground">Pesquisas Respondidas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* % Respondidas */}
                <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                    <CardContent className="py-4 px-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-purple-500/20 ring-2 ring-purple-500/30">
                                        <Percent className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">% Respondidas</span>
                                </div>
                                <span className="text-lg font-bold font-mono text-purple-500">
                                    {metricas.percentualRespondidas.toFixed(1)}%
                                </span>
                            </div>
                            <Progress value={metricas.percentualRespondidas} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Média de Notas */}
                <Card className="relative overflow-hidden border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                    <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-yellow-500/20 ring-2 ring-yellow-500/30">
                                <Star className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <StarRating rating={metricas.mediaNotas} />
                                <p className="text-xs font-medium text-muted-foreground mt-1">Média das Notas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking por Média de Notas */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-yellow-500" />
                            Média de Notas por Analista
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {rankingMedia.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                        ) : (
                            rankingMedia.slice(0, 8).map((item, idx) => {
                                const maxMedia = 5;
                                const barWidth = (item.media / maxMedia) * 100;
                                return (
                                    <div key={item.operador} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium truncate max-w-[150px]">{item.operador}</span>
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={item.media} />
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Ranking por Quantidade */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" />
                            Pesquisas Avaliadas por Analista
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {rankingQuantidade.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                        ) : (
                            rankingQuantidade.slice(0, 8).map((item, idx) => {
                                const maxQtd = rankingQuantidade[0]?.quantidade || 1;
                                const barWidth = (item.quantidade / maxQtd) * 100;
                                return (
                                    <div key={item.operador} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium truncate max-w-[150px]">{item.operador}</span>
                                            <Badge variant="secondary" className="font-mono">
                                                {item.quantidade}
                                            </Badge>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base font-semibold">Detalhes das Pesquisas</CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Exibir:</span>
                        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                            <SelectTrigger className="w-20">
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
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[100px]">Data</TableHead>
                                <TableHead className="w-[100px]">Ticket</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Operador</TableHead>
                                <TableHead className="text-center">Nota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pesquisasTabela.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-16">
                                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                                            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Nenhuma pesquisa encontrada</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pesquisasTabela.slice(0, pageSize).map((p, idx) => {
                                    const nota = parseFloat(p.nota?.replace(',', '.') || '0');
                                    const dataCriacao = parseDateSafely(p.data_criacao);
                                    return (
                                        <TableRow
                                            key={`${p.ticket}-${idx}`}
                                            className={cn(idx % 2 === 0 ? "bg-background" : "bg-muted/30")}
                                        >
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {dataCriacao ? format(dataCriacao, "dd/MM/yyyy HH:mm") : "-"}
                                            </TableCell>
                                            <TableCell className="font-mono font-bold">{p.ticket}</TableCell>
                                            <TableCell className="truncate max-w-[120px]">{p.contato || "-"}</TableCell>
                                            <TableCell className="truncate max-w-[150px]">{p.razao_social || "-"}</TableCell>
                                            <TableCell className="truncate max-w-[200px] text-xs">
                                                {p.descricao_avaliacao && p.descricao_avaliacao !== 'Não possui'
                                                    ? p.descricao_avaliacao
                                                    : <span className="text-muted-foreground">Sem resposta</span>}
                                            </TableCell>
                                            <TableCell className="truncate max-w-[100px]">{p.operador || "-"}</TableCell>
                                            <TableCell className="text-center">
                                                {nota > 0 ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Star className={cn(
                                                            "h-4 w-4",
                                                            nota >= 4 ? "fill-green-400 text-green-400" :
                                                                nota >= 3 ? "fill-yellow-400 text-yellow-400" :
                                                                    "fill-red-400 text-red-400"
                                                        )} />
                                                        <span className="font-mono font-bold">{nota.toFixed(0)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
