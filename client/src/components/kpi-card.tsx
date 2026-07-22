import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  titulo: string;
  valor: string | number;
  unidade?: string;
  variacao?: number;
  meta?: string;
  tooltip?: string;
  icone?: React.ReactNode;
  destaque?: "success" | "warning" | "danger" | "neutral";
  tamanho?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  testId?: string;
}

export function KPICard({
  titulo,
  valor,
  unidade,
  variacao,
  meta,
  tooltip,
  icone,
  destaque = "neutral",
  tamanho = "md",
  className,
  onClick,
  testId,
}: KPICardProps) {
  const destaqueClasses = {
    success: "before:bg-success",
    warning: "before:bg-warning",
    danger: "before:bg-destructive",
    neutral: "before:bg-primary",
  };

  const tamanhoClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const valorClasses = {
    sm: "text-xl font-bold font-mono",
    md: "text-3xl font-bold font-mono tracking-tight",
    lg: "text-4xl font-bold font-mono tracking-tight",
  };

  const TrendIcon = variacao
    ? variacao > 0
      ? TrendingUp
      : variacao < 0
      ? TrendingDown
      : Minus
    : null;

  const trendColor = variacao
    ? variacao > 0
      ? "text-success"
      : variacao < 0
      ? "text-destructive"
      : "text-muted-foreground"
    : "";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-200 before:absolute before:inset-x-5 before:top-0 before:h-px before:opacity-80",
        destaqueClasses[destaque],
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={testId}
    >
      <CardContent className={cn("space-y-2", tamanhoClasses[tamanho])}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icone && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary/15">
                {icone}
              </div>
            )}
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {titulo}
            </span>
          </div>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Mais informações sobre ${titulo}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className={cn(valorClasses[tamanho], "tabular-nums text-foreground")}>
            {typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor}
          </span>
          {unidade && (
            <span className="text-sm text-muted-foreground">{unidade}</span>
          )}
        </div>

        {(variacao !== undefined || meta) && (
          <div className="flex items-center justify-between gap-2 pt-1">
            {variacao !== undefined && TrendIcon && (
              <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span className="font-medium">
                  {variacao > 0 ? "+" : ""}
                  {variacao.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs. anterior</span>
              </div>
            )}
            {meta && (
              <span className="text-xs text-muted-foreground">
                Meta: {meta}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
