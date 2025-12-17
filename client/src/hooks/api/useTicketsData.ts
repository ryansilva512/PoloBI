import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { TicketFilters } from "@shared/schema";

export const useTicketsData = (
  filters?: TicketFilters,
  loadAllPages: boolean = false
) => {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      console.log("useTicketsData - Fetching with filters:", filters);
      const data = await (loadAllPages
        ? apiClient.getTicketsAllPages(filters || {})
        : apiClient.getTickets(filters || {}));
      console.log("useTicketsData - Data received:", {
        hasMeta: !!data?.meta,
        hasLista: !!data?.lista,
        listaLength: data?.lista?.length,
        firstItem: data?.lista?.[0],
        fullData: data
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
};
