import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface FilterState {
  periodo: string;
  dataInicio?: Date;
  dataFim?: Date;
  canal?: string;
  prioridade?: string;
  departamento?: string;
  agente?: string;
}

interface FilterBarProps {
  filtros: FilterState;
  onFiltroChange: (filtros: FilterState) => void;
  onExportar?: () => void;
  opcoesDepartamento?: string[];
  opcoesAgente?: string[];
  className?: string;
}

const periodos = [
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "30dias", label: "Últimos 30 dias" },
  { value: "90dias", label: "Últimos 90 dias" },
  { value: "personalizado", label: "Personalizado" },
];

const canais = [
  { value: "todos", label: "Todos os Canais" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "chat", label: "Chat" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "portal", label: "Portal" },
];

const prioridades = [
  { value: "todas", label: "Todas as Prioridades" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export function FilterBar({
  filtros,
  onFiltroChange,
  onExportar,
  opcoesDepartamento = [],
  opcoesAgente = [],
  className,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFiltro = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltroChange({ ...filtros, [key]: value });
  };

  const limparFiltros = () => {
    onFiltroChange({
      periodo: "30dias",
      canal: undefined,
      prioridade: undefined,
      departamento: undefined,
      agente: undefined,
      dataInicio: undefined,
      dataFim: undefined,
    });
  };

  const temFiltrosAtivos =
    filtros.canal ||
    filtros.prioridade ||
    filtros.departamento ||
    filtros.agente;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filtros.periodo}
          onValueChange={(v) => updateFiltro("periodo", v)}
        >
          <SelectTrigger className="w-[180px]" data-testid="select-periodo">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtros.periodo === "personalizado" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !filtros.dataInicio && "text-muted-foreground"
                  )}
                  data-testid="button-data-inicio"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.dataInicio
                    ? format(filtros.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filtros.dataInicio}
                  onSelect={(d) => updateFiltro("dataInicio", d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !filtros.dataFim && "text-muted-foreground"
                  )}
                  data-testid="button-data-fim"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.dataFim
                    ? format(filtros.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filtros.dataFim}
                  onSelect={(d) => updateFiltro("dataFim", d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="default"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="button-filtros"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {temFiltrosAtivos && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              !
            </span>
          )}
        </Button>

        {temFiltrosAtivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            data-testid="button-limpar-filtros"
          >
            <X className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}

        <div className="flex-1" />

        {onExportar && (
          <Button variant="outline" onClick={onExportar} data-testid="button-exportar">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted/50 p-3">
          <Select
            value={filtros.canal || "todos"}
            onValueChange={(v) =>
              updateFiltro("canal", v === "todos" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[160px]" data-testid="select-canal">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              {canais.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.prioridade || "todas"}
            onValueChange={(v) =>
              updateFiltro("prioridade", v === "todas" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[160px]" data-testid="select-prioridade">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              {prioridades.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {opcoesDepartamento.length > 0 && (
            <Select
              value={filtros.departamento || "todos"}
              onValueChange={(v) =>
                updateFiltro("departamento", v === "todos" ? undefined : v)
              }
            >
              <SelectTrigger className="w-[180px]" data-testid="select-departamento">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Departamentos</SelectItem>
                {opcoesDepartamento.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {opcoesAgente.length > 0 && (
            <Select
              value={filtros.agente || "todos"}
              onValueChange={(v) =>
                updateFiltro("agente", v === "todos" ? undefined : v)
              }
            >
              <SelectTrigger className="w-[180px]" data-testid="select-agente">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Agentes</SelectItem>
                {opcoesAgente.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
