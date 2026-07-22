import { useMemo, useState, useEffect } from "react";
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
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Timer, User, Building2, FileText, Download, Loader2, PartyPopper, TrendingUp, Flame, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const META_RESPOSTA_MINUTOS = 5;
const META_ATENDIMENTO_HORAS = 4;
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
            // ignore
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

// Calcula a porcentagem excedida da meta
const calcularPorcentagemExcedida = (tempoMinutos: number, metaMinutos: number): number => {
    return Math.round((tempoMinutos / metaMinutos) * 100);
};

// Retorna cor baseada no quanto excedeu a meta
const getExceededColor = (porcentagem: number): { bg: string; text: string; bar: string } => {
    if (porcentagem <= 150) return { bg: "bg-amber-500/20", text: "text-amber-600", bar: "bg-amber-500" };
    if (porcentagem <= 300) return { bg: "bg-orange-500/20", text: "text-orange-600", bar: "bg-orange-500" };
    return { bg: "bg-red-500/20", text: "text-red-600", bar: "bg-red-500" };
};

function PaginationFooter({
    page,
    pageSize,
    total,
    onPageChange,
}: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const lastItem = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-400">
                Exibindo <span className="font-medium text-slate-200">{firstItem}–{lastItem}</span> de {total} registros
            </p>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
                        <ChevronLeft aria-hidden="true" />
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <span className="min-w-16 text-center text-xs text-slate-400">{page} de {totalPages}</span>
                    <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Próxima página">
                        <span className="hidden sm:inline">Próxima</span>
                        <ChevronRight aria-hidden="true" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function RegistrosExpirados() {
    const { filters, updateFilters } = useFilters();
    const [, setLocation] = useLocation();
    const [analistaFiltro, setAnalistaFiltro] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<"resposta" | "atendimento">("resposta");
    const [isExporting, setIsExporting] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    // Interface para dados do relatório de tickets (com campos SLA)
    interface TicketDetalhado {
        ticket: string;
        data_criacao: string;
        hora_criacao: string;
        tempo_gasto_sla_resposta: string;  // Tempo real SLA resposta
        tempo_gasto_sla_solucao: string;   // Tempo real SLA solução
        status_sla_resposta: string;       // "Em conformidade", "Estourado", etc
        status_sla_solucao: string;        // "Em conformidade", "Estourado", etc
        operador: string;
        nome_fantasia: string;
        tipo_ticket: string;
        contato: string;
        ticket_excluido: string;
    }

    // Estado para tickets detalhados (do CSV com campos SLA)
    const [ticketsDetalhados, setTicketsDetalhados] = useState<TicketDetalhado[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Função para buscar relatório de tickets (endpoint que retorna CSV com campos SLA)
    const fetchRelatorioTickets = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const response = await fetch('/api/proxy/relatorio-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`Não foi possível carregar os registros (${response.status}).`);
            const data = await response.json();
            console.log('📊 Relatório de tickets carregado:', data?.lista?.length, 'registros');
            setTicketsDetalhados(data?.lista || []);
        } catch (e) {
            console.error('Erro ao buscar relatório de tickets:', e);
            setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar os registros expirados.');
        } finally {
            setIsLoading(false);
        }
    };

    // Buscar relatório de tickets ao montar
    useEffect(() => {
        fetchRelatorioTickets();
    }, []);

    // Função para converter HH:MM:SS para minutos
    const horaStringToMinutos = (horaStr: string): number => {
        if (!horaStr || horaStr === 'Não possui') return 0;
        const parts = horaStr.split(':').map(Number);
        if (parts.length >= 2) {
            let mins = parts[0] * 60 + parts[1];
            if (parts.length === 3) mins += parts[2] / 60;
            return mins;
        }
        return 0;
    };

    // Função para parsear data do CSV (formato dd/MM/yyyy)
    const parseDataCSV = (data: string): Date | null => {
        if (!data || data === 'Não possui') return null;
        try {
            const [day, month, year] = data.split('/').map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
            return new Date(year, month - 1, day);
        } catch {
            return null;
        }
    };


    // Ler parâmetro tab da URL para definir a aba inicial
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'resposta' || tab === 'atendimento') {
            setActiveTab(tab);
        }
    }, []);

    // Datas de filtro
    const dataInicialDate = useMemo(
        () => (filters.data_inicial ? parseDateSafely(filters.data_inicial) : null),
        [filters.data_inicial]
    );
    const dataFinalDate = useMemo(
        () => (filters.data_final ? parseDateSafely(filters.data_final) : null),
        [filters.data_final]
    );

    // Tickets filtrados por data e analista (usando dados do CSV com campos SLA)
    const ticketsFiltrados = useMemo(() => {
        if (!ticketsDetalhados.length) return [];

        return ticketsDetalhados.filter((ticket) => {
            // Ignorar tickets excluídos
            if (ticket.ticket_excluido === 'Sim') return false;

            // Filtrar por data
            const dataTicket = parseDataCSV(ticket.data_criacao);
            if (dataInicialDate && dataTicket && dataTicket < startOfDay(dataInicialDate)) return false;
            if (dataFinalDate && dataTicket && dataTicket > endOfDay(dataFinalDate)) return false;

            // Filtrar por analista
            if (analistaFiltro && ticket.operador !== analistaFiltro) return false;

            return true;
        });
    }, [ticketsDetalhados, dataInicialDate, dataFinalDate, analistaFiltro]);

    // ========== NOVA LÓGICA - IGUAL AO POWER BI ==========
    // Respostas Expiradas: Filtrar por status_sla_resposta === "Estourado"
    // Usa tempo_gasto_sla_resposta para mostrar o tempo
    const respostasExpiradas = useMemo(() => {
        return ticketsFiltrados
            .filter((ticket) => {
                // Filtrar por STATUS SLA RESPOSTA = "Estourado" (igual Power BI)
                const status = ticket.status_sla_resposta?.toLowerCase() || '';
                return status.includes('estourado') || status.includes('fora');
            })
            .map((ticket) => {
                // Usar tempo_gasto_sla_resposta para o tempo
                const tempoResposta = horaStringToMinutos(ticket.tempo_gasto_sla_resposta);
                return {
                    ...ticket,
                    codigo: parseInt(ticket.ticket) || 0,
                    nome: ticket.operador,
                    nome_fantasia: ticket.nome_fantasia,
                    tipo_chamado: { text: ticket.tipo_ticket || '-' },
                    data_criacao: ticket.data_criacao,
                    tempoResposta,
                };
            })
            .sort((a, b) => b.tempoResposta - a.tempoResposta);
    }, [ticketsFiltrados]);

    // Atendimentos Expirados: Filtrar por status_sla_solucao === "Estourado"
    // Usa tempo_gasto_sla_solucao para mostrar o tempo
    const atendimentosExpirados = useMemo(() => {
        return ticketsFiltrados
            .filter((ticket) => {
                // Filtrar por STATUS SLA SOLUÇÃO = "Estourado" (igual Power BI)
                const status = ticket.status_sla_solucao?.toLowerCase() || '';
                return status.includes('estourado') || status.includes('fora');
            })
            .map((ticket) => {
                // Usar tempo_gasto_sla_solucao para o tempo
                const tempoAtendimento = horaStringToMinutos(ticket.tempo_gasto_sla_solucao);
                return {
                    ...ticket,
                    codigo: parseInt(ticket.ticket) || 0,
                    nome: ticket.operador,
                    nome_fantasia: ticket.nome_fantasia,
                    tipo_chamado: { text: ticket.tipo_ticket || '-' },
                    data_criacao: ticket.data_criacao,
                    tempoAtendimento,
                };
            })
            .sort((a, b) => b.tempoAtendimento - a.tempoAtendimento);
    }, [ticketsFiltrados]);

    console.log('📊 Registros Expirados:', {
        totalTickets: ticketsDetalhados.length,
        filtrados: ticketsFiltrados.length,
        respostasEstouradas: respostasExpiradas.length,
        atendimentosEstourados: atendimentosExpirados.length,
    });

    // Lista de analistas para filtro (usando dados do CSV)
    const analistas = useMemo(() => {
        const set = new Set<string>();
        ticketsDetalhados.forEach((t) => {
            if (t.operador) set.add(t.operador);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [ticketsDetalhados]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, pageSize, analistaFiltro, filters.data_inicial, filters.data_final]);

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

    // Função para exportar PDF
    const exportToPDF = async () => {
        setIsExporting(true);
        toast({
            title: "Gerando Relatório PDF...",
            description: "Aguarde enquanto o relatório é criado.",
        });

        try {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;

            // Dados da tab atual
            const isResposta = activeTab === "resposta";
            const dados = isResposta ? respostasExpiradas : atendimentosExpirados;
            const titulo = isResposta ? "Tempo de Resposta Expirado" : "Tempo de Atendimento Expirado";
            const meta = isResposta ? "Meta: 00:05:00" : "Meta: 04:00:00";
            const cor = isResposta ? [245, 158, 11] : [239, 68, 68]; // amber / red

            // HEADER CINZA
            pdf.setFillColor(51, 65, 85);
            pdf.rect(0, 0, pageWidth, 35, 'F');

            // Logo (opcional)
            try {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                logoImg.src = '/Icone_Logo.png';
                await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve; });
                if (logoImg.complete && logoImg.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = logoImg.naturalWidth;
                    canvas.height = logoImg.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(logoImg, 0, 0);
                    const logoData = canvas.toDataURL('image/png');
                    pdf.addImage(logoData, 'PNG', margin, 5, 25, 25);
                }
            } catch (e) { /* logo opcional */ }

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Registros Expirados - ${titulo}`, margin + 30, 16);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(meta, margin + 30, 24);
            pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin - 55, 20);

            let y = 45;

            // KPIs
            pdf.setFillColor(cor[0], cor[1], cor[2]);
            pdf.roundedRect(margin, y, 60, 20, 2, 2, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(String(dados.length), margin + 30, y + 10, { align: 'center' });
            pdf.setFontSize(8);
            pdf.text(isResposta ? 'Resp. Expiradas' : 'Atend. Expirados', margin + 30, y + 16, { align: 'center' });

            // Box de período (verde com texto preto)
            const periodoBox = dataInicialDate && dataFinalDate
                ? `${format(dataInicialDate, 'dd/MM/yyyy')} a ${format(dataFinalDate, 'dd/MM/yyyy')}`
                : 'Últimos 30 dias';
            pdf.setFillColor(34, 197, 94); // green-500
            pdf.roundedRect(pageWidth - margin - 80, y, 80, 20, 2, 2, 'F');
            pdf.setTextColor(0, 0, 0); // preto
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PERÍODO', pageWidth - margin - 40, y + 7, { align: 'center' });
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(periodoBox, pageWidth - margin - 40, y + 14, { align: 'center' });

            y += 30;

            // TABELA
            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text(titulo, margin, y);
            y += 6;

            // Header da tabela
            pdf.setFillColor(241, 245, 249);
            pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
            pdf.setTextColor(71, 85, 105);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Ticket', margin + 3, y + 5.5);
            pdf.text('Operador', margin + 28, y + 5.5);
            pdf.text('Cliente', margin + 70, y + 5.5);
            pdf.text('Contato', margin + 130, y + 5.5);
            pdf.text('Tipo', margin + 180, y + 5.5);
            pdf.text('Tempo', margin + 230, y + 5.5);
            y += 8;

            // Linhas da tabela (max 25 por página)
            const maxRows = 25;
            dados.slice(0, maxRows).forEach((ticket, i) => {
                const bg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
                pdf.setFillColor(bg[0], bg[1], bg[2]);
                pdf.rect(margin, y, pageWidth - margin * 2, 6, 'F');

                pdf.setTextColor(30, 41, 59);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.text(String(ticket.codigo || ''), margin + 3, y + 4.5);
                pdf.text((ticket.nome || '').substring(0, 15), margin + 28, y + 4.5);
                pdf.text((ticket.nome_fantasia || '').substring(0, 30), margin + 70, y + 4.5);
                pdf.text((ticket.contato || '-').substring(0, 25), margin + 130, y + 4.5);
                pdf.text((ticket.tipo_chamado?.text || '-').substring(0, 20), margin + 180, y + 4.5);

                pdf.setTextColor(cor[0], cor[1], cor[2]);
                pdf.setFont('helvetica', 'bold');
                const tempo = isResposta ? (ticket as any).tempoResposta : (ticket as any).tempoAtendimento;
                pdf.text(formatMinutosCompleto(tempo), margin + 230, y + 4.5);

                y += 6;
            });

            if (dados.length > maxRows) {
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(7);
                pdf.text(`... e mais ${dados.length - maxRows} registros`, margin, y + 4);
            }

            // FOOTER
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(8);
            pdf.text('Polo Telecom - Business Intelligence', margin, pageHeight - 6);
            pdf.text('Página 1', pageWidth - margin - 20, pageHeight - 6);

            const tipoRelatorio = isResposta ? 'resposta-expirada' : 'atendimento-expirado';
            pdf.save(`relatorio-${tipoRelatorio}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);

            toast({ title: "Relatório exportado!", description: "PDF salvo com sucesso." });
        } catch (error) {
            console.error('Erro:', error);
            toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    titulo="Registros Expirados"
                    subtitulo="Visualize chamados com tempo de resposta ou atendimento expirado"
                />
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-6">
                <PageHeader
                    titulo="Registros Expirados"
                    subtitulo="Chamados com tempo de resposta ou atendimento fora do SLA"
                />
                <Card className="border-destructive/25 bg-destructive/[0.04]">
                    <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                            <AlertTriangle aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold">Não foi possível carregar os registros</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
                        </div>
                        <Button variant="outline" onClick={fetchRelatorioTickets}>
                            <RefreshCw aria-hidden="true" />
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
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <PageHeader
                        titulo="Registros Expirados"
                        subtitulo="Chamados com tempo de resposta ou atendimento fora do SLA"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="h-9 w-full gap-2 sm:w-auto"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Exportando...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Exportar PDF
                            </>
                        )}
                    </Button>
                </div>
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
                    {/* KPI Resposta Expirada */}
                    <Card className="glass glow-amber min-w-0 overflow-hidden rounded-2xl border-0 transition-all duration-300 hover-lift animate-fade-in">
                        <CardContent className="py-5 px-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-2 ring-amber-500/30 pulse-ring">
                                    <Timer className="h-6 w-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-4xl font-bold font-mono text-amber-400 number-highlight">{respostasExpiradas.length}</p>
                                    <p className="text-xs font-medium text-slate-400 mt-1">Respostas Expiradas</p>
                                    <p className="text-[10px] text-amber-500/80 font-medium">Meta: 5 min</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* KPI Atendimento Expirado */}
                    <Card className="glass glow-red min-w-0 overflow-hidden rounded-2xl border-0 transition-all duration-300 hover-lift animate-fade-in-delay-1">
                        <CardContent className="py-5 px-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 ring-2 ring-red-500/30 pulse-ring">
                                    <Clock className="h-6 w-6 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-4xl font-bold font-mono text-red-400 number-highlight">{atendimentosExpirados.length}</p>
                                    <p className="text-xs font-medium text-slate-400 mt-1">Atendimentos Expirados</p>
                                    <p className="text-[10px] text-red-500/80 font-medium">Meta: 4 horas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filtros */}
            <Card className="glass-subtle border-0 rounded-2xl">
                <CardContent className="flex flex-wrap gap-4 py-5 px-6">
                    <div className="w-full space-y-1.5 sm:w-auto">
                        <label htmlFor="expired-start-date" className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Data Inicial
                        </label>
                        <Input
                            id="expired-start-date"
                            type="date"
                            value={dataInicialDate ? format(dataInicialDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDateChange("start", e.target.value)}
                            className="w-full bg-white/5 border-white/10 focus:border-blue-500/50 sm:w-40"
                        />
                    </div>
                    <div className="w-full space-y-1.5 sm:w-auto">
                        <label htmlFor="expired-end-date" className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Data Final
                        </label>
                        <Input
                            id="expired-end-date"
                            type="date"
                            value={dataFinalDate ? format(dataFinalDate, "yyyy-MM-dd") : ""}
                            onChange={(e) => handleDateChange("end", e.target.value)}
                            className="w-full bg-white/5 border-white/10 focus:border-blue-500/50 sm:w-40"
                        />
                    </div>
                    <div className="w-full space-y-1.5 sm:w-auto">
                        <label htmlFor="expired-analyst" className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Analista
                        </label>
                        <Select
                            value={analistaFiltro || "todos"}
                            onValueChange={(v) => setAnalistaFiltro(v === "todos" ? undefined : v)}
                        >
                            <SelectTrigger id="expired-analyst" className="w-full bg-white/5 border-white/10 sm:w-40">
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
                            }}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            Limpar filtros
                        </Button>
                    </div>
                    {/* Seletor de quantidade por página */}
                    <div className="flex w-full items-end sm:ml-auto sm:w-auto">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">Exibir:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => setPageSize(Number(v))}
                            >
                                <SelectTrigger aria-label="Quantidade de registros por página" className="w-20 bg-white/5 border-white/10">
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
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "resposta" | "atendimento")}>
                <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl bg-white/5 p-1">
                    <TabsTrigger value="resposta" className="min-w-0 gap-1.5 rounded-lg text-[11px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white sm:gap-2 sm:text-sm">
                        <Timer className="h-4 w-4" />
                        <span>Resposta<span className="hidden sm:inline"> Expirada</span></span>
                        <Badge variant="secondary" className="ml-1 hidden bg-white/20 sm:inline-flex">{respostasExpiradas.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="atendimento" className="min-w-0 gap-1.5 rounded-lg text-[11px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white sm:gap-2 sm:text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Atendimento<span className="hidden sm:inline"> Expirado</span></span>
                        <Badge variant="secondary" className="ml-1 hidden bg-white/20 sm:inline-flex">{atendimentosExpirados.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Resposta Expirada */}
                <TabsContent value="resposta" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
                    <Card className="glass glow-amber border-0 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-b border-amber-500/20 px-6 py-4">
                            <CardTitle className="flex items-center gap-3 text-amber-400">
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                Tempo de Resposta Expirado
                                <span className="text-sm font-normal text-slate-400 ml-2">
                                    (Meta: 00:05:00)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-xl overflow-hidden">
                                <Table>
                                    <TableCaption className="pb-4 text-slate-500">
                                        Chamados com tempo de resposta superior a 5 minutos
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow className="bg-white/5 border-b border-white/10 hover:bg-white/5">
                                            <TableHead className="w-[100px] text-slate-300 font-semibold">Ticket</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Operador</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Cliente</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Tipo</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Data</TableHead>
                                            <TableHead className="w-[120px] text-slate-300 font-semibold">Excedeu</TableHead>
                                            <TableHead className="text-right text-slate-300 font-semibold">Tempo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {respostasExpiradas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-16">
                                                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                        <div className="p-4 rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
                                                            <PartyPopper className="h-8 w-8 text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-semibold text-emerald-400">Parabéns! 🎉</p>
                                                            <p className="text-sm text-slate-400">Nenhuma resposta expirada no período selecionado</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            respostasExpiradas.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((ticket, idx) => {
                                                const porcentagem = calcularPorcentagemExcedida(ticket.tempoResposta, META_RESPOSTA_MINUTOS);
                                                const cores = getExceededColor(porcentagem);
                                                const barWidth = Math.min(porcentagem, 500) / 5; // max 100%
                                                return (
                                                    <TableRow
                                                        key={`${ticket.codigo}-${idx}`}
                                                        className={cn(
                                                            "cursor-pointer transition-all duration-200 border-b border-white/5",
                                                            "hover:bg-amber-500/10",
                                                            idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                                                        )}
                                                        onClick={() => {
                                                            updateFilters({ analista: ticket.nome });
                                                            setLocation("/operacional");
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter" || event.key === " ") {
                                                                event.preventDefault();
                                                                updateFilters({ analista: ticket.nome });
                                                                setLocation("/operacional");
                                                            }
                                                        }}
                                                        tabIndex={0}
                                                    >
                                                        <TableCell className="font-mono font-bold text-amber-400">{ticket.codigo}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-amber-400 text-xs font-bold ring-1 ring-amber-500/30">
                                                                    {ticket.nome?.slice(0, 2).toUpperCase() || "??"}
                                                                </div>
                                                                <span className="truncate max-w-[120px] text-slate-300">{ticket.nome}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate text-slate-400">{ticket.nome_fantasia}</TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-white/10 text-slate-300 border-0 text-xs">{ticket.tipo_chamado?.text || "-"}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-slate-500">
                                                            {ticket.data_criacao ? format(parseDateSafely(ticket.data_criacao) || new Date(), "dd/MM/yyyy HH:mm") : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full rounded-full transition-all duration-500", cores.bar)}
                                                                    style={{ width: `${barWidth}%` }}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className={cn("text-right font-mono font-bold", cores.text)}>
                                                            {formatMinutosCompleto(ticket.tempoResposta)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <PaginationFooter
                            page={currentPage}
                            pageSize={pageSize}
                            total={respostasExpiradas.length}
                            onPageChange={setCurrentPage}
                        />
                    </Card>
                </TabsContent>

                {/* Tab: Atendimento Expirado */}
                <TabsContent value="atendimento" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
                    <Card className="glass glow-red border-0 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-red-500/20 to-rose-500/10 border-b border-red-500/20 px-6 py-4">
                            <CardTitle className="flex items-center gap-3 text-red-400">
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                Tempo de Atendimento Expirado
                                <span className="text-sm font-normal text-slate-400 ml-2">
                                    (Meta: 04:00:00)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-xl overflow-hidden">
                                <Table>
                                    <TableCaption className="pb-4 text-slate-500">
                                        Chamados com tempo de atendimento superior a 4 horas
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow className="bg-white/5 border-b border-white/10 hover:bg-white/5">
                                            <TableHead className="w-[100px] text-slate-300 font-semibold">Ticket</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Operador</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Tipo</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Cliente</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Data</TableHead>
                                            <TableHead className="w-[120px] text-slate-300 font-semibold">Excedeu</TableHead>
                                            <TableHead className="text-right text-slate-300 font-semibold">Tempo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {atendimentosExpirados.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-16">
                                                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                        <div className="p-4 rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
                                                            <PartyPopper className="h-8 w-8 text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-semibold text-emerald-400">Parabéns! 🎉</p>
                                                            <p className="text-sm text-slate-400">Nenhum atendimento expirado no período selecionado</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            atendimentosExpirados.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((ticket, idx) => {
                                                const metaMinutos = META_ATENDIMENTO_HORAS * 60;
                                                const porcentagem = calcularPorcentagemExcedida(ticket.tempoAtendimento, metaMinutos);
                                                const cores = getExceededColor(porcentagem);
                                                const barWidth = Math.min(porcentagem, 500) / 5; // max 100%
                                                return (
                                                    <TableRow
                                                        key={`${ticket.codigo}-${idx}`}
                                                        className={cn(
                                                            "cursor-pointer transition-all duration-200 border-b border-white/5",
                                                            "hover:bg-red-500/10",
                                                            idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                                                        )}
                                                        onClick={() => {
                                                            updateFilters({ analista: ticket.nome });
                                                            setLocation("/operacional");
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter" || event.key === " ") {
                                                                event.preventDefault();
                                                                updateFilters({ analista: ticket.nome });
                                                                setLocation("/operacional");
                                                            }
                                                        }}
                                                        tabIndex={0}
                                                    >
                                                        <TableCell className="font-mono font-bold text-red-400">{ticket.codigo}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/30 to-rose-500/30 flex items-center justify-center text-red-400 text-xs font-bold ring-1 ring-red-500/30">
                                                                    {ticket.nome?.slice(0, 2).toUpperCase() || "??"}
                                                                </div>
                                                                <span className="truncate max-w-[120px] text-slate-300">{ticket.nome}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-white/10 text-slate-300 border-0 text-xs">{ticket.tipo_chamado?.text || "-"}</Badge>
                                                        </TableCell>
                                                        <TableCell className="max-w-[150px] truncate text-slate-400">{ticket.nome_fantasia}</TableCell>
                                                        <TableCell className="text-xs text-slate-500">
                                                            {ticket.data_criacao ? format(parseDateSafely(ticket.data_criacao) || new Date(), "dd/MM/yyyy HH:mm") : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full rounded-full transition-all duration-500", cores.bar)}
                                                                    style={{ width: `${barWidth}%` }}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className={cn("text-right font-mono font-bold", cores.text)}>
                                                            {formatMinutosCompleto(ticket.tempoAtendimento)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <PaginationFooter
                            page={currentPage}
                            pageSize={pageSize}
                            total={atendimentosExpirados.length}
                            onPageChange={setCurrentPage}
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
