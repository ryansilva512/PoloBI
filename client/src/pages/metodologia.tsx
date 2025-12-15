import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  BarChart3,
  Eye,
  Zap,
} from "lucide-react";

export default function Metodologia() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Metodologia & Boas Práticas"
        subtitulo="Princípios de design de dashboards focados em ação e tomada de decisão"
      />

      {/* Princípio Central */}
      <Card className="rounded-md bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Princípio Central: Action-Centric Dashboard Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Todo dashboard deve ser projetado com foco em ação. Cada gráfico, métrica ou tabela
            deve responder à pergunta: "Que decisão posso tomar a partir deste dado?"
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Visibilidade</h4>
                <p className="text-xs text-muted-foreground">
                  Dados relevantes devem estar imediatamente visíveis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Acionabilidade</h4>
                <p className="text-xs text-muted-foreground">
                  Cada insight deve levar a uma ação concreta
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Contexto</h4>
                <p className="text-xs text-muted-foreground">
                  Números precisam de comparações e metas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* O que evitar */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            O que NÃO deve aparecer em Dashboards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Métricas de Vaidade
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Números que parecem bons mas não ajudam em decisões
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Contadores genéricos sem contexto temporal
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Métricas que só crescem (ex: total histórico)
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Dados sem Contexto
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Gráficos que mostram "o que aconteceu" sem indicar ações
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Números sem comparação com metas ou períodos anteriores
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Histórico muito antigo que não ajuda no cenário atual
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Visualizações Problemáticas
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Gráficos 3D que distorcem a percepção
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Excesso de cores sem significado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Animações que distraem do conteúdo
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Redundância
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Múltiplos indicadores mostrando a mesma informação
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Gráficos repetidos com pequenas variações
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">-</span>
                  Dados que podem ser consolidados em uma única visão
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boas Práticas */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Boas Práticas de Design de Dashboards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <Badge variant="outline" className="text-xs">Hierarquia</Badge>
              <h4 className="text-sm font-medium">Informação em Camadas</h4>
              <p className="text-xs text-muted-foreground">
                KPIs principais no topo, gráficos de tendência no meio, detalhes e tabelas abaixo.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <Badge variant="outline" className="text-xs">Contexto</Badge>
              <h4 className="text-sm font-medium">Sempre Compare</h4>
              <p className="text-xs text-muted-foreground">
                Inclua metas, médias ou variação vs. período anterior em cada métrica.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <Badge variant="outline" className="text-xs">Cores</Badge>
              <h4 className="text-sm font-medium">Semântica Visual</h4>
              <p className="text-xs text-muted-foreground">
                Verde para bom, amarelo para atenção, vermelho para crítico. Seja consistente.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <Badge variant="outline" className="text-xs">Filtros</Badge>
              <h4 className="text-sm font-medium">Drill-down Intuitivo</h4>
              <p className="text-xs text-muted-foreground">
                Permita explorar dados de agregado para detalhe com cliques progressivos.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <Badge variant="outline" className="text-xs">Alertas</Badge>
              <h4 className="text-sm font-medium">Destaque Exceções</h4>
              <p className="text-xs text-muted-foreground">
                Métricas fora do esperado devem chamar atenção automaticamente.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <Badge variant="outline" className="text-xs">Simplicidade</Badge>
              <h4 className="text-sm font-medium">Menos é Mais</h4>
              <p className="text-xs text-muted-foreground">
                Remova tudo que não contribui para uma decisão. Cada elemento deve justificar sua presença.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perguntas-Chave */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Perguntas-Chave para Cada Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Visão Geral (Home)</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>- Qual é a saúde geral do suporte agora?</li>
                <li>- Há algo crítico que preciso resolver imediatamente?</li>
                <li>- Estamos melhor ou pior que ontem/semana passada?</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Operacional</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>- Quantos tickets preciso resolver hoje?</li>
                <li>- Há gargalos em alguma fila específica?</li>
                <li>- Quais tickets estão envelhecendo?</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">SLA & Performance</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>- Estamos cumprindo os acordos com clientes?</li>
                <li>- Quais tickets estão em risco de estourar SLA?</li>
                <li>- Qual departamento precisa de atenção?</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Satisfação</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>- Os clientes estão satisfeitos com nosso atendimento?</li>
                <li>- Quais tipos de issue geram mais insatisfação?</li>
                <li>- Estamos melhorando ou piorando ao longo do tempo?</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storytelling */}
      <Card className="rounded-md bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Storytelling com Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Dashboards eficientes contam uma história. Eles não apenas mostram números,
            mas guiam o usuário através de uma narrativa que leva a insights e ações.
          </p>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center p-4 rounded-md bg-background">
              <span className="text-2xl font-bold text-primary">1</span>
              <h4 className="text-sm font-medium mt-2">Situação</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Onde estamos agora?
              </p>
            </div>
            <div className="text-center p-4 rounded-md bg-background">
              <span className="text-2xl font-bold text-primary">2</span>
              <h4 className="text-sm font-medium mt-2">Complicação</h4>
              <p className="text-xs text-muted-foreground mt-1">
                O que está fora do esperado?
              </p>
            </div>
            <div className="text-center p-4 rounded-md bg-background">
              <span className="text-2xl font-bold text-primary">3</span>
              <h4 className="text-sm font-medium mt-2">Causa</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Por que isso está acontecendo?
              </p>
            </div>
            <div className="text-center p-4 rounded-md bg-background">
              <span className="text-2xl font-bold text-primary">4</span>
              <h4 className="text-sm font-medium mt-2">Ação</h4>
              <p className="text-xs text-muted-foreground mt-1">
                O que faremos a respeito?
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
