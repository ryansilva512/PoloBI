import test from "node:test";
import assert from "node:assert/strict";
import {
  NotificationStore,
  buildAnnouncementText,
  getNotificationDedupeKey,
  type NovoChamadoData,
  type PesquisaSatisfacaoData,
} from "./notificationStore";
import type { AnnouncementRequest } from "../services/announcementQueue";

class QueueFake {
  requests: AnnouncementRequest[] = [];

  enqueue(request: AnnouncementRequest): boolean {
    this.requests.push(request);
    return true;
  }

  cancel(): boolean {
    return false;
  }
}

test("store mantém FIFO e deduplica o mesmo evento", () => {
  const queue = new QueueFake();
  const store = new NotificationStore(queue);
  const first: NovoChamadoData = {
    codigo: 42,
    assunto: "Acesso ao painel",
    nome_fantasia: "Cliente Exemplo",
    data_criacao: "2026-08-10T10:00:00-04:00",
  };

  const firstId = store.add("novo_chamado", first);
  assert.equal(store.add("novo_chamado", { ...first }), firstId);
  store.add("chamado_atribuido", {
    codigo: 42,
    assunto: first.assunto,
    nome_fantasia: first.nome_fantasia,
    nome: "Ryan",
  });

  assert.deepEqual(store.getAll().map((item) => item.type), ["novo_chamado", "chamado_atribuido"]);
  assert.equal(queue.requests.length, 2);
  assert.equal(store.getAll()[0].duration, 6_000);
});

test("deduplica estritamente por tipo e código mesmo com payload alterado", () => {
  const base: NovoChamadoData = { codigo: 7, assunto: "Teste", data_criacao: "2026-08-10" };
  assert.equal(
    getNotificationDedupeKey("novo_chamado", base),
    getNotificationDedupeKey("novo_chamado", { ...base, data_criacao: "2026-08-11" }),
  );

  const survey: PesquisaSatisfacaoData = { ticket: "7", operador: "Ryan", nota: "5" };
  assert.equal(
    getNotificationDedupeKey("pesquisa_satisfacao", survey),
    getNotificationDedupeKey("pesquisa_satisfacao", { ...survey, nota: "4" }),
  );
});

test("comentário da avaliação não entra no texto narrado", () => {
  const text = buildAnnouncementText("pesquisa_satisfacao", {
    ticket: "123",
    razao_social: "Empresa",
    operador: "Carlos",
    nota: "5",
    descricao_avaliacao: "comentário somente visual",
  });

  assert.match(text, /nota 5/);
  assert.doesNotMatch(text, /comentário somente visual/);
});

test("fala omite o código e mantém o nome do operador", () => {
  const assigned = buildAnnouncementText("chamado_atribuido", {
    codigo: 987654,
    assunto: "Acesso",
    nome_fantasia: "Empresa Exemplo",
    nome: "Mariana Souza",
  });

  assert.equal(
    assigned,
    "O operador dom Mariana Souza, assumiu o chamado do cliente Empresa Exemplo.",
  );
  assert.doesNotMatch(assigned, /987654/);
});

test("usa a nomenclatura definida para avaliação, finalização e exclusão", () => {
  assert.equal(buildAnnouncementText("pesquisa_satisfacao", {
    ticket: "10",
    razao_social: "Cliente Exemplo",
    operador: "Carlos",
    nota: "5",
  }), "Nova avaliação. O cliente Cliente Exemplo, avaliou o operador Carlos, com nota 5.");

  assert.equal(buildAnnouncementText("finalizado", {
    codigo: 10,
    assunto: "Acesso",
    nome_fantasia: "Cliente Exemplo",
    nome: "Carlos",
  }), "O chamado do cliente Cliente Exemplo, foi finalizado pelo operador Carlos.");

  assert.equal(buildAnnouncementText("chamado_excluido", {
    codigo: 10,
    nome_fantasia: "Cliente Exemplo",
  }), "O chamado do cliente Cliente Exemplo, foi identificado como excluído no Milvus.");
});

test("erro 502 permanece visual, mas não gera texto de voz", () => {
  assert.equal(buildAnnouncementText("erro_milvus", {
    status: 502,
    message: "Bad Gateway",
  }), "");
});
