export interface SatisfactionSurveyRecord {
  ticket?: unknown;
  nota?: unknown;
  operador?: unknown;
  data_avaliacao?: unknown;
}

const normalizeValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";

const EMPTY_RESPONSE_VALUES = new Set([
  "",
  "nao possui",
  "sem resposta",
  "null",
  "undefined",
  "-",
]);

const hasMeaningfulValue = (value: unknown) => {
  const normalized = normalizeValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return !EMPTY_RESPONSE_VALUES.has(normalized);
};

export const parseSatisfactionScore = (value: unknown): number | null => {
  const normalized = normalizeValue(value).replace(",", ".");
  if (!normalized) return null;

  const score = Number(normalized);
  return Number.isFinite(score) && score >= 1 && score <= 5 ? score : null;
};

export const getAnsweredSatisfactionKey = (
  survey: SatisfactionSurveyRecord,
): string | null => {
  const ticket = normalizeValue(survey.ticket);
  const score = parseSatisfactionScore(survey.nota);
  if (!hasMeaningfulValue(ticket) || score === null || !hasMeaningfulValue(survey.data_avaliacao)) {
    return null;
  }

  const operator = normalizeValue(survey.operador);
  const answeredAt = normalizeValue(survey.data_avaliacao);
  return `${ticket}|${operator}|${score}|${answeredAt}`;
};
