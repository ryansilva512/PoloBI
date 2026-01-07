import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  RefreshCw,
  Download,
  Loader2,
  SmilePlus,
  Trophy,
  Medal,
} from "lucide-react";
import jsPDF from "jspdf";
import { newTicketsStore } from "@/stores/newTicketsStore";

const META_RESPOSTA_MINUTOS = 5;
const META_ATENDIMENTO_HORAS = 4;

// Opções de intervalo de atualização automática
const REFRESH_OPTIONS = [
  { label: "30 seg", value: "30000" },
  { label: "2min 30s", value: "150000" },
  { label: "5 min", value: "300000" },
  { label: "10 min", value: "600000" },
  { label: "20 min", value: "1200000" },
  { label: "30 min", value: "1800000" },
];

// Opções de período rápido
const PERIOD_OPTIONS = [
  { label: "Semana até hoje", value: "week_to_date" },
  { label: "Mês até hoje", value: "month_to_date" },
  { label: "Últimos 7 dias", value: "last_7_days" },
  { label: "Últimos 14 dias", value: "last_14_days" },
  { label: "Últimos 30 dias", value: "last_30_days" },
];

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

// Mapas de avatar por nome (coloque as imagens em public/avatars/<arquivo>.png)
const avatarMap: Record<string, string> = {
  moraes: "/avatars/Moraes.png",
  victor: "/avatars/Victor.png",
  abraao: "/avatars/Abraão.png",
  carlos: "/avatars/Carlos.png",
  alves: "/avatars/Alves.png",
  bruno: "/avatars/Bruno.png",
  paulo: "/avatars/Paulo.png",
  celio: "/avatars/Célio.png",
  ryan: "/avatars/Ryan.png",
};

const normalizeName = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getAvatarSrc = (nome: string) => {
  const key = normalizeName(nome);
  const byMap = avatarMap[key];
  if (byMap) return byMap;

  // Tenta pelo primeiro nome se o nome completo falhar
  const primeiroNome = key.split(' ')[0];
  if (avatarMap[primeiroNome]) return avatarMap[primeiroNome];

  // tenta ascii e o nome original como fallback
  return `/avatars/${key}.png`;
};



const parseDataPesquisa = (value?: string | null) => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    if (isValid(parsed)) return parsed;
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isValid(date)) return date;
    }
  } catch { }
  return null;
};

