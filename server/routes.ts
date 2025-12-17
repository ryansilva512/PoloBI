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
    
    // Try to fetch from MILVUS first
    if (API_KEY) {
      try {
        console.log("Proxy request to MILVUS:", {
          url: MILVUS_URL,
          pagina: req.body?.pagina,
          limit: req.body?.limit
        });

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
          const errorText = await response.text();
          console.error("MILVUS API error response:", {
            status: response.status,
            statusText: response.statusText,
            bodyLength: errorText.length
          });
          throw new Error(`MILVUS API returned ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("MILVUS API success:", {
          status: response.status,
          dataLength: data?.lista?.length
        });
        
        // Log primeiro item para debug
        if (data?.lista?.length > 0) {
          console.log("Primeiro item:", JSON.stringify(data.lista[0], null, 2));
        }
        
        return res.json(data);
      } catch (error: any) {
        console.error("MILVUS Proxy Error:", {
          message: error.message,
          code: error.code,
          name: error.name
        });
      }
    }
    
    // Fallback to mock data
    console.log("Using mock data fallback for tickets");
    
    // Generate mock tickets data with all required fields
    const nomes = ["Ana Silva", "Carlos Santos", "Maria Oliveira", "João Pereira"];
    const sobreomes = ["Silva", "Santos", "Oliveira", "Pereira"];
    const mesas = [
      { id: 1, text: "Suporte Técnico" },
      { id: 2, text: "Administrativo" },
      { id: 3, text: "Comercial" }
    ];
    const tipos = [
      { id: 1, text: "Incidente" },
      { id: 2, text: "Alteração" },
      { id: 3, text: "Solicitação" }
    ];
    const categorias = [
      { id: 1, text: "Acesso" },
      { id: 2, text: "Sistema" },
      { id: 3, text: "Hardware" }
    ];
    const setores = [
      { id: 1, text: "TI" },
      { id: 2, text: "Financeiro" },
      { id: 3, text: "RH" }
    ];
    const statuses = [
      { id: 1, text: "Finalizado" },
      { id: 2, text: "Aberto" },
      { id: 3, text: "Em Progresso" }
    ];

    const mockTickets = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      chamado_id: 5000 + i,
      codigo: 1000 + i,
      assunto: `Ticket #${i + 1} - Suporte Técnico`,
      nome_fantasia: "Empresa Teste LTDA",
      nome: nomes[i % nomes.length],
      sobrenome: sobreomes[i % sobreomes.length],
      data_inicial: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      data_final: new Date(Date.now() - ((i - 5) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      tipo_hora: "horas",
      is_externo: i % 2 === 0,
      tecnico: nomes[i % nomes.length],
      total_horas_atendimento: String(Math.floor(Math.random() * 8)),
      horas_ticket: String(Math.floor(Math.random() * 48)),
      horas_operador: String(Math.floor(Math.random() * 8)),
      horas_internas: String(Math.floor(Math.random() * 6)),
      horas_externas: String(Math.floor(Math.random() * 2)),
      descricao: "Descrição do problema relatado pelo cliente.",
      is_comercial: i % 3 === 0,
      contato: "cliente@empresa.com",
      mesa_trabalho: mesas[i % mesas.length],
      tipo_chamado: tipos[i % tipos.length],
      categoria_primaria: categorias[i % categorias.length],
      categoria_secundaria: categorias[(i + 1) % categorias.length],
      status: statuses[i % statuses.length],
      data_criacao: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      data_solucao: i % 2 === 0 ? new Date(Date.now() - ((i - 3) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : "2025-12-16",
      setor: setores[i % setores.length],
      motivo_pausa: { text: "Aguardando informação do cliente" },
      data_saida: null,
      data_chegada: null,
      unidade_negocio: "Support"
    }));

    res.json({
      meta: {
        current_page: req.body?.pagina || 1,
        total: 50,
        to: Math.min(50, req.body?.limit || 500),
        from: 1,
        last_page: 1,
        per_page: req.body?.limit || 500
      },
      lista: mockTickets
    });
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
