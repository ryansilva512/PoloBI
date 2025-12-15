import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus, Priority, SLAStatus } from "@shared/schema";

interface StatusBadgeProps {
  tipo: "status" | "prioridade" | "sla";
  valor: TicketStatus | Priority | SLAStatus;
  tamanho?: "sm" | "md";
  className?: string;
}

const statusLabels: Record<TicketStatus, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
  agendado: "Agendado",
};

const prioridadeLabels: Record<Priority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const slaLabels: Record<SLAStatus, string> = {
  em_dia: "Em Dia",
  em_risco: "Em Risco",
  estourado: "Estourado",
};

export function StatusBadge({ tipo, valor, tamanho = "md", className }: StatusBadgeProps) {
  let label: string;
  let variantClass: string;

  if (tipo === "status") {
    const status = valor as TicketStatus;
    label = statusLabels[status];
    variantClass =
      status === "aberto"
        ? "bg-primary/10 text-primary border-primary/20"
        : status === "em_andamento"
        ? "bg-warning/10 text-warning border-warning/20"
        : status === "resolvido"
        ? "bg-success/10 text-success border-success/20"
        : "bg-muted text-muted-foreground border-muted";
  } else if (tipo === "prioridade") {
    const prioridade = valor as Priority;
    label = prioridadeLabels[prioridade];
    variantClass =
      prioridade === "alta"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : prioridade === "media"
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-success/10 text-success border-success/20";
  } else {
    const sla = valor as SLAStatus;
    label = slaLabels[sla];
    variantClass =
      sla === "em_dia"
        ? "bg-success/10 text-success border-success/20"
        : sla === "em_risco"
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-destructive/10 text-destructive border-destructive/20";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        tamanho === "sm" ? "text-xs px-1.5 py-0" : "text-xs px-2 py-0.5",
        variantClass,
        className
      )}
    >
      {label}
    </Badge>
  );
}
