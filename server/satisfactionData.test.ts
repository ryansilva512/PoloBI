import test from "node:test";
import assert from "node:assert/strict";
import {
  mapTicketToSatisfactionRecord,
  mergeSatisfactionRecords,
  parseSatisfactionCsv,
} from "./satisfactionData";

test("converte um chamado avaliado para o contrato da tela", () => {
  assert.deepEqual(mapTicketToSatisfactionRecord({
    codigo: 1224009251,
    tecnico: "Ryan Silva",
    total_avaliacao: 5,
    data_criacao: "2026-09-03 12:38:28",
    data_modificacao: "2026-09-03 13:47:15",
    cliente: "Cliente",
    contato: "Contato",
    categoria_primaria: "Produto",
    categoria_secundaria: "Configuração",
  }), {
    data_criacao: "2026-09-03 12:38:28",
    contato: "Contato",
    descricao_avaliacao: "Não possui",
    nota: "5",
    data_avaliacao: "2026-09-03 14:47:15",
    ticket: "1224009251",
    razao_social: "Cliente",
    categoria: "Produto / Configuração",
    operador: "Ryan",
    ticket_excluido: "Não",
  });
});

test("a avaliação prevalece ao unir a coorte criada com os tickets avaliados", () => {
  const records = mergeSatisfactionRecords(
    [{ codigo: 10, tecnico: "Ryan Silva", data_criacao: "2026-09-01 10:00:00" }],
    [{
      codigo: 10,
      tecnico: "Ryan Silva",
      data_criacao: "2026-09-01 10:00:00",
      data_modificacao: "2026-09-02 11:00:00",
      total_avaliacao: 5,
    }],
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].operador, "Ryan");
  assert.equal(records[0].nota, "5");
  assert.equal(records[0].data_avaliacao, "2026-09-02 12:00:00");
});

test("o fallback CSV respeita ponto e vírgula dentro de campo entre aspas", () => {
  const csv = [
    '"DATA DE CRIAÇÃO DO TICKET";"CONTATO DO TICKET";"DESCRIÇÃO DA AVALIAÇÃO";"NOTA DA AVALIAÇÃO";"DATA DA AVALIAÇÃO";"TICKET";"RAZÃO SOCIAL DO CLIENTE";"NOME DA CATEGORIA";"NOME DO OPERADOR";"TICKET EXCLUÍDO"',
    '"03/09/2026";"Contato";"Rápido; resolveu";"5";"03/09/2026 14:00";"10";"Cliente";"Categoria";"Ryan";"Não"',
  ].join("\n");

  const records = parseSatisfactionCsv(csv);
  assert.equal(records.length, 1);
  assert.equal(records[0].descricao_avaliacao, "Rápido; resolveu");
  assert.equal(records[0].operador, "Ryan");
});
