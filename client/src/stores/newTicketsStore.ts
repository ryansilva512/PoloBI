// Store para rastrear chamados recém-abertos
// Compartilha estado entre Home e Operacional

export interface NewTicketInfo {
    codigo: number;
    assunto: string;
    nome_fantasia?: string;
    data_criacao?: string;
    status?: { text: string };
    mesa_trabalho?: { text: string };
    nome?: string;
}

type NewTicketsListener = (tickets: Map<number, NewTicketInfo>) => void;

class NewTicketsStore {
    private tickets: Map<number, NewTicketInfo> = new Map();
    private listeners: Set<NewTicketsListener> = new Set();

    /**
     * Adiciona novos chamados recém-abertos
     */
    addTickets(newTickets: NewTicketInfo[]) {
        newTickets.forEach(ticket => this.tickets.set(ticket.codigo, ticket));
        this.notify();

        // Auto-limpar após 5 minutos
        newTickets.forEach(ticket => {
            setTimeout(() => {
                this.clearId(ticket.codigo);
            }, 5 * 60 * 1000);
        });
    }

    /**
     * Adiciona apenas IDs (compatibilidade com código existente)
     */
    addIds(newIds: number[]) {
        newIds.forEach(id => {
            if (!this.tickets.has(id)) {
                this.tickets.set(id, { codigo: id, assunto: 'Novo chamado' });
            }
        });
        this.notify();

        // Auto-limpar após 5 minutos
        newIds.forEach(id => {
            setTimeout(() => {
                this.clearId(id);
            }, 5 * 60 * 1000);
        });
    }

    /**
     * Remove um ID específico (quando o usuário visualizou)
     */
    clearId(id: number) {
        if (this.tickets.has(id)) {
            this.tickets.delete(id);
            this.notify();
        }
    }

    /**
     * Limpa todos os chamados
     */
    clearAll() {
        this.tickets.clear();
        this.notify();
    }

    /**
     * Retorna uma cópia do Set de IDs
     */
    getIds(): Set<number> {
        return new Set(this.tickets.keys());
    }

    /**
     * Retorna uma cópia do Map de tickets
     */
    getTickets(): Map<number, NewTicketInfo> {
        return new Map(this.tickets);
    }

    /**
     * Retorna array de tickets
     */
    getTicketsList(): NewTicketInfo[] {
        return Array.from(this.tickets.values());
    }

    /**
     * Verifica se um ID está marcado como novo
     */
    hasId(id: number): boolean {
        return this.tickets.has(id);
    }

    /**
     * Subscreve para mudanças nos tickets
     * Retorna função para cancelar a subscrição
     */
    subscribe(listener: NewTicketsListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Subscreve para mudanças nos IDs (compatibilidade)
     */
    subscribeIds(listener: (ids: Set<number>) => void): () => void {
        const wrapper: NewTicketsListener = () => listener(this.getIds());
        this.listeners.add(wrapper);
        return () => this.listeners.delete(wrapper);
    }

    private notify() {
        this.listeners.forEach(l => l(this.getTickets()));
    }
}

// Exporta instância singleton
export const newTicketsStore = new NewTicketsStore();
