import {
  PaginatedTicketResponse,
  TicketFilters,
  ticketRawSchema,
  paginatedResponseSchema,
} from "@shared/schema";

// Use o proxy do servidor para evitar CORS e proteger a API KEY.
// O TOKEN é gerenciado APENAS no servidor via .env
// As requisições irão para: POST /api/proxy/relatorio-atendimento/listagem
const API_BASE_URL = "/api/proxy";

// Evento customizado para alertar sobre erros da API do Milvus
export const MILVUS_API_ERROR_EVENT = "milvus-api-error";

export interface MilvusApiErrorDetail {
  status: number;
  message: string;
  endpoint: string;
  timestamp: Date;
}

// Função para emitir alerta de erro da API
function emitMilvusApiError(status: number, message: string, endpoint: string) {
  const detail: MilvusApiErrorDetail = {
    status,
    message,
    endpoint,
    timestamp: new Date(),
  };

  // Emite evento customizado que pode ser capturado pelo frontend
  window.dispatchEvent(new CustomEvent(MILVUS_API_ERROR_EVENT, { detail }));

  console.error(`🚨 MILVUS API ERROR: ${status} - ${message} [${endpoint}]`);
}

class MilvusApiClient {
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // NÃO enviar token do cliente - o servidor proxy adiciona automaticamente
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // Detectar erros 5xx (problemas no servidor da API do Milvus)
        if (response.status >= 500 && response.status < 600) {
          emitMilvusApiError(
            response.status,
            response.statusText || "Erro no servidor",
            endpoint
          );
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`API Response [${endpoint}]:`, {
        statusCode: response.status,
        dataType: typeof data,
        hasLista: !!data?.lista,
        listaLength: data?.lista?.length,
        hasMeta: !!data?.meta,
        firstItem: data?.lista?.[0]
      });
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
    page?: number;
    limit?: number;
    per_page?: number;
  }): Promise<PaginatedTicketResponse> {
    const payload = {
      data_inicial: filters.data_inicial,
      data_final: filters.data_final,
      analista: filters.analista,
      mesa_trabalho: filters.mesa_trabalho,
      // a API aceita tanto "pagina" quanto "page"/"per_page" em algumas variaÇõÇæes
      pagina: filters.pagina || filters.page || 1,
      page: filters.pagina || filters.page || 1,
      limit: filters.limit || filters.per_page || 500,
      per_page: filters.limit || filters.per_page || 500,
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
    try {
      const validated = paginatedResponseSchema.parse(response);
      console.log("Validação Zod bem-sucedida:", {
        total: validated.meta.total,
        listaLength: validated.lista.length
      });
      return validated;
    } catch (error) {
      console.error("Erro de validação Zod:", error);
      console.log("Dados recebidos:", response);
      throw error;
    }
  }

  /**
   * Busca todas as páginas. O servidor já retorna tudo agregado.
   */
  async getTicketsAllPages(filters: {
    data_inicial?: string;
    data_final?: string;
    analista?: string;
    mesa_trabalho?: string;
    limit?: number;
    per_page?: number;
  }): Promise<PaginatedTicketResponse> {
    const pageSize = filters.limit || filters.per_page || 500;
    return this.getTickets({ ...filters, pagina: 1, page: 1, limit: pageSize, per_page: pageSize });
  }

}

export const apiClient = new MilvusApiClient();
