import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({
  titulo,
  subtitulo,
  acoes,
  className,
  eyebrow = "Polo Intelligence",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-brand to-brand/20" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
            {eyebrow}
          </span>
        </div>
        <h1
          className="text-balance text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl"
          data-testid="text-page-title"
        >
          {titulo}
        </h1>
        {subtitulo && (
          <p
            className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground"
            data-testid="text-page-subtitle"
          >
            {subtitulo}
          </p>
        )}
      </div>
      {acoes && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {acoes}
        </div>
      )}
    </header>
  );
}
