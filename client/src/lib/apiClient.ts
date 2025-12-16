import {
  PaginatedTicketResponse,
  TicketFilters,
  ticketRawSchema,
  paginatedResponseSchema,
} from "@shared/schema";

// Use o proxy do servidor para evitar CORS e proteger a API KEY.
// As requisições irão para: POST /api/proxy/relatorio-atendimento/listagem
const API_BASE_URL = "https://apiintegracao.milvus.com.br/api";
const API_KEY = "dMHE29hFX9YUOQWFXlu0QGeft2MOQEoBS6R7UEnalEjPodSl0j0BE5krXyxGPJax9tVJz6RblIAHR5OVpblnvhQQ2WDjTZEe9GoF7";

class MilvusApiClient {
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        "Authorization": API_KEY,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Request Failed [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Busca listagem de atendimentos/tickets com paginação
   * Endpoint: POST /relatorio-atendimento/listagem
   */
  async getTickets(filters: {
    data_inicial?: string;
    data_final?: string;
    analista?: string;
    mesa_trabalho?: string;
    pagina?: number;
    limit?: number;
  }): Promise<PaginatedTicketResponse> {
    const payload = {
      data_inicial: filters.data_inicial,
      data_final: filters.data_final,
      analista: filters.analista,
      mesa_trabalho: filters.mesa_trabalho,
      pagina: filters.pagina || 1,
      limit: filters.limit || 500,
    };

    // Remove undefined values
    Object.keys(payload).forEach(
      (key) =>
        payload[key as keyof typeof payload] === undefined &&
        delete payload[key as keyof typeof payload]
    );

    const response = await this.request<PaginatedTicketResponse>(
      "/relatorio-atendimento/listagem",
      "POST",
      payload
    );

    // Validate response structure
    return paginatedResponseSchema.parse(response);
  }

  /**
   * Busca múltiplas páginas em paralelo (para carregamento completo de dados)
   */
  async getTicketsAllPages(filters: {
    data_inicial?: string;
    data_final?: string;
    analista?: string;
    mesa_trabalho?: string;
    limit?: number;
  }): Promise<PaginatedTicketResponse> {
    // First request to get total pages
    const firstPage = await this.getTickets({ ...filters, pagina: 1, limit: filters.limit || 500 });

    // If only one page, return it
    if (firstPage.meta.last_page === 1) {
      return firstPage;
    }

    // Fetch remaining pages in parallel
    const allPages = [firstPage];
    const pagePromises = [];

    for (let page = 2; page <= firstPage.meta.last_page; page++) {
      pagePromises.push(
        this.getTickets({ ...filters, pagina: page, limit: filters.limit || 500 })
      );
    }

    const remainingPages = await Promise.all(pagePromises);
    allPages.push(...remainingPages);

    // Combine all results
    const combinedResponse: PaginatedTicketResponse = {
      meta: firstPage.meta,
      lista: allPages.reduce<any[]>((acc, page) => [...acc, ...page.lista], []),
    };

    // Update meta with actual total
    combinedResponse.meta.total = combinedResponse.lista.length;

    return combinedResponse;
  }
}

export const apiClient = new MilvusApiClient();
