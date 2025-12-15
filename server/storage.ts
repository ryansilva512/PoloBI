import { randomUUID } from "crypto";
import type {
  Ticket,
  Agent,
  DashboardSummary,
  TicketDistribution,
  PriorityDistribution,
  ChannelDistribution,
  TimeSeriesPoint,
  SLACompliance,
  SatisfactionResponse,
  AgingBucket,
  DepartmentPerformance,
  Alert,
  CostAnalysis,
  TicketStatus,
  Priority,
  Channel,
  SLAStatus,
} from "@shared/schema";

export interface IStorage {
  getDashboardSummary(): Promise<DashboardSummary>;
  getTickets(): Promise<Ticket[]>;
  getTicketsByFilter(filter: Record<string, string | undefined>): Promise<Ticket[]>;
  getTicketsEmRiscoSLA(): Promise<Ticket[]>;
  getAgentes(): Promise<Agent[]>;
  getAlerts(): Promise<Alert[]>;
  getTendencias(periodo: string): Promise<TimeSeriesPoint[]>;
  getPrioridadeDistribuicao(): Promise<PriorityDistribution[]>;
  getCanalDistribuicao(): Promise<ChannelDistribution[]>;
  getAging(): Promise<AgingBucket[]>;
  getSLACompliance(periodo: string): Promise<SLACompliance[]>;
  getDepartamentoPerformance(): Promise<DepartmentPerformance[]>;
  getCSATDistribuicao(): Promise<SatisfactionResponse[]>;
  getCSATTendencia(periodo: string): Promise<TimeSeriesPoint[]>;
  getNPSTendencia(periodo: string): Promise<TimeSeriesPoint[]>;
  getCustos(periodo: string): Promise<CostAnalysis[]>;
  getVolumeTendencia(periodo: string): Promise<TimeSeriesPoint[]>;
}

