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

export const parseSatisfactionEvaluationDate = (value: unknown): Date | null => {
  const normalized = normalizeValue(value);
  if (!normalized) return null;

  const brDateMatch = normalized.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (brDateMatch) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = brDateMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(normalized.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isSatisfactionEvaluationWithinRange = (
  survey: Pick<SatisfactionSurveyRecord, "data_avaliacao">,
  rangeStart?: Date | null,
  rangeEnd?: Date | null,
): boolean => {
  if (!rangeStart && !rangeEnd) return true;

  const evaluatedAt = parseSatisfactionEvaluationDate(survey.data_avaliacao);
  if (!evaluatedAt) return false;

  if (rangeStart && evaluatedAt < rangeStart) return false;
  if (rangeEnd && evaluatedAt > rangeEnd) return false;
  return true;
};

export const isSatisfactionEvaluationNewSince = (
  survey: Pick<SatisfactionSurveyRecord, "data_avaliacao">,
  since: Date,
): boolean => {
  const evaluatedAt = parseSatisfactionEvaluationDate(survey.data_avaliacao);
  return Boolean(evaluatedAt && evaluatedAt >= since);
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
