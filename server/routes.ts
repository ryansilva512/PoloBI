import type { Express } from "express";
import { createServer, type Server } from "http";
import { format, parseISO, isValid } from "date-fns";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ========== AUTHENTICATION ENDPOINT ==========
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Credenciais do admin DEVEM estar no .env (sem fallback hardcoded por segurança)
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

      // Verificar se as credenciais estão configuradas
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return res.status(500).json({
          success: false,
          message: "Credenciais de admin não configuradas no servidor"
        });
      }

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Login bem-sucedido
        res.json({
          success: true,
          user: {
            email: ADMIN_EMAIL,
            name: "Administrador",
            role: "admin"
          },
          token: Buffer.from(`${ADMIN_EMAIL}:${Date.now()}`).toString('base64')
        });
      } else {
        // Credenciais inválidas
        res.status(401).json({
          success: false,
          message: "Email ou senha inválidos"
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message
      });
    }
  });

  // Endpoint para verificar sessão
  app.get("/api/auth/verify", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false });
    }
  });

  // Endpoint de logout (apenas para logging)
  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true, message: "Logout realizado com sucesso" });
  });
  // ========== END AUTHENTICATION ==========
  // Test connectivity
  app.get("/api/test-connectivity", async (req, res) => {
    try {
      const response = await fetch("https://httpbin.org/get");
      res.json({
        success: true,
        message: "Internet connection OK",
        status: response.status
      });
    } catch (error: any) {
      res.json({
        success: false,
        message: "Internet connection FAILED",
        error: error.message,
        cause: error.cause?.message || null
      });
    }
  });

  // Test MILVUS API connection
  app.get("/api/test-milvus", async (req, res) => {
    try {
      // Token DEVE estar no .env por segurança
      const API_KEY = process.env.MILVUS_API_KEY;
      const MILVUS_URL = "https://apiintegracao.milvus.com.br/api/relatorio-atendimento/listagem";

      console.log("=== TEST MILVUS ===");
      console.log("API_KEY configurada:", !!API_KEY);

      if (!API_KEY) {
        return res.json({
          success: false,
          error: "MILVUS_API_KEY não configurada",
          message: "Adicione a chave no arquivo .env com: MILVUS_API_KEY=sua_chave",
          configured: false
        });
      }

      console.log("Testing MILVUS API at:", MILVUS_URL);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      console.log("Tentando com header 'Authorization'");
      const response = await fetch(MILVUS_URL, {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagina: 1,
          page: 1,
          limit: 10,
          per_page: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MILVUS API error:", {
          status: response.status,
          statusText: response.statusText,
          bodyLength: errorText.length
        });

        return res.json({
          success: false,
          error: `MILVUS API returned ${response.status}`,
          status: response.status,
          statusText: response.statusText,
        });
      }

      const data = await response.json();
      console.log("MILVUS Response OK:", {
        status: response.status,
        dataLength: data?.lista?.length,
      });

      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        dataLength: data?.lista?.length || 0,
        meta: data?.meta,
      });
    } catch (error: any) {
      console.error("MILVUS API Error:", {
        message: error.message,
        code: error.code,
        cause: error.cause?.message,
        name: error.name
      });
      res.json({
        success: false,
        error: error.message,
        code: error.code,
        cause: error.cause?.message || null,
      });
    }
  });

  // Proxy for MILVUS relatorio-atendimento API
  app.post("/api/proxy/relatorio-atendimento/listagem", async (req, res) => {
    // Token DEVE estar no .env por segurança
    const API_KEY = process.env.MILVUS_API_KEY;
    const MILVUS_URL = "https://apiintegracao.milvus.com.br/api/relatorio-atendimento/listagem";

    if (!API_KEY) {
      console.error("ERRO: MILVUS_API_KEY não configurada no .env!");
      return res.status(500).json({
        success: false,
        error: "MILVUS_API_KEY não configurada",
        message: "Adicione a chave no arquivo .env"
      });
    }

    console.log("=== MILVUS Proxy Request ===");
    console.log("API_KEY configurada: sim");
    console.log("URL:", MILVUS_URL);
    console.log("Request body com filtros:", {
      data_inicial: req.body?.data_inicial,
      data_final: req.body?.data_final,
      analista: req.body?.analista,
      mesa_trabalho: req.body?.mesa_trabalho,
      pagina: req.body?.pagina ?? req.body?.page,
      page: req.body?.page,
      limit: req.body?.limit ?? req.body?.per_page,
      per_page: req.body?.per_page
    });

    const formatDateForApi = (value?: string | null, type: "start" | "end" = "start") => {
      if (!value) return value;
      let parsed: Date | null = null;

      // tenta ISO (yyyy-MM-dd...)
      try {
        const maybe = parseISO(value);
        if (isValid(maybe)) parsed = maybe;
      } catch (_) {
        /* ignore */
      }

      // fallback para Date nativo
      if (!parsed) {
        const maybe = new Date(value);
        if (!Number.isNaN(maybe.getTime())) parsed = maybe;
      }

      if (!parsed) return value;
      const adjusted =
        type === "start"
          ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0)
          : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59);
      return format(adjusted, "yyyy-MM-dd");
    };

    const pageSize = req.body?.limit ?? req.body?.per_page ?? 50;
    const pageParam = req.body?.pagina ?? req.body?.page ?? 1;

    const filtroBody: Record<string, any> = {};
    const addIf = (key: string, value: any) => {
      if (value !== undefined && value !== null && value !== "") {
        filtroBody[key] = value;
      }
    };
    addIf("data_inicial", formatDateForApi(req.body?.data_inicial, "start"));
    addIf("data_final", formatDateForApi(req.body?.data_final, "end"));
    addIf("analista", req.body?.analista);
    addIf("mesa_trabalho", req.body?.mesa_trabalho);

    const baseBody = {
      filtro_body: filtroBody,
      total_registros: pageSize,
    };

    console.log("Payload enviado para MILVUS (normalizado):", {
      pagina: pageParam,
      limit: pageSize,
      filtro_body: filtroBody,
    });

    const fetchPage = async (page: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const urlWithPage = `${MILVUS_URL}?pagina=${page}&limit=${pageSize}`;

      const response = await fetch(urlWithPage, {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...baseBody,
          pagina: page,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MILVUS API error response:", {
          status: response.status,
          statusText: response.statusText,
          bodyLength: errorText.length
        });
        throw new Error(`MILVUS API returned ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    try {
      const firstPage = await fetchPage(1);
      const perPage = firstPage?.meta?.per_page || firstPage?.meta?.perPage || pageSize || 50;
      const totalFromMeta = firstPage?.meta?.total || 0;
      const totalPages =
        firstPage?.meta?.last_page ||
        firstPage?.meta?.lastPage ||
        (perPage > 0 ? Math.ceil(totalFromMeta / perPage) : 1) ||
        1;
      const allTickets = [...(firstPage.lista || [])];

      console.log("MILVUS first page:", {
        listaLength: firstPage.lista?.length,
        totalPages,
        perPage,
        totalFromMeta: firstPage.meta?.total
      });

      for (let page = 2; page <= totalPages; page++) {
        const pageData = await fetchPage(page);
        console.log("MILVUS page fetched:", page, "length:", pageData.lista?.length);
        allTickets.push(...(pageData.lista || []));
      }

      const combinedResponse = {
        meta: {
          ...firstPage.meta,
          current_page: 1,
          last_page: 1,
          per_page: allTickets.length,
          total: allTickets.length,
          to: allTickets.length,
          from: allTickets.length > 0 ? 1 : 0,
        },
        lista: allTickets,
      };

      return res.json(combinedResponse);
    } catch (error: any) {
      console.error("MILVUS Proxy Error:", {
        message: error.message,
        code: error.code,
        name: error.name
      });

      return res.status(502).json({
        success: false,
        error: "Falha ao consultar a API MILVUS",
        detail: error.message,
      });
    }
  });

  // Dashboard Summary
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Tendências (time series)
  app.get("/api/dashboard/tendencias", async (req, res) => {
    try {
      const periodo = (req.query.periodo as string) || "30dias";
      const tendencias = await storage.getTendencias(periodo);
      res.json(tendencias);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tendencias" });
    }
  });

  // Tickets
  app.get("/api/tickets", async (req, res) => {
    try {
      const filter = {
        canal: req.query.canal as string | undefined,
        prioridade: req.query.prioridade as string | undefined,
        departamento: req.query.departamento as string | undefined,
        agente: req.query.agente as string | undefined,
      };
      const tickets = await storage.getTicketsByFilter(filter);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Tickets em risco de SLA
  app.get("/api/tickets/sla-risco", async (req, res) => {
    try {
      const tickets = await storage.getTicketsEmRiscoSLA();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tickets em risco" });
    }
  });

  // Agentes
  app.get("/api/agentes", async (req, res) => {
    try {
      const agentes = await storage.getAgentes();
      res.json(agentes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agentes" });
    }
  });

  // Prioridade Distribuição
  app.get("/api/dashboard/prioridade-distribuicao", async (req, res) => {
    try {
      const dist = await storage.getPrioridadeDistribuicao();
      res.json(dist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prioridade distribuicao" });
    }
  });

  // Canal Distribuição
  app.get("/api/dashboard/canal-distribuicao", async (req, res) => {
    try {
      const dist = await storage.getCanalDistribuicao();
      res.json(dist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch canal distribuicao" });
    }
  });

  // Aging buckets
  app.get("/api/dashboard/aging", async (req, res) => {
    try {
      const aging = await storage.getAging();
      res.json(aging);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aging" });
    }
  });

  // SLA Compliance
  app.get("/api/dashboard/sla-compliance", async (req, res) => {
    try {
      const periodo = (req.query.periodo as string) || "30dias";
      const compliance = await storage.getSLACompliance(periodo);
      res.json(compliance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SLA compliance" });
    }
  });

  // Departamento Performance
  app.get("/api/dashboard/departamento-performance", async (req, res) => {
    try {
      const performance = await storage.getDepartamentoPerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departamento performance" });
    }
  });

  // CSAT Distribuição
  app.get("/api/dashboard/csat-distribuicao", async (req, res) => {
    try {
      const dist = await storage.getCSATDistribuicao();
      res.json(dist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CSAT distribuicao" });
    }
  });

  // CSAT Tendência
  app.get("/api/dashboard/csat-tendencia", async (req, res) => {
    try {
      const periodo = (req.query.periodo as string) || "30dias";
      const tendencia = await storage.getCSATTendencia(periodo);
      res.json(tendencia);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CSAT tendencia" });
    }
  });

  // NPS Tendência
  app.get("/api/dashboard/nps-tendencia", async (req, res) => {
    try {
      const periodo = (req.query.periodo as string) || "30dias";
      const tendencia = await storage.getNPSTendencia(periodo);
      res.json(tendencia);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NPS tendencia" });
    }
  });

  // Custos
  app.get("/api/dashboard/custos", async (req, res) => {
    try {
      const periodo = (req.query.periodo as string) || "30dias";
      const custos = await storage.getCustos(periodo);
      res.json(custos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custos" });
    }
  });

  // Volume Tendência
  app.get("/api/dashboard/volume-tendencia", async (req, res) => {
    try {
      const periodo = (req.query.periodo as string) || "30dias";
      const tendencia = await storage.getVolumeTendencia(periodo);
      res.json(tendencia);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch volume tendencia" });
    }
  });

  // ============================================
  // Proxy para API de Chamados com filtro de status
  // ============================================
  app.post("/api/proxy/chamado/listagem", async (req, res) => {
    const API_KEY = process.env.MILVUS_API_KEY;
    const MILVUS_URL = "https://apiintegracao.milvus.com.br/api/chamado/listagem";

    if (!API_KEY) {
      console.error("ERRO: MILVUS_API_KEY não configurada no .env!");
      return res.status(500).json({
        success: false,
        error: "MILVUS_API_KEY não configurada",
        message: "Adicione a chave no arquivo .env"
      });
    }

    // Extrair parâmetros do request
    const { status = "ChamadosAbertos", pagina = 1, total_registros = 50 } = req.body;

    // Mapear valores de status para os valores aceitos pela API Milvus
    // A API usa 'ChamadosAbertos' para listar chamados em atendimento
    const statusMap: Record<string, string> = {
      'EmAtendimento': 'ChamadosAbertos',
      'Atendendo': 'ChamadosAbertos',
      'ChamadosAbertos': 'ChamadosAbertos',
    };
    const statusFinal = statusMap[status] || status;

    console.log("=== CHAMADOS Proxy Request ===");
    console.log("Status recebido:", status, "→ enviado:", statusFinal);
    console.log("Pagina:", pagina);

    // Construir body conforme documentação Milvus
    const milvusBody = {
      filtro_body: {
        cliente_token: "",
        status: statusFinal
      },
      is_descending: true,
      order_by: "data_criacao",
      total_registros: total_registros,
      pagina: pagina
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(MILVUS_URL, {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(milvusBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MILVUS Chamados API error:", response.status, errorText);
        return res.status(response.status).json({
          success: false,
          error: `API retornou ${response.status}`,
          details: errorText
        });
      }

      const data = await response.json();

      console.log("MILVUS Chamados API success:", {
        total: data?.meta?.paginate?.total,
        registros: data?.lista?.length
      });

      res.json(data);
    } catch (error: any) {
      console.error("MILVUS Chamados proxy error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  return httpServer;
}
