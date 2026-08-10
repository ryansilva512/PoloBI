import test from "node:test";
import assert from "node:assert/strict";
import {
  getAnsweredSatisfactionKey,
  parseSatisfactionScore,
} from "./satisfactionSurveyClassifier";

test("pesquisa criada ou enviada sem resposta não gera uma avaliação", () => {
  for (const nota of [undefined, null, "", "0", 0, "Sem resposta", "Não possui", "-"]) {
    assert.equal(
      getAnsweredSatisfactionKey({
        ticket: "123",
        nota,
        data_avaliacao: "2026-08-10 10:30:00",
      }),
      null,
    );
  }

  for (const data_avaliacao of [undefined, null, "", "Sem resposta", "Não possui", "-"]) {
    assert.equal(getAnsweredSatisfactionKey({ ticket: "123", nota: "5", data_avaliacao }), null);
  }
});

test("somente uma nota real entre 1 e 5 identifica resposta do cliente", () => {
  assert.equal(parseSatisfactionScore("5"), 5);
  assert.equal(parseSatisfactionScore("4,5"), 4.5);
  assert.equal(parseSatisfactionScore("6"), null);
  assert.equal(parseSatisfactionScore("5 - Excelente"), null);

  assert.equal(
    getAnsweredSatisfactionKey({
      ticket: "123",
      operador: "Maria",
      nota: "5,0",
      data_avaliacao: "2026-08-10 10:30:00",
    }),
    "123|Maria|5|2026-08-10 10:30:00",
  );
});

test("a transição de pendente para respondida cria a chave apenas após a nota", () => {
  const pending = getAnsweredSatisfactionKey({
    ticket: "77",
    nota: "Não possui",
    data_avaliacao: "Não possui",
  });
  const answered = getAnsweredSatisfactionKey({
    ticket: "77",
    nota: "4",
    data_avaliacao: "2026-08-10 10:45:00",
  });

  assert.equal(pending, null);
  assert.equal(answered, "77||4|2026-08-10 10:45:00");
});