// Helper functions for generating realistic mock data
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function formatDateLabel(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const agentNames = [
  "Ana Silva", "Carlos Santos", "Maria Oliveira", "João Pereira",
  "Fernanda Costa", "Pedro Almeida", "Julia Ferreira", "Lucas Rodrigues",
  "Beatriz Souza", "Rafael Lima"
];

const clientNames = [
  "Tech Solutions Ltda", "Inovação Digital SA", "Sistemas Integrados",
  "Data Corp", "Cloud Services BR", "NetWork Solutions", "InfoTech",
  "Cyber Systems", "Digital First", "Smart Business"
];

const departments = ["TI", "Financeiro", "RH", "Comercial"];

const issueTypes = [
  "Reset de Senha", "Problema de Acesso", "Instalação de Software",
  "Configuração de Email", "Falha de Sistema", "Dúvida Operacional",
  "Solicitação de Hardware", "Erro de Aplicação", "Problema de Rede",
  "Atualização de Permissões"
];

const ticketTitles = [
  "Não consigo acessar o sistema",
  "Email não está funcionando",
  "Preciso de novo software instalado",
  "Problema com impressora",
  "Sistema lento",
  "Erro ao gerar relatório",
  "Solicitar acesso VPN",
  "Computador não liga",
  "Atualizar licença de software",
  "Problema de conexão WiFi"
];

export class MemStorage implements IStorage {
  private tickets: Ticket[] = [];
  private agents: Agent[] = [];
  private alerts: Alert[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Generate agents
    this.agents = agentNames.map((nome, index) => ({
      id: randomUUID(),
      nome,
      departamento: departments[index % departments.length],
      avatar: null,
      ticketsResolvidos: randomInt(50, 200),
      tempoMedioResolucao: randomInt(45, 180),
      csat: randomInt(75, 98),
      taxaReavertura: randomFloat(2, 15),
    }));

    // Generate tickets
    const statuses: TicketStatus[] = ["aberto", "em_andamento", "resolvido", "agendado"];
    const priorities: Priority[] = ["alta", "media", "baixa"];
    const channels: Channel[] = ["email", "telefone", "chat", "whatsapp", "portal"];
    const slaStatuses: SLAStatus[] = ["em_dia", "em_risco", "estourado"];

    for (let i = 0; i < 150; i++) {
      const status = randomChoice(statuses);
      const daysAgo = randomInt(0, 30);
      const createdAt = generateDate(daysAgo);
      
      this.tickets.push({
        id: randomUUID(),
        titulo: randomChoice(ticketTitles),
        descricao: "Descrição detalhada do problema relatado pelo cliente.",
        status,
        prioridade: randomChoice(priorities),
        canal: randomChoice(channels),
        cliente: randomChoice(clientNames),
        agente: randomChoice(agentNames),
        departamento: randomChoice(departments),
        tipoIssue: randomChoice(issueTypes),
        dataCriacao: createdAt,
        dataAtualizacao: createdAt,
        dataResolucao: status === "resolvido" ? generateDate(randomInt(0, daysAgo)) : null,
        slaStatus: status === "resolvido" ? "em_dia" : randomChoice(slaStatuses),
        tempoResposta: randomInt(5, 60),
        tempoResolucao: status === "resolvido" ? randomInt(30, 300) : null,
      });
    }

    // Generate alerts
    this.alerts = [
      {
        id: randomUUID(),
        tipo: "critico",
        titulo: "SLA crítico atingido",
        descricao: "15 tickets estouraram o prazo de SLA nas últimas 24 horas",
        metrica: "SLA Estourado",
        valorAtual: 15,
        valorLimite: 5,
        acao: "Ver tickets",
      },
      {
        id: randomUUID(),
        tipo: "alerta",
        titulo: "Backlog elevado",
        descricao: "O volume de tickets em aberto está 30% acima da média",
        metrica: "Backlog",
        valorAtual: 78,
        valorLimite: 60,
        acao: "Analisar fila",
      },
      {
        id: randomUUID(),
        tipo: "info",
        titulo: "CSAT em tendência de queda",
        descricao: "A satisfação caiu 3% na última semana",
        metrica: "CSAT",
        valorAtual: 87,
        valorLimite: 90,
        acao: "Ver detalhes",
      },
    ];
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const abertos = this.tickets.filter(t => t.status === "aberto").length;
    const emAndamento = this.tickets.filter(t => t.status === "em_andamento").length;
    const resolvidos = this.tickets.filter(t => t.status === "resolvido").length;
    const agendados = this.tickets.filter(t => t.status === "agendado").length;
    const estourados = this.tickets.filter(t => t.slaStatus === "estourado").length;
    const emRisco = this.tickets.filter(t => t.slaStatus === "em_risco").length;

    return {
      ticketsAbertos: abertos,
      ticketsEmAndamento: emAndamento,
      ticketsResolvidos: resolvidos,
      ticketsAgendados: agendados,
      backlogTotal: abertos + emAndamento,
      ticketsEstouradosSLA: estourados,
      ticketsEmRiscoSLA: emRisco,
      conformidadeSLA: 92.5,
      tempoMedioPrimeiraResposta: 28,
      tempoMedioResolucao: 95,
      csat: 88,
      nps: 42,
      ces: 2.8,
      taxaResolucaoPrimeiraChamada: 72,
      taxaEscalonamento: 12,
      taxaReavertura: 8,
      custoPorChamado: 22.50,
      taxaAbandono: 4.2,
      volumeHoje: randomInt(20, 45),
      volumeSemana: randomInt(150, 250),
      volumeMes: randomInt(600, 900),
    };
  }

  async getTickets(): Promise<Ticket[]> {
    return this.tickets;
  }

  async getTicketsByFilter(filter: Record<string, string | undefined>): Promise<Ticket[]> {
    let result = [...this.tickets];
    
    if (filter.canal) {
      result = result.filter(t => t.canal === filter.canal);
    }
    if (filter.prioridade) {
      result = result.filter(t => t.prioridade === filter.prioridade);
    }
    if (filter.departamento) {
      result = result.filter(t => t.departamento === filter.departamento);
    }
    if (filter.agente) {
      result = result.filter(t => t.agente === filter.agente);
    }
    
    return result;
  }

  async getTicketsEmRiscoSLA(): Promise<Ticket[]> {
    return this.tickets.filter(
      t => t.slaStatus === "em_risco" || t.slaStatus === "estourado"
    ).slice(0, 10);
  }

  async getAgentes(): Promise<Agent[]> {
    return this.agents;
  }

  async getAlerts(): Promise<Alert[]> {
    return this.alerts;
  }

  async getTendencias(periodo: string): Promise<TimeSeriesPoint[]> {
    const days = periodo === "7dias" ? 7 : periodo === "90dias" ? 90 : 30;
    const data: TimeSeriesPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      data.push({
        data: formatDateLabel(i),
        valor: randomInt(20, 60),
      });
    }
    
    return data;
  }

  async getPrioridadeDistribuicao(): Promise<PriorityDistribution[]> {
    const alta = this.tickets.filter(t => t.prioridade === "alta").length;
    const media = this.tickets.filter(t => t.prioridade === "media").length;
    const baixa = this.tickets.filter(t => t.prioridade === "baixa").length;
    const total = alta + media + baixa;
    
    return [
      { prioridade: "alta", count: alta, percentual: Math.round((alta / total) * 100) },
      { prioridade: "media", count: media, percentual: Math.round((media / total) * 100) },
      { prioridade: "baixa", count: baixa, percentual: Math.round((baixa / total) * 100) },
    ];
  }

  async getCanalDistribuicao(): Promise<ChannelDistribution[]> {
    const channels: Channel[] = ["email", "telefone", "chat", "whatsapp", "portal"];
    const total = this.tickets.length;
    
    return channels.map(canal => {
      const count = this.tickets.filter(t => t.canal === canal).length;
      return {
        canal,
        count,
        percentual: Math.round((count / total) * 100),
      };
    });
  }

  async getAging(): Promise<AgingBucket[]> {
    const now = Date.now();
    const openTickets = this.tickets.filter(t => t.status !== "resolvido");
    
    const buckets = {
      "0-24h": 0,
      "1-3 dias": 0,
      "3-7 dias": 0,
      "> 7 dias": 0,
    };
    
    openTickets.forEach(t => {
      const ageHours = (now - new Date(t.dataCriacao).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) buckets["0-24h"]++;
      else if (ageHours < 72) buckets["1-3 dias"]++;
      else if (ageHours < 168) buckets["3-7 dias"]++;
      else buckets["> 7 dias"]++;
    });
    
    const total = openTickets.length;
    
    return Object.entries(buckets).map(([faixa, count]) => ({
      faixa,
      count,
      percentual: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  async getSLACompliance(periodo: string): Promise<SLACompliance[]> {
    const days = periodo === "7dias" ? 7 : periodo === "90dias" ? 12 : 10;
    const data: SLACompliance[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const dentroPrazo = randomInt(40, 60);
      const foraPrazo = randomInt(2, 10);
      data.push({
        periodo: formatDateLabel(i * 3),
        dentroPrazo,
        foraPrazo,
        percentualConformidade: Math.round((dentroPrazo / (dentroPrazo + foraPrazo)) * 100),
      });
    }
    
    return data;
  }

  async getDepartamentoPerformance(): Promise<DepartmentPerformance[]> {
    return departments.map(dept => ({
      departamento: dept,
      ticketsResolvidos: randomInt(100, 300),
      tempoMedioResolucao: randomInt(60, 150),
      csat: randomInt(80, 98),
      conformidadeSLA: randomInt(85, 98),
    }));
  }

  async getCSATDistribuicao(): Promise<SatisfactionResponse[]> {
    return [
      { nota: 5, label: "Muito Satisfeito", count: randomInt(100, 200), percentual: 45 },
      { nota: 4, label: "Satisfeito", count: randomInt(80, 150), percentual: 35 },
      { nota: 3, label: "Neutro", count: randomInt(20, 50), percentual: 12 },
      { nota: 2, label: "Insatisfeito", count: randomInt(5, 20), percentual: 5 },
      { nota: 1, label: "Muito Insatisfeito", count: randomInt(2, 10), percentual: 3 },
    ];
  }

  async getCSATTendencia(periodo: string): Promise<TimeSeriesPoint[]> {
    const days = periodo === "7dias" ? 7 : periodo === "90dias" ? 12 : 10;
    const data: TimeSeriesPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      data.push({
        data: formatDateLabel(i * 3),
        valor: randomInt(82, 95),
      });
    }
    
    return data;
  }

  async getNPSTendencia(periodo: string): Promise<TimeSeriesPoint[]> {
    const days = periodo === "7dias" ? 7 : periodo === "90dias" ? 12 : 10;
    const data: TimeSeriesPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      data.push({
        data: formatDateLabel(i * 3),
        valor: randomInt(30, 55),
      });
    }
    
    return data;
  }

  async getCustos(periodo: string): Promise<CostAnalysis[]> {
    const months = periodo === "7dias" ? 4 : periodo === "90dias" ? 6 : 4;
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const data: CostAnalysis[] = [];
    
    for (let i = 0; i < months; i++) {
      const volume = randomInt(400, 700);
      const custoTotal = volume * randomFloat(20, 28, 2);
      data.push({
        periodo: monthNames[i],
        volumeChamados: volume,
        custoTotal,
        custoPorChamado: parseFloat((custoTotal / volume).toFixed(2)),
        horasTrabalho: randomInt(800, 1200),
      });
    }
    
    return data;
  }

  async getVolumeTendencia(periodo: string): Promise<TimeSeriesPoint[]> {
    const days = periodo === "7dias" ? 7 : periodo === "90dias" ? 90 : 30;
    const data: TimeSeriesPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      data.push({
        data: formatDateLabel(i),
        valor: randomInt(25, 65),
      });
    }
    
    return data;
  }
}

export const storage = new MemStorage();
