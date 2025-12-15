import type { Express } from "express";
import { createServer, type Server } from "http";
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
      const API_KEY = "dMHE29hFX9YUOQWFXlu0QGeft2MOQEoBS6R7UEnalEjPodSl0j0BE5krXyxGPJax9tVJz6RblIAHR5OVpblnvhQQ2WDjTZEe9GoF7";
      const MILVUS_URL = "https://aplintegracao.milvus.com.br/api/relatorio-atendimento/listagem";
      
      console.log("Testing MILVUS API at:", MILVUS_URL);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

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
    try {
      const API_KEY = "dMHE29hFX9YUOQWFXlu0QGeft2MOQEoBS6R7UEnalEjPodSl0j0BE5krXyxGPJax9tVJz6RblIAHR5OVpblnvhQQ2WDjTZEe9GoF7";
      const MILVUS_URL = "https://aplintegracao.milvus.com.br/api/relatorio-atendimento/listagem";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(MILVUS_URL, {
        method: "POST",
        headers: {
          "Authorization": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`MILVUS API returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Proxy Error:", error.message);
      res.status(500).json({ 
        error: error.message,
        code: error.code
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
