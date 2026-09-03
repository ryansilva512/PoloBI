export interface SatisfactionRecord {
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

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? value as UnknownRecord : {};

const asText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  const record = asRecord(value);
  if (typeof record.text === "string") return record.text.trim();
  return "";
};

const hasScore = (value: string) => {
  const score = Number(value.replace(",", "."));
  return Number.isFinite(score) && score >= 1 && score <= 5;
};

const firstName = (value: unknown): string => {
  const fullName = asText(value);
  return fullName ? fullName.split(/\s+/)[0] : "Não possui";
};

const categoryName = (ticket: UnknownRecord): string => {
  const categories = [
    asText(ticket.categoria_primaria),
    asText(ticket.categoria_secundaria),
  ].filter((value) => value && value !== "Não possui");

  return categories.join(" / ");
};

const toSatisfactionReportTime = (value: unknown): string => {
  const timestamp = asText(value);
  const match = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) return timestamp;

  const [, year, month, day, hour, minute, second = "00"] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  // A listagem retorna o horário de Manaus; o relatório "Pesquisas" usado
  // anteriormente expõe o mesmo evento no fuso de Brasília (UTC-3).
  parsed.setHours(parsed.getHours() + 1);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
};

export const mapTicketToSatisfactionRecord = (value: unknown): SatisfactionRecord => {
  const ticket = asRecord(value);
  const score = asText(ticket.total_avaliacao);
  const description = asText(ticket.descricao_avaliacao);

  return {
    data_criacao: asText(ticket.data_criacao),
    contato: asText(ticket.contato),
    descricao_avaliacao: description || "Não possui",
    nota: hasScore(score) ? score : "Não possui",
    // A API atualiza data_modificacao quando a avaliação é registrada. O
    // relatório personalizado expunha esse mesmo instante como data_avaliacao.
    data_avaliacao: hasScore(score)
      ? toSatisfactionReportTime(ticket.data_modificacao)
      : "Não possui",
    ticket: asText(ticket.codigo),
    razao_social: asText(ticket.cliente) || asText(ticket.nome_fantasia),
    categoria: categoryName(ticket),
    operador: firstName(ticket.tecnico),
    // A listagem comum já omite os tickets excluídos.
    ticket_excluido: "Não",
  };
};

export const mergeSatisfactionRecords = (
  createdTickets: unknown[],
  evaluatedTickets: unknown[],
): SatisfactionRecord[] => {
  const records = new Map<string, SatisfactionRecord>();

  const upsert = (value: unknown) => {
    const incoming = mapTicketToSatisfactionRecord(value);
    if (!incoming.ticket) return;

    const current = records.get(incoming.ticket);
    if (!current) {
      records.set(incoming.ticket, incoming);
      return;
    }

    records.set(incoming.ticket, {
      ...current,
      contato: incoming.contato || current.contato,
      razao_social: incoming.razao_social || current.razao_social,
      categoria: incoming.categoria || current.categoria,
      operador: incoming.operador !== "Não possui" ? incoming.operador : current.operador,
      nota: hasScore(incoming.nota) ? incoming.nota : current.nota,
      data_avaliacao: hasScore(incoming.nota)
        ? incoming.data_avaliacao
        : current.data_avaliacao,
      descricao_avaliacao: incoming.descricao_avaliacao !== "Não possui"
        ? incoming.descricao_avaliacao
        : current.descricao_avaliacao,
    });
  };

  createdTickets.forEach(upsert);
  evaluatedTickets.forEach(upsert);
  return Array.from(records.values());
};

export const parseSatisfactionCsv = (csvText: string): SatisfactionRecord[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ";" && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  const [rawHeader = [], ...dataRows] = rows;
  const header = rawHeader.map((name) => name.replace(/^\uFEFF/, "").trim());

  return dataRows.map((values) => {
    const source: Record<string, string> = {};
    header.forEach((name, index) => {
      source[name] = values[index] || "";
    });

    return {
      data_criacao: source["DATA DE CRIAÇÃO DO TICKET"] || "",
      contato: source["CONTATO DO TICKET"] || "",
      descricao_avaliacao: source["DESCRIÇÃO DA AVALIAÇÃO"] || "",
      nota: source["NOTA DA AVALIAÇÃO"] || "",
      data_avaliacao: source["DATA DA AVALIAÇÃO"] || "",
      ticket: source.TICKET || "",
      razao_social: source["RAZÃO SOCIAL DO CLIENTE"] || "",
      categoria: source["NOME DA CATEGORIA"] || "",
      operador: source["NOME DO OPERADOR"] || "",
      ticket_excluido: source["TICKET EXCLUÍDO"] || "Não",
    };
  });
};
