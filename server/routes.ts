import type { Express } from "express";
import { createServer, type Server } from "http";
import { format, parseISO, isValid } from "date-fns";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      // Tenta carregar do .env, se não conseguir usa hardcoded
      const API_KEY = process.env.MILVUS_API_KEY || "dMHE29hFX9YUOQWFXlu0QGeft2MOQEoBS6R7UEnalEjPodSl0j0BE5krXyxGPJax9tVJz6RblIAHR5OVpblnvhQQ2WDjTZEe9GoF7";
      const MILVUS_URL = "https://apiintegracao.milvus.com.br/api/relatorio-atendimento/listagem";
      
      console.log("=== TEST MILVUS ===");
      console.log("API_KEY vazia?", !API_KEY);
      console.log("API_KEY length:", API_KEY.length);
      
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
          limit: 10,
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

  
// Proxy para MILVUS API - relatorio-atendimento
  app.post("/api/proxy/relatorio-atendimento/listagem", async (req, res) => {
    const API_KEY = process.env.MILVUS_API_KEY || "dMHE29hFX9YUOQWFXlu0QGeft2MOQEoBS6R7UEnalEjPodSl0j0BE5krXyxGPJax9tVJz6RblIAHR5OVpblnvhQQ2WDjTZEe9GoF7";
    const MILVUS_URL = "https://apiintegracao.milvus.com.br/api/relatorio-atendimento/listagem";

    console.log("=== MILVUS Proxy Request ===");
    console.log("API_KEY presente:", !!API_KEY);
    console.log("API_KEY comprimento:", API_KEY.length);
    console.log("API_KEY valor:", API_KEY.substring(0, 10) + "...");
    console.log("URL:", MILVUS_URL);
    console.log("Request body com filtros:", {
      data_inicial: req.body?.data_inicial,
      data_final: req.body?.data_final,
      analista: req.body?.analista,
      mesa_trabalho: req.body?.mesa_trabalho,
      pagina: req.body?.pagina,
      limit: req.body?.limit
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
      // A API retorna datas no formato "yyyy-MM-dd HH:mm:ss", entãoutilizamos o mesmo formato ao enviar.
      return format(adjusted, "yyyy-MM-dd HH:mm:ss");
    };

    const baseBody = {
      ...req.body,
      data_inicial: formatDateForApi(req.body?.data_inicial, "start"),
      data_final: formatDateForApi(req.body?.data_final, "end"),
    };

    console.log("Payload enviado para MILVUS (normalizado):", {
      ...baseBody,
      pagina: req.body?.pagina,
      limit: req.body?.limit,
    });

    const fetchPage = async (page: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(MILVUS_URL, {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...baseBody, pagina: page }),
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
      // primeira p?gina
      const firstPage = await fetchPage(1);
      const totalPages = firstPage?.meta?.last_page || 1;
      const perPage = firstPage?.meta?.per_page || req.body?.limit || 50;
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
        // meta reescrito para representar um único "lote" já agregado
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

  return httpServer;
}