export default function Home() {
  const { filters, updateFilters } = useFilters();
  const { data: ticketsResponse, isLoading, refetch } = useTicketsData(filters, true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Ref para capturar o conteúdo do relatório
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Função para exportar PDF - Relatório Estilizado
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
      let y = margin;

      // HEADER CINZA
      pdf.setFillColor(51, 65, 85); // slate-700
      pdf.rect(0, 0, pageWidth, 35, 'F');

      // Logo (carregar imagem)
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
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Polo BI - Relatório Visão Geral', margin + 30, 16);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Dashboard Executivo de Atendimento', margin + 30, 24);
      const periodoStr = filters.data_inicial && filters.data_final
        ? `Período: ${format(new Date(filters.data_inicial), 'dd/MM/yyyy')} a ${format(new Date(filters.data_final), 'dd/MM/yyyy')}`
        : 'Período: Últimos 30 dias';
      pdf.setFontSize(9);
      pdf.text(periodoStr, pageWidth - margin - 65, 16);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin - 65, 24);

      y = 45;

      // KPIs
      const kpiW = (pageWidth - margin * 2 - 40) / 5;
      const kpis = [
        { label: 'Total Tickets', value: String(tickets.length), c: [59, 130, 246] },
        { label: 'Resp. em Dia', value: `${tempoMetrics.respostaEmDia}`, c: [34, 197, 94] },
        { label: 'Atend. em Dia', value: `${tempoMetrics.atendimentoEmDia}`, c: [34, 197, 94] },
        { label: 'Resp. Estourada', value: `${tempoMetrics.respostaEstourada}`, c: [239, 68, 68] },
        { label: 'Atend. Expirado', value: `${tempoMetrics.atendimentoExpirado}`, c: [239, 68, 68] },
      ];
      kpis.forEach((kpi, i) => {
        const x = margin + 10 + i * (kpiW + 8);
        pdf.setFillColor(kpi.c[0], kpi.c[1], kpi.c[2]);
        pdf.roundedRect(x, y, kpiW, 25, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.value, x + kpiW / 2, y + 12, { align: 'center' });
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.label, x + kpiW / 2, y + 20, { align: 'center' });
      });

      y += 35;

      // TEMPOS
      const boxW = (pageWidth - margin * 2 - 10) / 2;
      pdf.setFillColor(30, 41, 59);
      pdf.roundedRect(margin, y, boxW, 30, 3, 3, 'F');
      pdf.roundedRect(margin + boxW + 10, y, boxW, 30, 3, 3, 'F');

      pdf.setTextColor(96, 165, 250);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tempo Médio de Resposta', margin + 10, y + 12);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text(formatMinutosCompleto(tempoMedioAbertura.minutos), margin + 10, y + 24);

      pdf.setTextColor(52, 211, 153);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tempo Médio de Atendimento', margin + boxW + 20, y + 12);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text(formatMinutosCompleto(tempoMetrics.tempoMedioAtendimento), margin + boxW + 20, y + 24);

      y += 40;

      // RANKING
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top Operadores', margin, y);
      y += 6;

      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('#', margin + 5, y + 5.5);
      pdf.text('Operador', margin + 20, y + 5.5);
      pdf.text('Tickets', margin + 100, y + 5.5);
      pdf.text('Média/Dia', margin + 140, y + 5.5);
      y += 8;

      rankingOperadores.slice(0, 10).forEach((op, i) => {
        const bg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        pdf.setFillColor(bg[0], bg[1], bg[2]);
        pdf.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${i + 1}`, margin + 5, y + 4.5);
        pdf.text(op.nome, margin + 20, y + 4.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(op.total), margin + 100, y + 4.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(op.mediaDiaria.toFixed(2), margin + 140, y + 4.5);
        y += 6;
      });

      // FOOTER
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.text('Polo Telecom - Business Intelligence', margin, pageHeight - 6);
      pdf.text('Página 1', pageWidth - margin - 20, pageHeight - 6);

      pdf.save(`relatorio-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
      toast({ title: "Relatório exportado!", description: "PDF salvo com sucesso." });
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Estado para intervalo de atualização automática
  const [refreshInterval, setRefreshInterval] = useState<number | null>(() => {
    const saved = localStorage.getItem('dashboard-refresh-interval');
    return saved ? parseInt(saved, 10) : null;
  });

  const [previousTicketCount, setPreviousTicketCount] = useState<number | null>(null);

  // Mapa para rastrear status dos tickets: { codigo: status.text }
  const previousTicketStatusesRef = useRef<Map<number, string>>(new Map());

  // Set para rastrear IDs de chamados abertos anteriores
  const previousOpenTicketIdsRef = useRef<Set<number>>(new Set());
  // Ref para guardar informações completas dos chamados abertos anteriores (para notificação de finalização)
  const previousOpenTicketsRef = useRef<any[]>([]);
  const openTicketsInitializedRef = useRef<boolean>(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);

  // Estado para exibir contagem e dados de chamados abertos (Atendendo + Pausado)
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [chamadosAtivos, setChamadosAtivos] = useState<any[]>([]);

  // Função para buscar chamados abertos
  const fetchOpenTickets = async () => {
    try {
      const response = await fetch('/api/proxy/chamado/listagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ChamadosAbertos', total_registros: 100 }),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data?.lista || [];
    } catch (e) {
      console.error('Erro ao buscar chamados abertos:', e);
      return [];
    }
  };

  // Função para buscar últimos finalizados (para detecção de alertas)
  const fetchLastFinishedTickets = async () => {
    try {
      const response = await fetch('/api/proxy/chamado/listagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Finalizado', total_registros: 10 }), // Pega os 10 últimos
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data?.lista || [];
    } catch (e) {
      console.error('Erro ao buscar chamados finalizados:', e);
      return [];
    }
  };

  // Estado para Top 3 de pesquisas avaliadas
  const [rankingPesquisas, setRankingPesquisas] = useState<Array<{ operador: string; quantidade: number }>>([]);

  // Função para buscar pesquisas de satisfação
  const fetchPesquisas = async () => {
    try {
      const response = await fetch('/api/proxy/pesquisas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      const pesquisas = data?.lista || [];

      // Calcular ranking por quantidade de pesquisas avaliadas (com nota)
      const map = new Map<string, number>();

      // Preparar datas do filtro
      const dataInicialDate = filters.data_inicial ? parseDataPesquisa(filters.data_inicial) : null;
      const dataFinalDate = filters.data_final ? parseDataPesquisa(filters.data_final) : null;

      pesquisas.forEach((p: any) => {
        // Ignorar tickets excluídos
        if (p.ticket_excluido === 'Sim') return;

        // Aplicar filtro de data se existir
        if (dataInicialDate && dataFinalDate) {
          const dataPesquisa = parseDataPesquisa(p.data_criacao);
          if (!dataPesquisa) return; // Data inválida = fora do range

          if (dataPesquisa < startOfDay(dataInicialDate) || dataPesquisa > endOfDay(dataFinalDate)) {
            return;
          }
        }

        if (p.operador && p.nota && !isNaN(parseFloat(p.nota.replace(',', '.')))) {
          map.set(p.operador, (map.get(p.operador) || 0) + 1);
        }
      });
      const ranking = Array.from(map.entries())
        .map(([operador, quantidade]) => ({ operador, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 3);
      setRankingPesquisas(ranking);
    } catch (e) {
      console.error('Erro ao buscar pesquisas:', e);
    }
  };

  // Buscar pesquisas ao montar o componente
  // Buscar pesquisas ao montar o componente ou mudar filtros
  useEffect(() => {
    fetchPesquisas();
  }, [filters.data_inicial, filters.data_final]);

  // ========== RELATÓRIO DE TICKETS DETALHADO (para cálculos de tempo precisos) ==========
  interface TicketDetalhado {
    ticket: string;
    data_criacao: string;
    hora_criacao: string;
    data_primeiro_atendimento: string;
    hora_primeiro_atendimento: string;
    tempo_total_atendimento: string;
    tempo_atendimento_interno: string;
    tempo_atendimento_externo: string;
    tempo_gasto_sla_resposta: string;  // Tempo real SLA resposta (desconta pausas)
    tempo_gasto_sla_solucao: string;   // Tempo real SLA solução (desconta pausas)
    data_solucao: string;
    hora_solucao: string;
    operador: string;
    status: string;
    ticket_excluido: string;
    status_sla_resposta: string;
    status_sla_solucao: string;
    data_expiracao_sla_resposta: string;
    hora_expiracao_sla_resposta: string;
    data_expiracao_sla_solucao: string;
    hora_expiracao_sla_solucao: string;
  }

  const [ticketsDetalhados, setTicketsDetalhados] = useState<TicketDetalhado[]>([]);
  const [isLoadingTicketsDetalhados, setIsLoadingTicketsDetalhados] = useState(false);

  // Função para buscar relatório de tickets detalhado
  const fetchRelatorioTickets = async () => {
    try {
      setIsLoadingTicketsDetalhados(true);
      const response = await fetch('/api/proxy/relatorio-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      setTicketsDetalhados(data?.lista || []);
    } catch (e) {
      console.error('Erro ao buscar relatório de tickets:', e);
    } finally {
      setIsLoadingTicketsDetalhados(false);
    }
  };

  // Buscar relatório de tickets ao montar
  useEffect(() => {
    fetchRelatorioTickets();
  }, []);

  // Função para parsear data+hora do CSV (formato dd/MM/yyyy e HH:mm:ss)
  const parseDataHoraCSV = (data: string, hora: string): Date | null => {
    if (!data || !hora || data === 'Não possui' || hora === 'Não possui') return null;
    try {
      // Data no formato dd/MM/yyyy
      const [day, month, year] = data.split('/').map(Number);
      // Hora no formato HH:mm:ss
      const [h, m, s] = hora.split(':').map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(h) || isNaN(m)) return null;
      const date = new Date(year, month - 1, day, h, m, s || 0);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  // Calcular tempos médios usando dados do relatório detalhado
  const temposDoRelatorio = useMemo(() => {
    console.log('📊 temposDoRelatorio - ticketsDetalhados:', ticketsDetalhados.length);

    if (!ticketsDetalhados.length) {
      return { tempoMedioAbertura: 0, tempoMedioSolucao: 0, totalResposta: 0, totalSolucao: 0 };
    }

    // Debug: mostrar primeiro ticket
    if (ticketsDetalhados.length > 0) {
      console.log('📊 Primeiro ticket:', ticketsDetalhados[0]);
    }

    // Preparar datas do filtro
    const dataInicialFiltro = filters.data_inicial ? parseDataPesquisa(filters.data_inicial) : null;
    const dataFinalFiltro = filters.data_final ? parseDataPesquisa(filters.data_final) : null;

    const temposResposta: number[] = [];
    const temposSolucao: number[] = [];

    ticketsDetalhados.forEach((t) => {
      // Ignorar tickets excluídos
      if (t.ticket_excluido === 'Sim') return;

      // Parsear data de criação para filtrar
      const dataCriacao = parseDataHoraCSV(t.data_criacao, t.hora_criacao);
      if (!dataCriacao) return;

      // Aplicar filtro de data
      if (dataInicialFiltro && dataCriacao < startOfDay(dataInicialFiltro)) return;
      if (dataFinalFiltro && dataCriacao > endOfDay(dataFinalFiltro)) return;

      // Tempo de Resposta = tempo_gasto_sla_resposta (já desconta pausas SLA e finais de semana)
      if (t.tempo_gasto_sla_resposta && t.tempo_gasto_sla_resposta !== 'Não possui') {
        const minutos = horaStringToMinutos(t.tempo_gasto_sla_resposta);
        if (minutos >= 0) {
          temposResposta.push(minutos);
        }
      }

      // Tempo de Solução = tempo_gasto_sla_solucao (já desconta pausas SLA e finais de semana)
      if (t.tempo_gasto_sla_solucao && t.tempo_gasto_sla_solucao !== 'Não possui') {
        const minutos = horaStringToMinutos(t.tempo_gasto_sla_solucao);
        if (minutos >= 0) {
          temposSolucao.push(minutos);
        }
      }
    });

    const mediaResposta = temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
      : 0;

    const mediaSolucao = temposSolucao.length > 0
      ? temposSolucao.reduce((a, b) => a + b, 0) / temposSolucao.length
      : 0;

    return {
      tempoMedioAbertura: mediaResposta,
      tempoMedioSolucao: mediaSolucao,
      totalResposta: temposResposta.length,
      totalSolucao: temposSolucao.length,
    };
  }, [ticketsDetalhados, filters.data_inicial, filters.data_final]);

  // ========== MÉTRICAS SLA NATIVAS DO MILVUS (mais precisas) ==========
  // Usa os campos status_sla_resposta e status_sla_solucao que já vêm calculados
  // pelo Milvus considerando expediente, pausas e configurações do sistema
  const metricasSLAMilvus = useMemo(() => {
    if (!ticketsDetalhados.length) {
      return {
        respostaEmDia: 0,
        respostaEstourada: 0,
        solucaoEmDia: 0,
        solucaoEstourada: 0,
        totalComSLAResposta: 0,
        totalComSLASolucao: 0,
      };
    }

    const dataInicialFiltro = filters.data_inicial ? parseDataPesquisa(filters.data_inicial) : null;
    const dataFinalFiltro = filters.data_final ? parseDataPesquisa(filters.data_final) : null;

    let respostaEmDia = 0;
    let respostaEstourada = 0;
    let solucaoEmDia = 0;
    let solucaoEstourada = 0;
    let totalComSLAResposta = 0;
    let totalComSLASolucao = 0;

    ticketsDetalhados.forEach((t) => {
      if (t.ticket_excluido === 'Sim') return;

      const dataCriacao = parseDataHoraCSV(t.data_criacao, t.hora_criacao);
      if (!dataCriacao) return;

      // Aplicar filtro de data
      if (dataInicialFiltro && dataCriacao < startOfDay(dataInicialFiltro)) return;
      if (dataFinalFiltro && dataCriacao > endOfDay(dataFinalFiltro)) return;

      // Analisar SLA de Resposta (campo nativo do Milvus)
      if (t.status_sla_resposta && t.status_sla_resposta !== 'Não possui') {
        totalComSLAResposta++;
        const statusLower = t.status_sla_resposta.toLowerCase();
        // Valores possíveis: "Dentro do prazo", "Em dia", "Fora do prazo", "Expirado", "Estourado"
        if (statusLower.includes('dentro') || statusLower.includes('em dia') || statusLower === 'ok') {
          respostaEmDia++;
        } else if (statusLower.includes('fora') || statusLower.includes('expir') || statusLower.includes('estourado')) {
          respostaEstourada++;
        }
      }

      // Analisar SLA de Solução (campo nativo do Milvus)
      if (t.status_sla_solucao && t.status_sla_solucao !== 'Não possui') {
        totalComSLASolucao++;
        const statusLower = t.status_sla_solucao.toLowerCase();
        if (statusLower.includes('dentro') || statusLower.includes('em dia') || statusLower === 'ok') {
          solucaoEmDia++;
        } else if (statusLower.includes('fora') || statusLower.includes('expir') || statusLower.includes('estourado')) {
          solucaoEstourada++;
        }
      }
    });

    console.log('📊 Métricas SLA Milvus:', {
      respostaEmDia,
      respostaEstourada,
      solucaoEmDia,
      solucaoEstourada,
      totalComSLAResposta,
      totalComSLASolucao,
    });

    return {
      respostaEmDia,
      respostaEstourada,
      solucaoEmDia,
      solucaoEstourada,
      totalComSLAResposta,
      totalComSLASolucao,
    };
  }, [ticketsDetalhados, filters.data_inicial, filters.data_final]);
  // ========== FIM MÉTRICAS SLA MILVUS ==========

  // Calcular tempo de resposta por operador usando dados do relatório CSV
  const tempoRespostaPorOperadorCSV = useMemo(() => {
    if (!ticketsDetalhados.length) return [];

    const dataInicialFiltro = filters.data_inicial ? parseDataPesquisa(filters.data_inicial) : null;
    const dataFinalFiltro = filters.data_final ? parseDataPesquisa(filters.data_final) : null;

    const map = new Map<string, { totalMinutos: number; count: number }>();

    ticketsDetalhados.forEach((t) => {
      if (t.ticket_excluido === 'Sim') return;
      if (!t.operador) return;

      const dataCriacao = parseDataHoraCSV(t.data_criacao, t.hora_criacao);
      if (!dataCriacao) return;

      if (dataInicialFiltro && dataCriacao < startOfDay(dataInicialFiltro)) return;
      if (dataFinalFiltro && dataCriacao > endOfDay(dataFinalFiltro)) return;

      // Usar tempo_gasto_sla_resposta (já desconta pausas SLA e finais de semana)
      if (t.tempo_gasto_sla_resposta && t.tempo_gasto_sla_resposta !== 'Não possui') {
        const minutos = horaStringToMinutos(t.tempo_gasto_sla_resposta);
        if (minutos >= 0) {
          if (!map.has(t.operador)) {
            map.set(t.operador, { totalMinutos: 0, count: 0 });
          }
          const data = map.get(t.operador)!;
          data.totalMinutos += minutos;
          data.count += 1;
        }
      }
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        tempoMedioMinutos: data.count ? data.totalMinutos / data.count : 0,
      }))
      .sort((a, b) => b.tempoMedioMinutos - a.tempoMedioMinutos);
  }, [ticketsDetalhados, filters.data_inicial, filters.data_final]);

  // Calcular tempo de atendimento por operador usando dados do relatório CSV
  // CORREÇÃO: Usar tempo_atendimento_interno (tempo dentro do expediente)
  // NÃO usar tempo_total_atendimento pois inclui tempo fora do expediente
  const tempoAtendimentoPorOperadorCSV = useMemo(() => {
    if (!ticketsDetalhados.length) return [];

    const dataInicialFiltro = filters.data_inicial ? parseDataPesquisa(filters.data_inicial) : null;
    const dataFinalFiltro = filters.data_final ? parseDataPesquisa(filters.data_final) : null;

    const map = new Map<string, { totalMinutos: number; count: number }>();

    ticketsDetalhados.forEach((t) => {
      if (t.ticket_excluido === 'Sim') return;
      if (!t.operador) return;

      const dataCriacao = parseDataHoraCSV(t.data_criacao, t.hora_criacao);
      if (!dataCriacao) return;

      if (dataInicialFiltro && dataCriacao < startOfDay(dataInicialFiltro)) return;
      if (dataFinalFiltro && dataCriacao > endOfDay(dataFinalFiltro)) return;

      // Usar tempo_gasto_sla_solucao (já desconta pausas SLA e finais de semana)
      if (t.tempo_gasto_sla_solucao && t.tempo_gasto_sla_solucao !== 'Não possui') {
        const minutos = horaStringToMinutos(t.tempo_gasto_sla_solucao);
        if (minutos >= 0) {
          if (!map.has(t.operador)) {
            map.set(t.operador, { totalMinutos: 0, count: 0 });
          }
          const data = map.get(t.operador)!;
          data.totalMinutos += minutos;
          data.count += 1;
        }
      }
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        tempoMedioAtendimentoMinutos: data.count ? data.totalMinutos / data.count : 0,
      }))
      .sort((a, b) => b.tempoMedioAtendimentoMinutos - a.tempoMedioAtendimentoMinutos);
  }, [ticketsDetalhados, filters.data_inicial, filters.data_final]);
  // ========== END RELATÓRIO DE TICKETS ==========

  // Buscar chamados ativos (Atendendo + Pausado) ao carregar a página
  useEffect(() => {
    const loadChamadosAtivos = async () => {
      const chamados = await fetchOpenTickets();
      // Filtrar apenas Atendendo e Pausado
      const ativos = chamados.filter((c: any) =>
        c.status === 'Atendendo' || c.status === 'Pausado'
      );
      setChamadosAtivos(ativos);
      setOpenTicketsCount(ativos.length);
    };
    loadChamadosAtivos();
  }, []);

  // Função para tocar som de alerta (novo chamado)
  const playNewTicketSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (startTime: number, frequency: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioContext.currentTime;
      // Sequência de alerta urgente
      playBeep(now, 880, 0.1);
      playBeep(now + 0.15, 880, 0.1);
      playBeep(now + 0.3, 1100, 0.1);
      playBeep(now + 0.45, 1100, 0.1);
      playBeep(now + 0.6, 1320, 0.3);
    } catch (e) {
      console.log('Audio não suportado');
    }
  };

  // Função para falar anúncios (aguarda vozes carregarem)
  const speakAnnouncement = (text: string) => {
    console.log('🔊 speakAnnouncement chamado com:', text);

    if (!('speechSynthesis' in window)) {
      console.error('❌ SpeechSynthesis não suportado neste navegador');
      return;
    }

    const speak = () => {
      try {
        console.log('🔊 Executando speak()...');
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        console.log('🔊 Vozes disponíveis:', voices.length);

        // Priorizar voz "Maria" (Microsoft) ou "Google"
        let targetVoice = voices.find(v => v.name.includes('Maria') && v.lang.includes('pt'));

        if (!targetVoice) {
          targetVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('pt'));
        }

        if (!targetVoice) {
          targetVoice = voices.find(voice => voice.lang.includes('pt'));
        }

        if (targetVoice) {
          console.log('🔊 Usando voz:', targetVoice.name);
          utterance.voice = targetVoice;
        } else {
          console.log('🔊 Usando voz padrão (nenhuma correspondência encontrada)');
        }

        utterance.onstart = () => console.log('🔊 Iniciando fala...');
        utterance.onend = () => console.log('🔊 Fala concluída!');
        utterance.onerror = (e) => console.error('❌ Erro na fala:', e.error);

        window.speechSynthesis.speak(utterance);
        console.log('🔊 Fala enfileirada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao tentar falar:', error);
      }
    };

    // Se as vozes já estão carregadas, fala imediatamente
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      console.log('🔊 Vozes já carregadas, falando imediatamente');
      speak();
    } else {
      console.log('🔊 Aguardando carregamento das vozes...');
      // Aguarda as vozes carregarem
      const onVoicesChanged = () => {
        console.log('🔊 Vozes carregadas!');
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        speak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

      // Timeout fallback caso as vozes não carreguem
      setTimeout(() => {
        const nowVoices = window.speechSynthesis.getVoices();
        if (nowVoices.length > 0) {
          console.log('🔊 Fallback: vozes carregadas após timeout');
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          speak();
        } else {
          console.error('❌ Vozes não carregaram após timeout');
        }
      }, 1000);
    }
  };

  // Pré-carregar vozes do speechSynthesis ao montar o componente
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Força o carregamento das vozes
      window.speechSynthesis.getVoices();
      // Chrome carrega vozes de forma assíncrona
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!refreshInterval) {
      setNextRefreshIn(null);
      return;
    }

    // Reset countdown
    setNextRefreshIn(refreshInterval);

    const intervalId = setInterval(async () => {
      setIsRefreshing(true);
      console.log('Auto-refresh: atualizando dados...');

      // 1. Buscar dados de atendimento (existente)
      const result = await refetch();
      const newTickets = result.data?.lista || [];
      const newTicketCount = newTickets.length;

      // 2. Buscar chamados abertos (NOVO)
      const openTickets = await fetchOpenTickets();
      console.log('📋 Chamados abertos recebidos:', openTickets.length);

      // Atualizar chamados ativos (Atendendo + Pausado) para exibição na Visão Geral
      const ativos = openTickets.filter((c: any) =>
        c.status === 'Atendendo' || c.status === 'Pausado'
      );
      setChamadosAtivos(ativos);
      setOpenTicketsCount(ativos.length);

      // 3. Detectar NOVOS chamados abertos
      const currentOpenIds = new Set<number>(openTickets.map((t: any) => t.codigo || t.id));
      console.log('📋 IDs atuais:', Array.from(currentOpenIds));
      console.log('📋 IDs anteriores:', Array.from(previousOpenTicketIdsRef.current));
      console.log('📋 Inicializado?', openTicketsInitializedRef.current);

      const novosChamados: Array<{
        codigo: number;
        assunto: string;
        nome_fantasia?: string;
        data_criacao?: string;
        status?: { text: string };
        mesa_trabalho?: { text: string };
        nome?: string;
      }> = [];

      // IMPORTANTE: Guardar cópia dos IDs anteriores ANTES de qualquer modificação
      const previousIdsSnapshot = new Set(previousOpenTicketIdsRef.current);

      if (openTicketsInitializedRef.current) {
        openTickets.forEach((ticket: any) => {
          const codigo = ticket.codigo || ticket.id;
          if (!previousOpenTicketIdsRef.current.has(codigo)) {
            console.log('🆕 NOVO CHAMADO DETECTADO:', codigo, ticket.assunto);
            novosChamados.push({
              codigo,
              assunto: ticket.assunto || 'Sem assunto',
              nome_fantasia: ticket.nome_fantasia || ticket.cliente || '',
              data_criacao: ticket.data_criacao || ticket.data_abertura || new Date().toISOString(),
              status: ticket.status || { text: 'Aberto' },
              mesa_trabalho: ticket.mesa_trabalho || { text: 'Suporte' },
              nome: ticket.nome || ticket.operador || 'Não atribuído',
            });
          }
        });
      } else {
        console.log('📋 Primeira execução - inicializando IDs base');
        openTicketsInitializedRef.current = true;
      }

      // Atualizar set de IDs abertos para a próxima comparação
      previousOpenTicketIdsRef.current = currentOpenIds;

      // 4. Alertar sobre NOVOS chamados abertos
      console.log('📋 Total de novos chamados detectados:', novosChamados.length);

      if (novosChamados.length > 0) {
        console.log('🔔 DISPARANDO NOTIFICAÇÃO DE VOZ!');
        playNewTicketSound();

        // Registrar novos chamados no store para destaque na Gestão de Chamados
        newTicketsStore.addTickets(novosChamados);

        novosChamados.slice(0, 2).forEach((ticket, index) => {
          setTimeout(() => {
            toast({
              title: '🔔 Novo chamado aberto!',
              description: `"${ticket.assunto}" (Código: ${ticket.codigo})`,
              duration: 8000,
            });
          }, index * 1200);
        });

        if (novosChamados.length > 2) {
          setTimeout(() => {
            toast({
              title: `📢 +${novosChamados.length - 2} novos chamados`,
              description: 'Múltiplos chamados foram abertos',
              duration: 5000,
            });
          }, 3000);
        }

        // Notificação por voz corrigida
        setTimeout(() => {
          console.log('🔊 Chamando speakAnnouncement...');
          if (novosChamados.length === 1) {
            const primeiro = novosChamados[0];
            const cliente = primeiro.nome_fantasia || 'cliente desconhecido';
            speakAnnouncement(`Atenção! Novo chamado do cliente ${cliente}: ${primeiro.assunto}`);
          } else {
            speakAnnouncement(`Atenção! Foram abertos ${novosChamados.length} novos chamados!`);
          }
        }, 300);
      }

      // 5. Detectar tickets FINALIZADOS - Nova lógica: detectar quando chamados SAEM da lista de abertos
      // Isso é mais confiável que buscar uma API de finalizados que pode retornar dados inconsistentes
      const newFinalizados: Array<{ codigo: number; assunto: string; nome?: string; nome_fantasia?: string }> = [];

      // Usar o snapshot dos IDs anteriores (não a ref atualizada)
      if (openTicketsInitializedRef.current && previousIdsSnapshot.size > 0) {
        // Encontrar IDs que estavam abertos ANTES mas não estão AGORA
        const previousIds = Array.from(previousIdsSnapshot);

        previousIds.forEach(previousId => {
          // Se o ID anterior não está mais na lista atual de abertos
          if (!currentOpenIds.has(previousId)) {
            console.log('✅ CHAMADO FINALIZADO (saiu da lista de abertos):', previousId);

            // Precisamos buscar as informações do ticket que foi fechado
            // Vamos usar openTickets anterior para isso (guardamos uma ref)
            const ticketInfo = previousOpenTicketsRef.current.find((t: any) =>
              (t.codigo || t.id) === previousId
            );

            if (ticketInfo) {
              newFinalizados.push({
                codigo: previousId,
                assunto: ticketInfo.assunto || 'Chamado finalizado',
                nome: ticketInfo.tecnico || ticketInfo.nome || ticketInfo.operador || 'Operador',
                nome_fantasia: ticketInfo.nome_fantasia || ticketInfo.cliente || 'Cliente'
              });
            } else {
              // Se não temos info, ainda notificamos mas com dados genéricos
              newFinalizados.push({
                codigo: previousId,
                assunto: 'Chamado finalizado',
                nome: 'Operador',
                nome_fantasia: 'Cliente'
              });
            }
          }
        });
      }

      // Guardar os chamados abertos atuais para referência futura
      previousOpenTicketsRef.current = openTickets;

      console.log('✅ Chamados finalizados detectados:', newFinalizados.length);

      // Notificar sobre tickets finalizados
      if (newFinalizados.length > 0) {
        // Função para tocar som de sucesso
        const playSuccessSound = () => {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playTone = (startTime: number, frequency: number, duration: number) => {
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = frequency;
              oscillator.type = 'sine';
              gainNode.gain.setValueAtTime(0.2, startTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
              oscillator.start(startTime);
              oscillator.stop(startTime + duration);
            };
            const now = audioContext.currentTime;
            playTone(now, 523, 0.2);      // C5
            playTone(now + 0.15, 659, 0.2); // E5
            playTone(now + 0.3, 784, 0.4);  // G5
          } catch (e) {
            console.log('Audio não suportado');
          }
        };

        // Só tocar som de finalização se não tiver novos chamados (para não sobrepor)
        if (novosChamados.length === 0) {
          playSuccessSound();
        }

        // Mostrar toast para cada ticket finalizado
        newFinalizados.slice(0, 3).forEach((ticket, index) => {
          setTimeout(() => {
            toast({
              title: '✅ Chamado Finalizado!',
              description: `"${ticket.assunto}" (Código: ${ticket.codigo}) por ${ticket.nome}`,
              duration: 6000,
            });
          }, (novosChamados.length > 0 ? 4000 : 0) + index * 1000);
        });

        // Se houver mais de 3, mostrar um resumo
        if (newFinalizados.length > 3) {
          setTimeout(() => {
            toast({
              title: `📋 +${newFinalizados.length - 3} outros finalizados`,
              description: 'Múltiplos chamados foram concluídos',
              duration: 4000,
            });
          }, (novosChamados.length > 0 ? 4000 : 0) + 3500);
        }

        // Falar o primeiro finalizado (com delay se tiver novos chamados)
        setTimeout(() => {
          const primeiro = newFinalizados[0];
          const operador = primeiro.nome || 'Operador';
          const cliente = primeiro.nome_fantasia || 'cliente';
          // Usando speakAnnouncement para garantir consistência
          speakAnnouncement(`Atenção! O Operador ${operador} finalizou o chamado do cliente ${cliente}`);
        }, novosChamados.length > 0 ? 5000 : 500);
      } else if (novosChamados.length === 0) {
        // Se não houve finalizações nem novos, mostrar atualização silenciosa
        toast({
          title: "Dados atualizados",
          description: `Dashboard atualizado. ${openTickets.length} chamados abertos`,
          duration: 2000,
        });
      }

      setPreviousTicketCount(newTicketCount);
      setTimeout(() => setIsRefreshing(false), 500);
      setNextRefreshIn(refreshInterval);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, refetch, toast, previousTicketCount]);

  // Countdown timer
  useEffect(() => {
    if (!nextRefreshIn || nextRefreshIn <= 0) return;

    const countdownId = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (!prev || prev <= 1000) return null;
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(countdownId);
  }, [nextRefreshIn]);

  const tickets = ticketsResponse?.lista ?? [];

  // Atualiza contagem inicial de tickets e inicializa mapa de status
  useEffect(() => {
    if (tickets.length > 0 && previousTicketCount === null) {
      setPreviousTicketCount(tickets.length);

      // Inicializar o mapa de status com os tickets atuais
      const statusMap = new Map<number, string>();
      tickets.forEach((ticket) => {
        statusMap.set(ticket.codigo, ticket.status?.text || '');
      });
      previousTicketStatusesRef.current = statusMap;
    }
  }, [tickets, previousTicketCount]);

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

  // CORREÇÃO FINAL: Usar horas_internas (tempo DENTRO do expediente) - igual ao Power BI
  // NÃO usar total_horas_atendimento pois inclui tempo fora do expediente
  const diffsAtendimentoMin = useMemo(() => {
    return ticketsFiltrados
      .map((ticket) => {
        // CORREÇÃO: Usar horas_internas que é o tempo dentro do expediente
        // Este é o campo correto que o Power BI usa
        const horaStr = (ticket as any).horas_internas || ticket.total_horas_atendimento;
        const tempoAtendimento = horaStringToMinutos(horaStr);
        if (tempoAtendimento <= 0) return null;
        return tempoAtendimento;
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

  // CORREÇÃO FINAL: Usar horas_internas (tempo DENTRO do expediente) - igual ao Power BI
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
      // CORREÇÃO: Usar horas_internas que é o tempo dentro do expediente
      const horaStr = (ticket as any).horas_internas || ticket.total_horas_atendimento;
      const tempoAtendimento = horaStringToMinutos(horaStr);
      if (tempoAtendimento <= 0) return;

      const minutos = Math.min(tempoAtendimento, capMinutos);
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

  // Ranking de operadores baseado APENAS em chamados ativos (Atendendo + Pausado)
  const rankingChamadosAtivos = useMemo(() => {
    if (!chamadosAtivos.length) return [];
    const map = new Map<string, { atendendo: number; pausado: number; total: number }>();

    chamadosAtivos.forEach((ticket: any) => {
      const nome = ticket.tecnico || "Não atribuído";
      if (!map.has(nome)) {
        map.set(nome, { atendendo: 0, pausado: 0, total: 0 });
      }
      const data = map.get(nome)!;
      data.total += 1;
      if (ticket.status === 'Atendendo') {
        data.atendendo += 1;
      } else if (ticket.status === 'Pausado') {
        data.pausado += 1;
      }
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        atendendo: data.atendendo,
        pausado: data.pausado,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [chamadosAtivos]);

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

  const handleRefreshChange = (value: string) => {
    if (value === "off") {
      setRefreshInterval(null);
      localStorage.removeItem('dashboard-refresh-interval');
    } else {
      const numValue = parseInt(value, 10);
      setRefreshInterval(numValue);
      localStorage.setItem('dashboard-refresh-interval', value);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);

    // 1. Atualizar dados do relatório
    const result = await refetch();
    const newTicketCount = result.data?.lista?.length || 0;

    // 2. Atualizar chamados ativos (Atendendo + Pausado)
    const openTickets = await fetchOpenTickets();
    const ativos = openTickets.filter((c: any) =>
      c.status === 'Atendendo' || c.status === 'Pausado'
    );
    setChamadosAtivos(ativos);
    setOpenTicketsCount(ativos.length);

    // Verifica se há novos tickets
    if (previousTicketCount !== null && newTicketCount > previousTicketCount) {
      const newTickets = newTicketCount - previousTicketCount;

      // Toca som de notificação
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3yPDdkEAKE1+06+unVRULRp/h8r5uIAUsgs/y2Ik2CBlouO3nn00RDFCn4/C2YxwGOJPY8sx5KwUkeMjw3Y9AChRfsunrp1QUC0af4PK+bSAFLITP8NqJNgcZartuu+3nklERDFCm5PCzYhwGOJTa88tzKgUjd8Xwzo5ACxReu+rqo1QVC0Wf3/K9bSAFLYTO8tqJNwcZarsuu+znklEQS0/j8LRkHAU4lNrzzHgrBSN2xO/NjkALFFuz/ejmUxQLRp/g8axrHwUthM7y2ogzBhlosuzm3JBMEQ1Qq+PztGMcBjeV2vTMeSoFI3TC8M6OQAsVX7Po6KZYFA1Gn+Dyt2wdBCx/z/HYhzcFGWe58d+hTBANUavj87JiFQc3ltr0y3kqBSJzwu/NjT8MFFmx5+igWBQLRZ/f8rltIAQrgc7x2IgzBhposezm3I9LERFT/+TztWQcBTiT2fTMdioGI3K/8M+OQAsWXrPn6KFYFQxFn9/yvG0gBSp7zvHZiDQLGGe58N2hTBENUKvi8rJjHAU3k9n0zHcqBiJywvDPjUAMF1607+ihWBYMRZ/f8rltIAUrfM/x2IcyCxhnufDdoUwQC1Gr4vCyZBwFN5PZ9Mt2KgUicrzwz40/DBhftevov1gWDEWe3vK5ayAGK3vO8diHMgsYZ7nw3aFMEAtQq+Lwsl8cBjeR2fTLdSoFInLB8c+NPwwZX7Xs6L9YFgxFnt3yuWsgBSp7zvHYhzILGGa58N2gSA8KUKrh8LJfHAU3kdf0y3UqBSJywPTPjT8NHF+z7umvVxkMQ53c8rheIAYqe83z2YgyDB1lqevfnkUTCU+q4u+yXhsENo/W88x0KQQicsBxT4w/Dyh2yO3mnlQZDkKd2vO5XB4FKnrL8tmHMQsZY6rp3p1EFApOqOLtsVwcBDaOz/PMdCkEI3K9cU+LPw8occft5p5UGQ5Ands0uVweBSp5yvLZhzELGWOn6d6dRBQJTqbh7bFcHAQ2js/zzHMpBCNxvvFOiz8PKHHI7eaeUxgOQ5zb9LhcHgQqeMry');
      audio.volume = 0.5;
      audio.play().catch(() => { });

      toast({
        title: `🔔 ${newTickets} novo(s) chamado(s)!`,
        description: "Novos tickets detectados",
        duration: 4000,
      });
    } else {
      toast({
        title: "Dados atualizados",
        description: `Dashboard atualizado • ${ativos.length} chamado(s) ativo(s)`,
        duration: 2000,
      });
    }

    setPreviousTicketCount(newTicketCount);
    setTimeout(() => setIsRefreshing(false), 500);

    // Reseta o countdown se houver refresh automático ativo
    if (refreshInterval) {
      setNextRefreshIn(refreshInterval);
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

  // Estado para o DateRangePicker
  const dateRange = useMemo((): DateRange | undefined => {
    const from = dataInicialDateInput ?? undefined;
    const to = dataFinalDateInput ?? undefined;
    if (!from && !to) return undefined;
    return { from, to };
  }, [dataInicialDateInput, dataFinalDateInput]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) {
      updateFilters({ data_inicial: undefined, data_final: undefined });
      return;
    }
    updateFilters({
      data_inicial: range.from ? format(startOfDay(range.from), "yyyy-MM-dd HH:mm:ss") : undefined,
      data_final: range.to ? format(endOfDay(range.to), "yyyy-MM-dd HH:mm:ss") : undefined,
    });
  };

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
      <div className="space-y-6">
        <PageHeader
          titulo="Visão Geral"
          subtitulo="Nenhum dado disponível para o período selecionado"
        />
        {/* Filtro de datas para permitir ajuste mesmo sem dados */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 sm:flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Período</span>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                />
              </div>
              <Button onClick={handleManualRefresh} variant="outline" size="sm" disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground text-center py-8">
          Selecione um período de datas acima para carregar os dados do dashboard.
        </p>
      </div>
    );
  }

  const kpiCards = [
    {
      titulo: "Tickets Finalizados",
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
      link: "/registros-expirados?tab=resposta",
    },
    {
      titulo: "Qtd Atendimento Expirado",
      valor: tempoMetrics.atendimentoExpirado.toLocaleString("pt-BR"),
      detalhe: tempoMetrics.totalAtendMedida
        ? `${((tempoMetrics.atendimentoExpirado / tempoMetrics.totalAtendMedida) * 100).toFixed(2)}%`
        : "0%",
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
      className: "bg-red-600/10 border-red-500/50",
      link: "/registros-expirados?tab=atendimento",
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
  const topOperadores = rankingOperadores.slice(0, 4);

  return (
    <div ref={reportRef} className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageHeader
            titulo="Visão Geral"
            subtitulo="Dashboard executivo inspirado no painel compartilhado"
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

        {/* Widget Top 3 Pesquisas (Header) */}
        <div className="flex-1 px-4 hidden xl:block">
          {rankingPesquisas.length > 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-10 bg-slate-900/60 py-3 px-8 rounded-xl border border-yellow-500/20 shadow-lg shadow-yellow-500/5 backdrop-blur-md">
                <div className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2 px-2 border-r border-slate-700/50">
                  <Trophy className="h-5 w-5" /> Top Avaliados
                </div>
                <div className="flex items-center gap-8 pr-2">
                  {rankingPesquisas.map((item, idx) => (
                    <div key={item.operador} className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className={cn("border-2 border-slate-900 ring-2 ring-offset-2 ring-offset-slate-950",
                          idx === 0 ? "h-14 w-14 ring-yellow-500" :
                            idx === 1 ? "h-12 w-12 ring-slate-400" :
                              "h-12 w-12 ring-amber-700"
                        )}>
                          <AvatarImage src={getAvatarSrc(item.operador)} alt={item.operador} />
                          <AvatarFallback className="text-xs bg-yellow-950 text-yellow-500 font-bold">
                            {item.operador.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col leading-none gap-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-slate-200 flex items-center gap-1.5", idx === 0 ? "text-base text-yellow-100" : "text-sm")}>
                            {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />}
                            {idx === 1 && <Medal className="h-4 w-4 text-slate-400 fill-slate-400/20" />}
                            {idx === 2 && <Medal className="h-4 w-4 text-amber-700 fill-amber-700/20" />}
                            {item.operador.split(' ')[0]}
                          </span>
                          {/* Badge de ranking opcional se o cliente quiser manter o numero visualmente */}
                          {/* <span className="text-[10px] font-bold text-muted-foreground">#{idx + 1}</span> */}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium bg-slate-800/80 px-2 py-0.5 rounded-full w-fit whitespace-nowrap">
                          {item.quantidade} <span className="inline">avaliações</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Card className="bg-emerald-500/10 border-emerald-500/40 min-w-[160px]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-emerald-400 text-sm">META 00:05:00</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-2xl font-mono font-bold">
                {formatMinutosCompleto(temposDoRelatorio.tempoMedioAbertura)}
              </div>
              <p className="text-xs text-muted-foreground">Tempo médio de abertura</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/40 min-w-[160px]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-emerald-400 text-sm">META 04:00:00</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-2xl font-mono font-bold">
                {formatMinutosCompleto(temposDoRelatorio.tempoMedioSolucao)}
              </div>
              <p className="text-xs text-muted-foreground">Tempo médio de solução</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtro de datas */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 sm:flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Período</span>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                placeholder="Selecione o período"
              />
            </div>
            <div className="flex flex-col gap-1 ml-auto">
              <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                Atualização automática
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={refreshInterval ? String(refreshInterval) : "off"}
                  onValueChange={handleRefreshChange}
                >
                  <SelectTrigger className="sm:w-[180px]">
                    <SelectValue placeholder="Desativado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Desativado</SelectItem>
                    {REFRESH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {nextRefreshIn && nextRefreshIn > 0 && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.floor(nextRefreshIn / 1000)}s
                  </span>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9"
                  title="Atualizar agora"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    playNewTicketSound();
                    speakAnnouncement("Teste de áudio. Atenção! Foi aberto um chamado de teste!");
                    toast({
                      title: "🔊 Teste de Áudio",
                      description: "Se você ouviu o som e a voz, está funcionando!",
                      duration: 5000,
                    });
                  }}
                  className="h-9 text-xs"
                  title="Testar notificação por voz"
                >
                  🔊 Testar Voz
                </Button>
              </div>
            </div>
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
              card.className,
              card.link && "cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all"
            )}
            onClick={() => card.link && setLocation(card.link)}
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
        ))
        }
      </div>


      {/* Gráficos de tempo médio + top operadores */}
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
              {formatMinutosCompleto(temposDoRelatorio.tempoMedioAbertura)}
            </div>
            <div className="space-y-2">
              {tempoRespostaPorOperadorCSV.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para operadores.</p>
              )}
              {tempoRespostaPorOperadorCSV.slice(0, 8).map((op) => {
                const maxValor = tempoRespostaPorOperadorCSV[0]?.tempoMedioMinutos || 1;
                const value = maxValor ? (op.tempoMedioMinutos / maxValor) * 100 : 0;

                // Buscar dados do ranking para este operador
                const rankingData = rankingOperadores.find(r => r.nome === op.nome);
                const totalTickets = rankingData?.total || 0;
                const mediaDiariaOp = rankingData?.mediaDiaria?.toFixed(2) || '0.00';

                return (
                  <div key={op.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{op.nome}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatMinutosCompleto(op.tempoMedioMinutos)}
                      </span>
                    </div>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="group relative cursor-pointer"
                            onClick={() => {
                              updateFilters({ analista: op.nome });
                              setLocation('/operacional');
                            }}
                          >
                            <Progress value={value} className="h-2 transition-all duration-300 group-hover:h-3 group-hover:shadow-lg group-hover:shadow-blue-500/30" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-blue-500/30 shadow-xl shadow-blue-500/20 p-0 overflow-hidden"
                        >
                          <div className="p-3 min-w-[220px]">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/20">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                {op.nome.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{op.nome}</p>
                                <p className="text-[10px] text-blue-300/70">Tempo de Resposta</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <p className="text-blue-400 font-mono text-lg font-bold">{totalTickets}</p>
                                <p className="text-slate-400 text-[10px]">Tickets</p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <p className="text-amber-400 font-mono text-lg font-bold">{mediaDiariaOp}</p>
                                <p className="text-slate-400 text-[10px]">Média/Dia</p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <p className="text-emerald-400 font-mono text-sm font-bold">{formatMinutosCompleto(op.tempoMedioMinutos)}</p>
                                <p className="text-slate-400 text-[10px]">Tempo</p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">Comparação</span>
                                <span className="text-[10px] font-mono text-amber-400">{value.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all" style={{ width: `${value}%` }} />
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-blue-500/20 text-center">
                              <span className="text-[10px] text-blue-400">👆 Clique para ver detalhes</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
              {formatMinutosCompleto(temposDoRelatorio.tempoMedioSolucao)}
            </div>
            <div className="space-y-2">
              {tempoAtendimentoPorOperadorCSV.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para operadores.</p>
              )}
              {tempoAtendimentoPorOperadorCSV.slice(0, 8).map((op) => {
                const maxValor =
                  tempoAtendimentoPorOperadorCSV[0]?.tempoMedioAtendimentoMinutos || 1;
                const value = maxValor
                  ? (op.tempoMedioAtendimentoMinutos / maxValor) * 100
                  : 0;

                // Buscar dados do ranking para este operador
                const rankingData = rankingOperadores.find(r => r.nome === op.nome);
                const totalTickets = rankingData?.total || 0;
                const mediaDiariaOp = rankingData?.mediaDiaria?.toFixed(2) || '0.00';

                return (
                  <div key={op.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{op.nome}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatMinutosCompleto(op.tempoMedioAtendimentoMinutos)}
                      </span>
                    </div>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="group relative cursor-pointer"
                            onClick={() => {
                              updateFilters({ analista: op.nome });
                              window.location.href = '/operacional';
                            }}
                          >
                            <Progress value={value} className="h-2 bg-muted transition-all duration-300 group-hover:h-3 group-hover:shadow-lg group-hover:shadow-emerald-500/30" />
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 shadow-xl shadow-emerald-500/20 p-0 overflow-hidden"
                        >
                          <div className="p-3 min-w-[220px]">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/20">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                {op.nome.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{op.nome}</p>
                                <p className="text-[10px] text-emerald-300/70">Tempo de Atendimento</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <p className="text-emerald-400 font-mono text-lg font-bold">{totalTickets}</p>
                                <p className="text-slate-400 text-[10px]">Tickets</p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <p className="text-amber-400 font-mono text-lg font-bold">{mediaDiariaOp}</p>
                                <p className="text-slate-400 text-[10px]">Média/Dia</p>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <p className="text-cyan-400 font-mono text-sm font-bold">{formatMinutosCompleto(op.tempoMedioAtendimentoMinutos)}</p>
                                <p className="text-slate-400 text-[10px]">Tempo</p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">Comparação</span>
                                <span className="text-[10px] font-mono text-amber-400">{value.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all" style={{ width: `${value}%` }} />
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-emerald-500/20 text-center">
                              <span className="text-[10px] text-emerald-400">👆 Clique para ver detalhes</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
              Top 4 Operadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topOperadores.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            )}
            {topOperadores.map((op, idx) => {
              const avatarSrc = getAvatarSrc(op.nome);
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;
              const trophy = isFirst ? "🏆" : isSecond ? "🥈" : isThird ? "🥉" : null;
              const sizeClass = isFirst ? "h-12 w-12" : "h-10 w-10";
              return (
                <div
                  key={op.nome}
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border/60 px-3 py-2 transition",
                    isFirst
                      ? "bg-amber-50/5 border-amber-500/50 ring-1 ring-amber-500/60 scale-[1.02]"
                      : "",
                    isSecond ? "border-slate-500/40" : "",
                    isThird ? "border-amber-700/30" : ""
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-muted-foreground">#{idx + 1}</div>
                    <Avatar className={sizeClass}>
                      {avatarSrc ? <AvatarImage src={avatarSrc} alt={op.nome} /> : null}
                      <AvatarFallback>{op.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      {trophy && (
                        <span className={cn("text-lg", isFirst ? "text-amber-400" : isSecond ? "text-slate-300" : "text-amber-700")} role="img" aria-label="trofeu">
                          {trophy}
                        </span>
                      )}
                      <div>
                        <div
                          className={cn(
                            "leading-tight",
                            isFirst ? "font-semibold text-amber-200 text-base" : "font-semibold"
                          )}
                        >
                          {op.nome}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {op.total} chamados • {op.mediaDiaria.toFixed(2)} / dia
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>


      </div>

      {/* Chamados Ativos (Atendendo + Pausado) */}
      <Card className="border-2 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Chamados Ativos por Operador
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({chamadosAtivos.length} chamados em andamento)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankingChamadosAtivos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum chamado ativo no momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>Avatar</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Atendendo
                    </span>
                  </TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      Pausado
                    </span>
                  </TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingChamadosAtivos.map((op) => (
                  <TableRow
                    key={op.nome}
                    className="cursor-pointer hover:bg-green-500/10 transition-colors"
                    onClick={() => {
                      updateFilters({ analista: op.nome });
                      // Passar status na URL para filtrar na página de destino
                      setLocation(`/operacional?status=Atendendo,Pausado`);
                    }}
                  >
                    <TableCell className="font-medium">{op.nome}</TableCell>
                    <TableCell>
                      <Avatar className="h-10 w-10 border border-border/80">
                        <AvatarImage src={getAvatarSrc(op.nome)} alt={op.nome} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {op.nome.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="text-center">
                      {op.atendendo > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-green-500 text-white font-bold text-sm">
                          {op.atendendo}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {op.pausado > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-yellow-500 text-black font-bold text-sm">
                          {op.pausado}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm font-bold">
                      {op.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
