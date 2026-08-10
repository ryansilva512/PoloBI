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
      return loadAllPages
        ? apiClient.getTicketsAllPages(filters || {})
        : apiClient.getTickets(filters || {});
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
};
