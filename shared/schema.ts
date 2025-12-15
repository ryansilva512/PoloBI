import { z } from "zod";

// Status do chamado conforme retorna da API
export const statusResponseSchema = z.object({
  id: z.number(),
  text: z.string(), // "Finalizado", "Aberto", etc
});

// Mesa de trabalho
export const mesaTrabalhoSchema = z.object({
  id: z.number(),
  text: z.string(), // "Suporte Técnico", etc
});

// Tipo de chamado
export const tipoChamadoSchema = z.object({
  id: z.number(),
  text: z.string(), // "Alterações", "Incidente", etc
});

// Categoria
export const categoriaSchema = z.object({
  id: z.number(),
  text: z.string(),
});

// Setor
export const setorSchema = z.object({
  id: z.number().nullable(),
  text: z.string(),
});

// Motivo de pausa
export const motivoPausaSchema = z.object({
  text: z.string(),
});

// Ticket conforme retorna da API MILVUS
export const ticketRawSchema = z.object({
  id: z.number(),
  chamado_id: z.number(),
  codigo: z.number(),
  assunto: z.string(),
  nome_fantasia: z.string(),
  nome: z.string(),
  sobrenome: z.string(),
  data_inicial: z.string(),
  data_final: z.string(),
  tipo_hora: z.string(),
  is_externo: z.boolean(),
  tecnico: z.string(),
  total_horas_atendimento: z.string(),
  horas_ticket: z.string(),
  horas_operador: z.string(),
  horas_internas: z.string(),
  horas_externas: z.string(),
  descricao: z.string().nullable(),
  is_comercial: z.boolean(),
  contato: z.string(),
  mesa_trabalho: mesaTrabalhoSchema,
  tipo_chamado: tipoChamadoSchema,
  categoria_primaria: categoriaSchema,
  categoria_secundaria: categoriaSchema,
  status: statusResponseSchema,
  data_criacao: z.string(),
  data_solucao: z.string(),
  setor: setorSchema,
  motivo_pausa: motivoPausaSchema,
  data_saida: z.string().nullable(),
  data_chegada: z.string().nullable(),
  unidade_negocio: z.string(),
});
export type TicketRaw = z.infer<typeof ticketRawSchema>;

// Resposta paginada da API
export const paginatedMetaSchema = z.object({
  current_page: z.number(),
  total: z.number(),
  to: z.number(),
  from: z.number(),
  last_page: z.number(),
  per_page: z.number(),
});
export type PaginatedMeta = z.infer<typeof paginatedMetaSchema>;

export const paginatedResponseSchema = z.object({
  meta: paginatedMetaSchema,
  lista: z.array(ticketRawSchema),
});
export type PaginatedTicketResponse = z.infer<typeof paginatedResponseSchema>;

// Filtros para requisição
export const ticketFiltersSchema = z.object({
  data_inicial: z.string().optional(),
  data_final: z.string().optional(),
  analista: z.string().optional(),
  mesa_trabalho: z.string().optional(),
  pagina: z.number().optional(),
  limit: z.number().optional(),
});
export type TicketFilters = z.infer<typeof ticketFiltersSchema>;

// Legacy enums para uso interno (podem ser removidos se não mais usados)
export const ticketStatusEnum = z.enum(["aberto", "em_andamento", "finalizado", "agendado"]);
export type TicketStatus = z.infer<typeof ticketStatusEnum>;

export const priorityEnum = z.enum(["alta", "media", "baixa"]);
export type Priority = z.infer<typeof priorityEnum>;

export const channelEnum = z.enum(["email", "telefone", "chat", "whatsapp", "portal"]);
export type Channel = z.infer<typeof channelEnum>;

export const slaStatusEnum = z.enum(["em_dia", "em_risco", "estourado"]);
export type SLAStatus = z.infer<typeof slaStatusEnum>;

// Ticket normalizado para uso interno (convertido de TicketRaw)
export const ticketSchema = z.object({
  id: z.number(),
  chamado_id: z.number(),
  codigo: z.number(),
  assunto: z.string(),
  cliente: z.string(),
  operador: z.string(),
  operadorSobrenome: z.string(),
  mesa_trabalho: z.string(),
  status: z.string(),
  data_criacao: z.string(),
  data_solucao: z.string(),
  total_horas_atendimento: z.string(),
  horas_operador: z.string(),
});
export type Ticket = z.infer<typeof ticketSchema>;

// Agent schema
export const agentSchema = z.object({
  id: z.string(),
  nome: z.string(),
  departamento: z.string(),
  avatar: z.string().nullable(),
  ticketsResolvidos: z.number(),
  tempoMedioResolucao: z.number(),
  csat: z.number(),
  taxaReavertura: z.number(),
});
export type Agent = z.infer<typeof agentSchema>;

