import React, { createContext, useContext, useState, useCallback } from "react";
import { subDays, format } from "date-fns";
import { TicketFilters } from "@shared/schema";

interface FilterContextType {
  filters: TicketFilters;
  updateFilter: (key: keyof TicketFilters, value: any) => void;
  updateFilters: (newFilters: Partial<TicketFilters>) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const DEFAULT_FILTERS: TicketFilters = {
  data_inicial: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  data_final: format(new Date(), "yyyy-MM-dd"),
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback(
    (key: keyof TicketFilters, value: any) => {
      setFilters((prev: TicketFilters) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateFilters = useCallback((newFilters: Partial<TicketFilters>) => {
    setFilters((prev: TicketFilters) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const value: FilterContextType = {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
};
