import { TicketRaw } from "@shared/schema";

interface OperatorMetrics {
  nome: string;
  ticketsResolvidos: number;
  tempoMedioRespostaMinutos: number;
  tempoMedioAtendimentoMinutos: number;
  totalHorasAtendimento: number;
}

interface DashboardMetrics {
  totalTickets: number;
  ticketsFinalizados: number;
  ticketsEmAberto: number;
  totalOperadores: number;
  tempoMedioRespostaGeral: number;
  tempoMedioAtendimentoGeral: number;
  distribuicaoPorStatus: {
    status: string;
    quantidade: number;
    percentual: number;
  }[];
  distribuicaoPorMesaTrabalho: {
    mesa: string;
    quantidade: number;
  }[];
  operadorMetrics: OperatorMetrics[];
}

/**
 * Converte string de tempo "HH:MM:SS" para minutos totais
 */
export const horaStringToMinutos = (horaStr: string): number => {
  if (!horaStr || horaStr === "00:00:00") return 0;
  const [horas, minutos, segundos] = horaStr.split(":").map(Number);
  return horas * 60 + minutos + segundos / 60;
};

/**
 * Converte minutos para string "HH:MM"
 */
export const minutosToHoraString = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const mins = Math.floor(minutos % 60);
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

/**
 * Calcula distribuição de tickets por status
 */
const calculateStatusDistribution = (
  tickets: TicketRaw[]
): DashboardMetrics["distribuicaoPorStatus"] => {
  const statusMap = new Map<string, number>();

  tickets.forEach((ticket) => {
    const status = ticket.status.text;
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const total = tickets.length;
  return Array.from(statusMap.entries()).map(([status, quantidade]) => ({
    status,
    quantidade,
    percentual: (quantidade / total) * 100,
  }));
};

/**
 * Calcula distribuição de tickets por mesa de trabalho
 */
const calculateMesaDistribution = (
  tickets: TicketRaw[]
): DashboardMetrics["distribuicaoPorMesaTrabalho"] => {
  const mesaMap = new Map<string, number>();

  tickets.forEach((ticket) => {
    const mesa = ticket.mesa_trabalho.text;
    mesaMap.set(mesa, (mesaMap.get(mesa) || 0) + 1);
  });

  return Array.from(mesaMap.entries()).map(([mesa, quantidade]) => ({
    mesa,
    quantidade,
  }));
};

/**
 * Calcula métricas por operador
 */
const calculateOperatorMetrics = (
  tickets: TicketRaw[]
): OperatorMetrics[] => {
  const operadorMap = new Map<
    string,
    {
      temposResposta: number[];
      temposAtendimento: number[];
      totalHoras: number;
      count: number;
    }
  >();

  tickets.forEach((ticket) => {
    const nomeOperador = ticket.nome;

    if (!operadorMap.has(nomeOperador)) {
      operadorMap.set(nomeOperador, {
        temposResposta: [],
        temposAtendimento: [],
        totalHoras: 0,
        count: 0,
      });
    }

    const data = operadorMap.get(nomeOperador)!;

    // Converter horas para minutos
    const tempoResposta = horaStringToMinutos(ticket.horas_operador);
    const tempoAtendimento = horaStringToMinutos(ticket.total_horas_atendimento);
    const horasOperador = horaStringToMinutos(ticket.horas_operador);

    if (tempoResposta > 0) {
      data.temposResposta.push(tempoResposta);
    }
    if (tempoAtendimento > 0) {
      data.temposAtendimento.push(tempoAtendimento);
    }

    data.totalHoras += horasOperador;
    data.count += 1;
  });

  return Array.from(operadorMap.entries())
    .map(([nome, data]) => {
      const tempoMedioResposta =
        data.temposResposta.length > 0
          ? data.temposResposta.reduce((a, b) => a + b) /
            data.temposResposta.length
          : 0;

      const tempoMedioAtendimento =
        data.temposAtendimento.length > 0
          ? data.temposAtendimento.reduce((a, b) => a + b) /
            data.temposAtendimento.length
          : 0;

      return {
        nome,
        ticketsResolvidos: data.count,
        tempoMedioRespostaMinutos: Math.round(tempoMedioResposta * 100) / 100,
        tempoMedioAtendimentoMinutos:
          Math.round(tempoMedioAtendimento * 100) / 100,
        totalHorasAtendimento: Math.round(data.totalHoras * 100) / 100,
      };
    })
    .sort((a, b) => b.ticketsResolvidos - a.ticketsResolvidos);
};

/**
 * Agregação principal de dados
 */
export const aggregateTicketData = (tickets: TicketRaw[]): DashboardMetrics => {
  const finalizados = tickets.filter(
    (t) => t.status.text === "Finalizado"
  ).length;
  const emAberto = tickets.filter(
    (t) => t.status.text !== "Finalizado"
  ).length;

  const operadores = new Set(tickets.map((t) => t.nome));

  return {
    totalTickets: tickets.length,
    ticketsFinalizados: finalizados,
    ticketsEmAberto: emAberto,
    totalOperadores: operadores.size,
    tempoMedioRespostaGeral: 0, // Calculado separadamente se necessário
    tempoMedioAtendimentoGeral: 0, // Calculado separadamente se necessário
    distribuicaoPorStatus: calculateStatusDistribution(tickets),
    distribuicaoPorMesaTrabalho: calculateMesaDistribution(tickets),
    operadorMetrics: calculateOperatorMetrics(tickets),
  };
};

/**
 * Calcula SLA (distribuição em_dia/em_risco/estourado)
 * Baseado em horas_ticket vs meta predefinida
 */
export const calculateSLAStatus = (
  horasTicket: string,
  metaHoras: number = 4 // Meta padrão de 4 horas
): "em_dia" | "em_risco" | "estourado" => {
  const minutos = horaStringToMinutos(horasTicket);
  const horasDecimal = minutos / 60;

  if (horasDecimal <= metaHoras * 0.8) {
    return "em_dia";
  } else if (horasDecimal <= metaHoras) {
    return "em_risco";
  } else {
    return "estourado";
  }
};

/**
 * Calcula distribuição de SLA
 */
export const calculateSLADistribution = (
  tickets: TicketRaw[],
  metaHoras: number = 4
) => {
  const slaStatuses = tickets.map((t) =>
    calculateSLAStatus(t.horas_ticket, metaHoras)
  );

  const total = slaStatuses.length;
  const emDia = slaStatuses.filter((s) => s === "em_dia").length;
  const emRisco = slaStatuses.filter((s) => s === "em_risco").length;
  const estourado = slaStatuses.filter((s) => s === "estourado").length;

  return {
    emDia,
    emRisco,
    estourado,
    conformidade: ((emDia / total) * 100).toFixed(1),
    emDiaPercentual: ((emDia / total) * 100).toFixed(1),
    emRiscoPercentual: ((emRisco / total) * 100).toFixed(1),
    estouradoPercentual: ((estourado / total) * 100).toFixed(1),
  };
};
