export interface SlaTimeRecord {
  operador?: string;
  tempo_gasto_sla_resposta?: string;
  tempo_gasto_sla_solucao?: string;
  total_sla_resposta?: string;
  total_sla_solucao?: string;
}

export type SlaDurationField =
  | "tempo_gasto_sla_resposta"
  | "tempo_gasto_sla_solucao";

export type SlaTargetField = "total_sla_resposta" | "total_sla_solucao";

export interface OperatorSlaTimeAverage {
  nome: string;
  mediaMinutos: number;
  amostras: number;
}

const MISSING_DURATION_VALUES = new Set([
  "",
  "nao possui",
  "não possui",
  "null",
  "undefined",
  "-",
]);

export const parseSlaDurationMinutes = (value?: string | null): number | null => {
  const normalized = String(value ?? "").trim().toLocaleLowerCase("pt-BR");
  if (MISSING_DURATION_VALUES.has(normalized)) return null;

  const parts = normalized.split(":");
  if (parts.length < 2 || parts.length > 3) return null;

  const numbers = parts.map(Number);
  if (numbers.some((part) => !Number.isFinite(part) || part < 0)) return null;

  const [hours, minutes, seconds = 0] = numbers;
  if (minutes >= 60 || seconds >= 60) return null;
  return hours * 60 + minutes + seconds / 60;
};

const average = (values: number[]): number =>
  values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : 0;

export const calculateSlaTimeAverage = (
  records: SlaTimeRecord[],
  field: SlaDurationField,
): { mediaMinutos: number; amostras: number } => {
  const values = records
    .map((record) => parseSlaDurationMinutes(record[field]))
    .filter((value): value is number => value !== null);

  return {
    mediaMinutos: average(values),
    amostras: values.length,
  };
};

export const calculateSlaTimeByOperator = (
  records: SlaTimeRecord[],
  field: SlaDurationField,
): OperatorSlaTimeAverage[] => {
  const grouped = new Map<string, number[]>();

  records.forEach((record) => {
    const operator = String(record.operador ?? "").replace(/\s+/g, " ").trim();
    const duration = parseSlaDurationMinutes(record[field]);
    if (!operator || duration === null) return;

    const values = grouped.get(operator) ?? [];
    values.push(duration);
    grouped.set(operator, values);
  });

  return Array.from(grouped.entries())
    .map(([nome, values]) => ({
      nome,
      mediaMinutos: average(values),
      amostras: values.length,
    }))
    .sort((a, b) => b.mediaMinutos - a.mediaMinutos);
};

export const getPredominantSlaTarget = (
  records: SlaTimeRecord[],
  field: SlaTargetField,
  fallbackMinutes: number,
): number => {
  const occurrences = new Map<number, number>();

  records.forEach((record) => {
    const duration = parseSlaDurationMinutes(record[field]);
    if (duration === null || duration <= 0) return;
    occurrences.set(duration, (occurrences.get(duration) ?? 0) + 1);
  });

  let predominant = fallbackMinutes;
  let highestCount = 0;
  occurrences.forEach((count, duration) => {
    if (count > highestCount) {
      predominant = duration;
      highestCount = count;
    }
  });

  return predominant;
};
