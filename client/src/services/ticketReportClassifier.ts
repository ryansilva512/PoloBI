export interface TicketReportRecord {
  ticket: string | number;
  status?: string | null;
  ticket_excluido?: string | null;
}

export type TicketReportTransitionType = "deleted" | "finalized";

export interface TicketReportTransition<T extends TicketReportRecord> {
  ticketId: string;
  type: TicketReportTransitionType;
  current: T;
  previous: T;
}

export interface TicketReportClassification<T extends TicketReportRecord> {
  nextBaseline: Map<string, T>;
  transitions: TicketReportTransition<T>[];
}

const normalizeMilvusValue = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const isTicketDeleted = (value?: string | null): boolean =>
  ["sim", "yes", "true", "1"].includes(normalizeMilvusValue(value));

export const isTicketFinished = (value?: string | null): boolean =>
  normalizeMilvusValue(value) === "finalizado";

export function classifyTicketReportTransition<T extends TicketReportRecord>(
  previous: T,
  current: T,
): TicketReportTransitionType | null {
  const deletedNow = isTicketDeleted(current.ticket_excluido);

  if (deletedNow && !isTicketDeleted(previous.ticket_excluido)) return "deleted";
  if (
    !deletedNow
    && isTicketFinished(current.status)
    && !isTicketFinished(previous.status)
  ) {
    return "finalized";
  }

  return null;
}

/**
 * Classifica apenas transições confirmadas entre duas respostas do relatório.
 * Registros ausentes permanecem no baseline e jamais viram finalização por inferência.
 */
export function classifyTicketReportSnapshot<T extends TicketReportRecord>(
  previousById: ReadonlyMap<string, T>,
  currentTickets: readonly T[],
  knownDeletedTicketIds: ReadonlySet<string> = new Set<string>(),
): TicketReportClassification<T> {
  const nextBaseline = new Map(previousById);
  const transitions: TicketReportTransition<T>[] = [];
  const deletedInSnapshot = new Set<string>();

  for (const current of currentTickets) {
    const ticketId = String(current.ticket ?? "").trim();
    if (!ticketId) continue;

    const previous = previousById.get(ticketId);
    nextBaseline.set(ticketId, current);
    if (!previous) continue;

    const type = classifyTicketReportTransition(previous, current);
    if (type === "deleted") deletedInSnapshot.add(ticketId);
    if (
      type === "finalized"
      && (knownDeletedTicketIds.has(ticketId) || deletedInSnapshot.has(ticketId))
    ) continue;
    if (type) transitions.push({ ticketId, type, current, previous });
  }

  return { nextBaseline, transitions };
}
