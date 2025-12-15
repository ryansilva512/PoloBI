import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert } from "@shared/schema";

interface AlertCardProps {
  alerta: Alert;
  onDismiss?: (id: string) => void;
  onAcao?: (alerta: Alert) => void;
  className?: string;
}

export function AlertCard({ alerta, onDismiss, onAcao, className }: AlertCardProps) {
  const tipoConfig = {
    critico: {
      icon: AlertTriangle,
      bgClass: "bg-destructive/5 border-destructive/20",
      iconClass: "text-destructive",
      titleClass: "text-destructive",
    },
    alerta: {
      icon: AlertCircle,
      bgClass: "bg-warning/5 border-warning/20",
      iconClass: "text-warning",
      titleClass: "text-warning",
    },
    info: {
      icon: Info,
      bgClass: "bg-primary/5 border-primary/20",
      iconClass: "text-primary",
      titleClass: "text-primary",
    },
  };

  const config = tipoConfig[alerta.tipo];
  const Icon = config.icon;

  return (
    <Card className={cn("border", config.bgClass, className)}>
      <CardContent className="flex items-start gap-4 p-4">
        <div className={cn("mt-0.5", config.iconClass)}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn("font-medium text-sm", config.titleClass)}>
              {alerta.titulo}
            </h4>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={() => onDismiss(alerta.id)}
                data-testid={`button-dismiss-alert-${alerta.id}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{alerta.descricao}</p>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono">
                {alerta.metrica}: {alerta.valorAtual.toLocaleString("pt-BR")}
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span>Limite: {alerta.valorLimite.toLocaleString("pt-BR")}</span>
            </div>

            {onAcao && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAcao(alerta)}
                className="text-xs"
                data-testid={`button-acao-alert-${alerta.id}`}
              >
                {alerta.acao}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
