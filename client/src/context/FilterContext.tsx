import React, { createContext, useContext, useState, useCallback } from "react";
import { format, startOfDay, endOfDay, startOfMonth, isValid, parseISO } from "date-fns";
import { TicketFilters } from "@shared/schema";

interface FilterContextType {
  filters: TicketFilters;
  updateFilter: (key: keyof TicketFilters, value: any) => void;
  updateFilters: (newFilters: Partial<TicketFilters>) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Período padrão: "Este mês" (do início do mês até hoje)
const DEFAULT_FILTERS: TicketFilters = {
  data_inicial: format(startOfDay(startOfMonth(new Date())), "yyyy-MM-dd HH:mm:ss"),
  data_final: format(endOfDay(new Date()), "yyyy-MM-dd HH:mm:ss"),
};

const MANAGEMENT_FILTER_KEYS = [
  "data_inicial",
  "data_final",
  "analista",
  "mesa_trabalho",
] as const;

const getInitialFilters = (): TicketFilters => {
  const defaults = { ...DEFAULT_FILTERS };

  const pathname = typeof window === "undefined"
    ? ""
    : window.location.pathname.replace(/\/+$/, "");

  if (pathname !== "/gestao") {
    return defaults;
  }

  const params = new URLSearchParams(window.location.search);
  const safeFilters: TicketFilters = {};

  MANAGEMENT_FILTER_KEYS.forEach((key) => {
    const rawValue = params.get(key)?.trim();
    if (!rawValue || rawValue.length > 120 || /[\u0000-\u001F\u007F]/.test(rawValue)) return;

    if (key === "data_inicial" || key === "data_final") {
      const parsed = parseISO(rawValue.replace(" ", "T"));
      if (!isValid(parsed)) return;
    }

    safeFilters[key] = rawValue;
  });

  return { ...defaults, ...safeFilters };
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [filters, setFilters] = useState<TicketFilters>(getInitialFilters);

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
