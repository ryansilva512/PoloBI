import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSlaTimeAverage,
  calculateSlaTimeByOperator,
  getPredominantSlaTarget,
  parseSlaDurationMinutes,
  type SlaTimeRecord,
} from "./slaTimeMetrics";

test("converte durações de SLA sem limitar horas acima de 24", () => {
  assert.equal(parseSlaDurationMinutes("00:07"), 7);
  assert.equal(parseSlaDurationMinutes("08:30:30"), 510.5);
  assert.equal(parseSlaDurationMinutes("1931:20"), 115_880);
  assert.equal(parseSlaDurationMinutes("Não possui"), null);
  assert.equal(parseSlaDurationMinutes("01:75"), null);
});

test("calcula a mesma média real no resumo e por operador, sem cap", () => {
  const records: SlaTimeRecord[] = [
    { operador: "Andre", tempo_gasto_sla_resposta: "03:00" },
    { operador: "Andre", tempo_gasto_sla_resposta: "05:00" },
    { operador: "Moraes", tempo_gasto_sla_resposta: "00:10" },
  ];

  const general = calculateSlaTimeAverage(records, "tempo_gasto_sla_resposta");
  const byOperator = calculateSlaTimeByOperator(records, "tempo_gasto_sla_resposta");

  assert.equal(general.mediaMinutos, (180 + 300 + 10) / 3);
  assert.equal(general.amostras, 3);
  assert.deepEqual(byOperator, [
    { nome: "Andre", mediaMinutos: 240, amostras: 2 },
    { nome: "Moraes", mediaMinutos: 10, amostras: 1 },
  ]);
});

test("usa a meta programada predominante do período", () => {
  const records: SlaTimeRecord[] = [
    { total_sla_resposta: "00:07", total_sla_solucao: "04:00" },
    { total_sla_resposta: "00:07", total_sla_solucao: "04:00" },
    { total_sla_resposta: "00:05", total_sla_solucao: "02:00" },
  ];

  assert.equal(getPredominantSlaTarget(records, "total_sla_resposta", 5), 7);
  assert.equal(getPredominantSlaTarget(records, "total_sla_solucao", 240), 240);
  assert.equal(getPredominantSlaTarget([], "total_sla_resposta", 5), 5);
});
