export interface SlaTicketDetail {
  ticket: string;
  contato: string;
  nome_fantasia: string;
  data_criacao: string;
  hora_criacao: string;
  data_primeiro_atendimento: string;
  hora_primeiro_atendimento: string;
  tempo_total_atendimento: string;
  tempo_atendimento_interno: string;
  tempo_atendimento_externo: string;
  tempo_gasto_sla_resposta: string;
  tempo_gasto_sla_solucao: string;
  total_sla_resposta: string;
  total_sla_solucao: string;
  data_solucao: string;
  hora_solucao: string;
  operador: string;
  status: string;
  tipo_ticket: string;
  ticket_excluido: string;
  status_sla_resposta: string;
  status_sla_solucao: string;
  data_expiracao_sla_resposta: string;
  hora_expiracao_sla_resposta: string;
  data_expiracao_sla_solucao: string;
  hora_expiracao_sla_solucao: string;
}

export interface SlaTicketFilters {
  data_inicial?: string;
  data_final?: string;
  analista?: string;
  mesa_trabalho?: string;
}

const PAGE_SIZE = 200;

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value.trim().replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const splitDateTime = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return { date: "", time: "" };

  const [datePart = "", timePart = ""] = value.trim().split(/[T ]/);
  const [year, month, day] = datePart.split("-");
  return {
    date: year && month && day ? `${day}/${month}/${year}` : datePart,
    time: timePart,
  };
};

const textValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value) {
    return String((value as { text?: unknown }).text ?? "");
  }
  return "";
};

export const mapNativeSlaTicket = (ticket: any): SlaTicketDetail => {
  const created = splitDateTime(ticket?.data_criacao);
  const answered = splitDateTime(ticket?.data_resposta);
  const solved = splitDateTime(ticket?.data_solucao);
  const slaExpiration = splitDateTime(ticket?.sla?.data_expiracao_sla);
  const fullOperator = String(ticket?.tecnico ?? "").replace(/\s+/g, " ").trim();

  return {
    ticket: String(ticket?.codigo ?? ticket?.id ?? ""),
    contato: String(ticket?.contato ?? ""),
    nome_fantasia: String(ticket?.cliente ?? ""),
    data_criacao: created.date,
    hora_criacao: created.time,
    data_primeiro_atendimento: answered.date,
    hora_primeiro_atendimento: answered.time,
    tempo_total_atendimento: String(ticket?.total_horas ?? ""),
    tempo_atendimento_interno: String(ticket?.sla?.solucao?.tempo_gasto ?? ""),
    tempo_atendimento_externo: "",
    tempo_gasto_sla_resposta: String(ticket?.sla?.resposta?.tempo_gasto ?? ""),
    tempo_gasto_sla_solucao: String(ticket?.sla?.solucao?.tempo_gasto ?? ""),
    total_sla_resposta: String(ticket?.sla?.total_sla_resposta_programado ?? ""),
    total_sla_solucao: String(ticket?.sla?.total_sla_solucao_programado ?? ""),
    data_solucao: solved.date,
    hora_solucao: solved.time,
    operador: fullOperator ? fullOperator.split(/\s+/)[0] : "",
    status: textValue(ticket?.status),
    tipo_ticket: textValue(ticket?.tipo_ticket),
    ticket_excluido: "Não",
    status_sla_resposta: String(
      ticket?.sla?.status_sla_resposta ?? ticket?.status_sla_resposta ?? "",
    ),
    status_sla_solucao: String(
      ticket?.sla?.status_sla_solucao ?? ticket?.status_sla_solucao ?? "",
    ),
    data_expiracao_sla_resposta: "",
    hora_expiracao_sla_resposta: "",
    data_expiracao_sla_solucao: slaExpiration.date,
    hora_expiracao_sla_solucao: slaExpiration.time,
  };
};

export const fetchNativeSlaTickets = async (
  filters: SlaTicketFilters,
): Promise<SlaTicketDetail[]> => {
  const start = parseDate(filters.data_inicial);
  const end = parseDate(filters.data_final);
  const analyst = normalizeText(filters.analista);
  const worktable = normalizeText(filters.mesa_trabalho);
  const rawTickets: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await fetch('/api/proxy/chamado/listagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Todos',
        pagina: page,
        total_registros: PAGE_SIZE,
        data_inicial: filters.data_inicial,
        data_final: filters.data_final,
        analista: filters.analista,
        mesa_trabalho: filters.mesa_trabalho,
      }),
    });

    if (!response.ok) {
      throw new Error(`Não foi possível consultar o SLA nativo (${response.status}).`);
    }

    const data = await response.json();
    if (!Array.isArray(data?.lista)) {
      throw new Error('A API de SLA retornou uma lista inválida.');
    }

    rawTickets.push(...data.lista);
    lastPage = Math.max(1, Number(data?.meta?.paginate?.last_page) || 1);

    // Em servidores antigos os filtros de data são ignorados. Como a listagem
    // vem da mais recente para a mais antiga, não é necessário buscar além do
    // primeiro registro anterior ao início selecionado.
    const reachedStart = Boolean(start) && data.lista.some((ticket: any) => {
      const created = parseDate(ticket?.data_criacao);
      return created ? created <= start! : false;
    });
    if (reachedStart || data.lista.length === 0) break;

    page += 1;
  } while (page <= lastPage);

  return rawTickets
    .filter((ticket) => {
      const created = parseDate(ticket?.data_criacao);
      if (!created) return false;
      if (start && created < start) return false;
      if (end && created > end) return false;

      const fullOperator = normalizeText(ticket?.tecnico);
      const firstOperator = fullOperator.split(' ')[0];
      if (analyst && analyst !== fullOperator && analyst !== firstOperator) return false;

      const ticketWorktable = normalizeText(textValue(ticket?.mesa_trabalho));
      if (worktable && worktable !== ticketWorktable) return false;
      return true;
    })
    .map(mapNativeSlaTicket);
};
