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
import { AlertTriangle, Clock, Timer, User, Building2, FileText, Download, Loader2, PartyPopper, TrendingUp, Flame } from "lucide-react";
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

export default function RegistrosExpirados() {
    const { filters, updateFilters } = useFilters();
    const [, setLocation] = useLocation();
    const [analistaFiltro, setAnalistaFiltro] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<"resposta" | "atendimento">("resposta");
    const [isExporting, setIsExporting] = useState(false);
    const [pageSize, setPageSize] = useState(10);
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

    // Função para buscar relatório de tickets (endpoint que retorna CSV com campos SLA)
    const fetchRelatorioTickets = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/proxy/relatorio-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                console.error('Erro ao buscar relatório de tickets:', response.status);
                return;
            }
            const data = await response.json();
            console.log('📊 Relatório de tickets carregado:', data?.lista?.length, 'registros');
            setTicketsDetalhados(data?.lista || []);
        } catch (e) {
            console.error('Erro ao buscar relatório de tickets:', e);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <PageHeader
                        titulo="Registros Expirados"
                        subtitulo="Chamados com tempo de resposta ou atendimento fora do SLA"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="h-9 gap-2"
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
                <div className="flex gap-4">
                    {/* KPI Resposta Expirada */}
                    <Card className="relative overflow-hidden border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-500/5 min-w-[180px] transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                        <CardContent className="py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/20 ring-2 ring-amber-500/30">
                                    <Timer className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold font-mono text-amber-500">{respostasExpiradas.length}</p>
                                    <p className="text-xs font-medium text-muted-foreground">Respostas Expiradas</p>
                                    <p className="text-[10px] text-amber-600/80">Meta: 5 min</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* KPI Atendimento Expirado */}
                    <Card className="relative overflow-hidden border-l-4 border-l-red-500 bg-gradient-to-br from-red-500/10 to-red-500/5 min-w-[180px] transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
                        <CardContent className="py-4 px-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-500/20 ring-2 ring-red-500/30">
                                    <Clock className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold font-mono text-red-500">{atendimentosExpirados.length}</p>
                                    <p className="text-xs font-medium text-muted-foreground">Atendimentos Expirados</p>
                                    <p className="text-[10px] text-red-600/80">Meta: 4 horas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                            }}
                        >
                            Limpar filtros
                        </Button>
                    </div>
                    {/* Seletor de quantidade por página */}
                    <div className="flex items-end ml-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Exibir:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => setPageSize(Number(v))}
                            >
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
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "resposta" | "atendimento")}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="resposta" className="gap-2">
                        <Timer className="h-4 w-4" />
                        Resposta Expirada
                        <Badge variant="secondary" className="ml-1">{respostasExpiradas.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="atendimento" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Atendimento Expirado
                        <Badge variant="secondary" className="ml-1">{atendimentosExpirados.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Resposta Expirada */}
                <TabsContent value="resposta" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
                    <Card>
                        <CardHeader className="bg-amber-500/10 border-b border-amber-500/30">
                            <CardTitle className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                                Tempo de Resposta Expirado
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    (Meta: 00:05:00)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableCaption className="pb-4">
                                    Chamados com tempo de resposta superior a 5 minutos
                                </TableCaption>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[100px]">Ticket</TableHead>
                                        <TableHead>Operador</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="w-[120px]">Excedeu</TableHead>
                                        <TableHead className="text-right">Tempo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {respostasExpiradas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-16">
                                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                    <div className="p-4 rounded-full bg-green-500/10 ring-2 ring-green-500/20">
                                                        <PartyPopper className="h-8 w-8 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-semibold text-green-600">Parabéns! 🎉</p>
                                                        <p className="text-sm text-muted-foreground">Nenhuma resposta expirada no período selecionado</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        respostasExpiradas.slice(0, pageSize).map((ticket, idx) => {
                                            const porcentagem = calcularPorcentagemExcedida(ticket.tempoResposta, META_RESPOSTA_MINUTOS);
                                            const cores = getExceededColor(porcentagem);
                                            const barWidth = Math.min(porcentagem, 500) / 5; // max 100%
                                            return (
                                                <TableRow
                                                    key={`${ticket.codigo}-${idx}`}
                                                    className={cn(
                                                        "cursor-pointer transition-all duration-200",
                                                        "hover:bg-amber-500/10 hover:shadow-sm",
                                                        idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                                                    )}
                                                    onClick={() => {
                                                        updateFilters({ analista: ticket.nome });
                                                        setLocation("/operacional");
                                                    }}
                                                >
                                                    <TableCell className="font-mono font-bold">{ticket.codigo}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 text-xs font-bold ring-1 ring-amber-500/30">
                                                                {ticket.nome?.slice(0, 2).toUpperCase() || "??"}
                                                            </div>
                                                            <span className="truncate max-w-[120px]">{ticket.nome}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{ticket.nome_fantasia}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">{ticket.tipo_chamado?.text || "-"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {ticket.data_criacao ? format(parseDateSafely(ticket.data_criacao) || new Date(), "dd/MM/yyyy HH:mm") : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Atendimento Expirado */}
                <TabsContent value="atendimento" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
                    <Card>
                        <CardHeader className="bg-red-500/10 border-b border-red-500/30">
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Tempo de Atendimento Expirado
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    (Meta: 04:00:00)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableCaption className="pb-4">
                                    Chamados com tempo de atendimento superior a 4 horas
                                </TableCaption>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[100px]">Ticket</TableHead>
                                        <TableHead>Operador</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="w-[120px]">Excedeu</TableHead>
                                        <TableHead className="text-right">Tempo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {atendimentosExpirados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-16">
                                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                    <div className="p-4 rounded-full bg-green-500/10 ring-2 ring-green-500/20">
                                                        <PartyPopper className="h-8 w-8 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-semibold text-green-600">Parabéns! 🎉</p>
                                                        <p className="text-sm text-muted-foreground">Nenhum atendimento expirado no período selecionado</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        atendimentosExpirados.slice(0, pageSize).map((ticket, idx) => {
                                            const metaMinutos = META_ATENDIMENTO_HORAS * 60;
                                            const porcentagem = calcularPorcentagemExcedida(ticket.tempoAtendimento, metaMinutos);
                                            const cores = getExceededColor(porcentagem);
                                            const barWidth = Math.min(porcentagem, 500) / 5; // max 100%
                                            return (
                                                <TableRow
                                                    key={`${ticket.codigo}-${idx}`}
                                                    className={cn(
                                                        "cursor-pointer transition-all duration-200",
                                                        "hover:bg-red-500/10 hover:shadow-sm",
                                                        idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                                                    )}
                                                    onClick={() => {
                                                        updateFilters({ analista: ticket.nome });
                                                        setLocation("/operacional");
                                                    }}
                                                >
                                                    <TableCell className="font-mono font-bold">{ticket.codigo}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-600 text-xs font-bold ring-1 ring-red-500/30">
                                                                {ticket.nome?.slice(0, 2).toUpperCase() || "??"}
                                                            </div>
                                                            <span className="truncate max-w-[120px]">{ticket.nome}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">{ticket.tipo_chamado?.text || "-"}</Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate">{ticket.nome_fantasia}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {ticket.data_criacao ? format(parseDateSafely(ticket.data_criacao) || new Date(), "dd/MM/yyyy HH:mm") : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
