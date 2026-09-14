import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchNativeSlaTickets,
  mapNativeSlaTicket,
} from "./slaTicketService";

const nativeTicket = {
  codigo: 123,
  cliente: "Cliente Exemplo",
  contato: "Contato",
  tecnico: "Victor Brandão",
  status: "Finalizado",
  tipo_ticket: "Alterações",
  mesa_trabalho: "Suporte",
  data_criacao: "2026-09-10 08:00:00",
  data_resposta: "2026-09-10 08:05:00",
  data_solucao: "2026-09-10 09:00:00",
  total_horas: "01:00",
  sla: {
    total_sla_resposta_programado: "00:07",
    total_sla_solucao_programado: "04:00",
    data_expiracao_sla: "2026-09-10 12:05:00",
    status_sla_resposta: "Em conformidade",
    status_sla_solucao: "Em conformidade",
    resposta: { tempo_gasto: "00:05" },
    solucao: { tempo_gasto: "00:55" },
  },
};

test("mapeia exclusivamente os tempos e metas nativos do SLA", () => {
  const mapped = mapNativeSlaTicket(nativeTicket);

  assert.equal(mapped.tempo_gasto_sla_resposta, "00:05");
  assert.equal(mapped.tempo_gasto_sla_solucao, "00:55");
  assert.equal(mapped.total_sla_resposta, "00:07");
  assert.equal(mapped.total_sla_solucao, "04:00");
  assert.equal(mapped.operador, "Victor");
});

test("filtra no cliente e interrompe a paginação antiga ao atingir o início", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (async () => {
    requests += 1;
    return new Response(JSON.stringify({
      lista: [
        nativeTicket,
        { ...nativeTicket, codigo: 122, data_criacao: "2026-08-31 17:00:00" },
      ],
      meta: { paginate: { last_page: 50 } },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  try {
    const tickets = await fetchNativeSlaTickets({
      data_inicial: "2026-09-01 00:00:00",
      data_final: "2026-09-14 23:59:59",
    });

    assert.equal(requests, 1);
    assert.deepEqual(tickets.map((ticket) => ticket.ticket), ["123"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