// Dashboard KPI summary
export const dashboardSummarySchema = z.object({
  ticketsAbertos: z.number(),
  ticketsEmAndamento: z.number(),
  ticketsResolvidos: z.number(),
  ticketsAgendados: z.number(),
  backlogTotal: z.number(),
  ticketsEstouradosSLA: z.number(),
  ticketsEmRiscoSLA: z.number(),
  conformidadeSLA: z.number(), // percentual
  tempoMedioPrimeiraResposta: z.number(), // FRT em minutos
  tempoMedioResolucao: z.number(), // AHT em minutos
  csat: z.number(), // 0-100
  nps: z.number(), // -100 a 100
  ces: z.number(), // 1-7
  taxaResolucaoPrimeiraChamada: z.number(), // FCR percentual
  taxaEscalonamento: z.number(),
  taxaReavertura: z.number(),
  custoPorChamado: z.number(),
  taxaAbandono: z.number(),
  volumeHoje: z.number(),
  volumeSemana: z.number(),
  volumeMes: z.number(),
});
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Ticket distribution by status
export const ticketDistributionSchema = z.object({
  status: ticketStatusEnum,
  count: z.number(),
  percentual: z.number(),
});
export type TicketDistribution = z.infer<typeof ticketDistributionSchema>;

// Ticket distribution by priority
export const priorityDistributionSchema = z.object({
  prioridade: priorityEnum,
  count: z.number(),
  percentual: z.number(),
});
export type PriorityDistribution = z.infer<typeof priorityDistributionSchema>;

// Channel distribution
export const channelDistributionSchema = z.object({
  canal: channelEnum,
  count: z.number(),
  percentual: z.number(),
});
export type ChannelDistribution = z.infer<typeof channelDistributionSchema>;

// Time series data for charts
export const timeSeriesPointSchema = z.object({
  data: z.string(),
  valor: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof timeSeriesPointSchema>;

// SLA compliance data
export const slaComplianceSchema = z.object({
  periodo: z.string(),
  dentroPrazo: z.number(),
  foraPrazo: z.number(),
  percentualConformidade: z.number(),
});
export type SLACompliance = z.infer<typeof slaComplianceSchema>;

// Satisfaction survey response
export const satisfactionResponseSchema = z.object({
  nota: z.number(),
  label: z.string(),
  count: z.number(),
  percentual: z.number(),
});
export type SatisfactionResponse = z.infer<typeof satisfactionResponseSchema>;

// Aging tickets (backlog)
export const agingBucketSchema = z.object({
  faixa: z.string(), // "0-24h", "1-3 dias", "3-7 dias", "> 7 dias"
  count: z.number(),
  percentual: z.number(),
});
export type AgingBucket = z.infer<typeof agingBucketSchema>;

// Department performance
export const departmentPerformanceSchema = z.object({
  departamento: z.string(),
  ticketsResolvidos: z.number(),
  tempoMedioResolucao: z.number(),
  csat: z.number(),
  conformidadeSLA: z.number(),
});
export type DepartmentPerformance = z.infer<typeof departmentPerformanceSchema>;

// KPI definition for the metrics library
export const kpiDefinitionSchema = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: z.string(),
  formula: z.string(),
  objetivo: z.string(),
  decisoes: z.string(),
  unidade: z.string(),
  metaIdeal: z.string(),
});
export type KPIDefinition = z.infer<typeof kpiDefinitionSchema>;

// Filter options
export const filterOptionsSchema = z.object({
  canais: z.array(channelEnum),
  prioridades: z.array(priorityEnum),
  status: z.array(ticketStatusEnum),
  departamentos: z.array(z.string()),
  agentes: z.array(z.string()),
  clientes: z.array(z.string()),
  tiposIssue: z.array(z.string()),
});
export type FilterOptions = z.infer<typeof filterOptionsSchema>;

// Alert for critical metrics
export const alertSchema = z.object({
  id: z.string(),
  tipo: z.enum(["critico", "alerta", "info"]),
  titulo: z.string(),
  descricao: z.string(),
  metrica: z.string(),
  valorAtual: z.number(),
  valorLimite: z.number(),
  acao: z.string(),
});
export type Alert = z.infer<typeof alertSchema>;

// Cost analysis data
export const costAnalysisSchema = z.object({
  periodo: z.string(),
  volumeChamados: z.number(),
  custoTotal: z.number(),
  custoPorChamado: z.number(),
  horasTrabalho: z.number(),
});
export type CostAnalysis = z.infer<typeof costAnalysisSchema>;

// Keep existing user schema for compatibility
export const users = {
  id: "",
  username: "",
  password: "",
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
