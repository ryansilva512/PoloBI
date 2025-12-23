import { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";

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
  // tenta ascii e o nome original como fallback
  return `/avatars/${key}.png`;
};

export default function Home() {
  const { filters, updateFilters } = useFilters();
  const { data: ticketsResponse, isLoading, refetch } = useTicketsData(filters, true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Estado para intervalo de atualização automática
  const [refreshInterval, setRefreshInterval] = useState<number | null>(() => {
    const saved = localStorage.getItem('dashboard-refresh-interval');
    return saved ? parseInt(saved, 10) : null;
  });

  const [previousTicketCount, setPreviousTicketCount] = useState<number | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);

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

      const result = await refetch();
      const newTicketCount = result.data?.lista?.length || 0;

      // Verifica se há novos tickets
      if (previousTicketCount !== null && newTicketCount > previousTicketCount) {
        const newTickets = newTicketCount - previousTicketCount;

        // Função para tocar som de alerta chamativo
        const playAlertSound = () => {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Tocar 3 beeps rápidos e chamatitvos
            const playBeep = (startTime: number, frequency: number, duration: number) => {
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);

              oscillator.frequency.value = frequency;
              oscillator.type = 'square';

              gainNode.gain.setValueAtTime(0.3, startTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

              oscillator.start(startTime);
              oscillator.stop(startTime + duration);
            };

            // Sequência de beeps ascendentes - muito chamativa
            const now = audioContext.currentTime;
            playBeep(now, 800, 0.15);
            playBeep(now + 0.2, 1000, 0.15);
            playBeep(now + 0.4, 1200, 0.15);
            playBeep(now + 0.6, 1500, 0.3);
          } catch (e) {
            console.log('Audio não suportado');
          }
        };

        // Função para falar usando Web Speech API
        const speakNotification = (text: string) => {
          if ('speechSynthesis' in window) {
            // Cancelar qualquer fala anterior
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.0;
            utterance.pitch = 1.1;
            utterance.volume = 1.0;

            // Tentar usar voz em português brasileiro
            const voices = window.speechSynthesis.getVoices();
            const ptVoice = voices.find(voice => voice.lang.includes('pt'));
            if (ptVoice) {
              utterance.voice = ptVoice;
            }

            window.speechSynthesis.speak(utterance);
          }
        };

        // Tocar o som de alerta
        playAlertSound();

        // Falar a notificação após o som
        setTimeout(() => {
          if (newTickets === 1) {
            speakNotification('Atenção! Novo chamado Finalizado!');
          } else {
            speakNotification(`Atenção! ${newTickets} novos chamados Finalizados!`);
          }
        }, 800);

        toast({
          title: `🔔 ${newTickets} novo(s) chamado(s)!`,
          description: "Ticket detectado durante atualização automática",
          duration: 5000,
        });
      } else {
        toast({
          title: "Dados atualizados",
          description: "Dashboard atualizado automaticamente",
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

  // Atualiza contagem inicial de tickets
  useEffect(() => {
    if (tickets.length > 0 && previousTicketCount === null) {
      setPreviousTicketCount(tickets.length);
    }
  }, [tickets.length, previousTicketCount]);

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

    const result = await refetch();
    const newTicketCount = result.data?.lista?.length || 0;

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
        description: "Dashboard atualizado manualmente",
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
  const topOperadores = rankingOperadores.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <PageHeader
          titulo="Visão Geral"
          subtitulo="Dashboard executivo inspirado no painel compartilhado"
        />
        <div className="flex gap-3">
          <Card className="bg-emerald-500/10 border-emerald-500/40 min-w-[160px]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-emerald-400 text-sm">META 00:05:00</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-2xl font-mono font-bold">
                {formatMinutosCompleto(tempoMedioAbertura.minutos)}
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
                {formatMinutosCompleto(tempoMetrics.tempoMedioAtendimento)}
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
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Período</span>
              <Select
                value=""
                onValueChange={(value) => {
                  const hoje = new Date();
                  let dataInicio: Date;
                  let dataFim = hoje;

                  switch (value) {
                    case "week_to_date":
                      const dayOfWeek = hoje.getDay();
                      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                      dataInicio = new Date(hoje);
                      dataInicio.setDate(hoje.getDate() - diffToMonday);
                      break;
                    case "month_to_date":
                      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                      break;
                    case "last_7_days":
                      dataInicio = new Date(hoje);
                      dataInicio.setDate(hoje.getDate() - 6);
                      break;
                    case "last_14_days":
                      dataInicio = new Date(hoje);
                      dataInicio.setDate(hoje.getDate() - 13);
                      break;
                    case "last_30_days":
                      dataInicio = new Date(hoje);
                      dataInicio.setDate(hoje.getDate() - 29);
                      break;
                    default:
                      return;
                  }

                  updateFilters({
                    data_inicial: format(startOfDay(dataInicio), "yyyy-MM-dd HH:mm:ss"),
                    data_final: format(endOfDay(dataFim), "yyyy-MM-dd HH:mm:ss"),
                  });
                }}
              >
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Mês</span>
              <Select
                value=""
                onValueChange={(value) => {
                  const [year, month] = value.split("-").map(Number);
                  const dataInicio = new Date(year, month, 1);
                  const dataFim = new Date(year, month + 1, 0); // Último dia do mês

                  updateFilters({
                    data_inicial: format(startOfDay(dataInicio), "yyyy-MM-dd HH:mm:ss"),
                    data_final: format(endOfDay(dataFim), "yyyy-MM-dd HH:mm:ss"),
                  });
                }}
              >
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = `${date.getFullYear()}-${date.getMonth()}`;
                    const monthNames = [
                      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ];
                    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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
              {formatMinutosCompleto(tempoMedioRespostaGlobal)}
            </div>
            <div className="space-y-2">
              {tempoRespostaPorOperador.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para operadores.</p>
              )}
              {tempoRespostaPorOperador.slice(0, 8).map((op) => {
                const maxValor = tempoRespostaPorOperador[0]?.tempoMedioMinutos || 1;
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

      {/* Ranking de operadores */}
      <Card>
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
  );
}
