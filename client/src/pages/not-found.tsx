import { Link } from "wouter";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center py-10">
      <Card className="relative w-full max-w-lg overflow-hidden text-center">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
        <CardContent className="flex flex-col items-center px-6 py-12 sm:px-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">Erro 404</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Esta página não existe</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            O endereço pode ter mudado ou não faz parte deste ambiente do Polo BI.
          </p>
          <Button asChild className="mt-7">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Voltar para a visão geral
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
