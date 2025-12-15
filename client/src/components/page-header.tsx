import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
  className?: string;
}

export function PageHeader({ titulo, subtitulo, acoes, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
            {subtitulo}
          </p>
        )}
      </div>
      {acoes && <div className="flex items-center gap-2 flex-wrap">{acoes}</div>}
    </div>
  );
}
