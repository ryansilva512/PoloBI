import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyTicketReportSnapshot,
  type TicketReportRecord,
} from "./ticketReportClassifier";

const ticket = (
  id: string,
  status = "Aberto",
  ticket_excluido = "Não",
): TicketReportRecord => ({ ticket: id, status, ticket_excluido });

test("primeira consulta cria o baseline sem alertas históricos", () => {
  const result = classifyTicketReportSnapshot(new Map(), [
    ticket("10", "Finalizado"),
    ticket("11", "Aberto", "Sim"),
  ]);

  assert.equal(result.nextBaseline.size, 2);
  assert.deepEqual(result.transitions, []);
});

test("emite exclusão uma única vez na transição do campo para Sim", () => {
  const baseline = new Map([["42", ticket("42")]]);
  const deleted = classifyTicketReportSnapshot(baseline, [ticket("42", "Aberto", " Sim ")]);

  assert.deepEqual(deleted.transitions.map(({ ticketId, type }) => ({ ticketId, type })), [
    { ticketId: "42", type: "deleted" },
  ]);

  const unchanged = classifyTicketReportSnapshot(
    deleted.nextBaseline,
    [ticket("42", "Finalizado", "Não")],
    new Set(["42"]),
  );
  assert.deepEqual(unchanged.transitions, []);
});

test("finaliza somente por transição explícita de status", () => {
  const baseline = new Map([["7", ticket("7", "Em atendimento")]]);
  const result = classifyTicketReportSnapshot(baseline, [ticket("7", " FINALIZADO ")]);

  assert.equal(result.transitions[0]?.type, "finalized");
});

test("sumiço ou resposta parcial não classifica nem remove chamados", () => {
  const baseline = new Map([
    ["1", ticket("1")],
    ["2", ticket("2", "Em atendimento")],
  ]);
  const result = classifyTicketReportSnapshot(baseline, [ticket("2", "Em atendimento")]);

  assert.deepEqual(result.transitions, []);
  assert.equal(result.nextBaseline.has("1"), true);
  assert.equal(result.nextBaseline.size, 2);
});
