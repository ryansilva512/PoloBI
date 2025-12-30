import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Eye,
  Zap,
  Clock,
  Timer,
  Hourglass,
  TrendingUp,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default function Metodologia() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Metodologia & Métricas"
        subtitulo="Como interpretamos os dados e as métricas de desempenho do Help Desk"
      />

      {/* Métricas de Tempo */}
      <Card className="rounded-md bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Métricas de Tempo do Help Desk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O Polo BI monitora três métricas principais de tempo para avaliar a eficiência do atendimento:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-md bg-background border space-y-2">
              <div className="flex items-center gap-2">
                <Hourglass className="h-5 w-5 text-blue-500" />
                <h4 className="text-sm font-medium">Tempo de Abertura</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo entre a <strong>criação do chamado</strong> pelo cliente e o <strong>início do atendimento</strong> pelo técnico.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                  Meta: 5 minutos
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-md bg-background border space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-orange-500" />
                <h4 className="text-sm font-medium">Tempo de Resposta</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo entre a <strong>criação do chamado</strong> e a <strong>primeira interação</strong> do técnico (capturado do campo tempo_abertura_atendimento).
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                  Monitorado
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-md bg-background border space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <h4 className="text-sm font-medium">Tempo de Atendimento</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Duração total do atendimento ativo, descontando pausas (capturado do campo tempo_atendimento).
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30">
                  Meta: 4 horas
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status dos Chamados */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status dos Chamados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-md border-l-4 border-green-500 bg-green-500/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <h4 className="text-sm font-medium">Atendendo</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Chamado em atendimento ativo por um técnico. O cronômetro de tempo de atendimento está rodando.
              </p>
            </div>

            <div className="p-4 rounded-md border-l-4 border-yellow-500 bg-yellow-500/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <h4 className="text-sm font-medium">Pausado</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Atendimento pausado temporariamente (aguardando resposta do cliente, informação externa, etc). Não conta no tempo de atendimento.
              </p>
            </div>

            <div className="p-4 rounded-md border-l-4 border-blue-500 bg-blue-500/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <h4 className="text-sm font-medium">Finalizado</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Chamado resolvido e fechado. Os tempos são finais e entram nas métricas de performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cálculo das Métricas */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Como Calculamos as Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tempo Médio de Abertura
              </h4>
              <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-md font-mono">
                <p>data_inicial - data_criacao</p>
                <p className="text-xs opacity-70">Média de todos os chamados do período</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tempo Médio de Solução
              </h4>
              <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-md font-mono">
                <p>data_final - data_criacao</p>
                <p className="text-xs opacity-70">Soma tempo de resposta + tempo de atendimento</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                SLA de Resposta
              </h4>
              <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-md">
                <p>% de chamados com tempo de abertura ≤ meta</p>
                <div className="flex gap-2 mt-1">
                  <Badge className="bg-green-500 text-xs">≤ 5min = OK</Badge>
                  <Badge className="bg-red-500 text-xs">&gt; 5min = Estourado</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                SLA de Atendimento
              </h4>
              <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-md">
                <p>% de chamados com tempo de solução ≤ meta</p>
                <div className="flex gap-2 mt-1">
                  <Badge className="bg-green-500 text-xs">≤ 4h = OK</Badge>
                  <Badge className="bg-red-500 text-xs">&gt; 4h = Estourado</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rankings de Operadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Ranking por Tempo de Resposta</h4>
              <p className="text-xs text-muted-foreground">
                Ordena os operadores pelo menor tempo médio entre abertura do chamado e início do atendimento.
                Operadores mais rápidos para iniciar o atendimento aparecem no topo.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Ranking por Tempo de Atendimento</h4>
              <p className="text-xs text-muted-foreground">
                Ordena os operadores pelo menor tempo médio de solução de chamados.
                Mede a eficiência em resolver os problemas após iniciado o atendimento.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Top Operadores</h4>
              <p className="text-xs text-muted-foreground">
                Mostra os 4 operadores com mais chamados resolvidos no período,
                incluindo média diária de tickets e avatar do colaborador.
              </p>
            </div>

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Chamados Ativos por Operador</h4>
              <p className="text-xs text-muted-foreground">
                Mostra em tempo real quantos chamados cada operador tem em status
                "Atendendo" e "Pausado". Atualizado via API a cada refresh.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card className="rounded-md border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sistema de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O dashboard possui um sistema de notificações para manter a equipe atenta a novos chamados:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Detecção Automática</h4>
                <p className="text-xs text-muted-foreground">
                  Compara a quantidade de tickets a cada atualização e detecta novos chamados.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Alerta Sonoro</h4>
                <p className="text-xs text-muted-foreground">
                  Emite um som de notificação quando novos chamados são detectados.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Síntese de Voz</h4>
                <p className="text-xs text-muted-foreground">
                  Anuncia por voz o assunto do novo chamado para atenção imediata da equipe.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perguntas-Chave */}
      <Card className="rounded-md bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Perguntas que o Dashboard Responde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Visão Geral</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Quantos chamados temos ativos agora?</li>
                <li>• Qual o tempo médio de abertura e solução?</li>
                <li>• Estamos dentro das metas de SLA?</li>
                <li>• Quem são os operadores mais produtivos?</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Operacional</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Quais chamados estão em andamento?</li>
                <li>• Há chamados pausados há muito tempo?</li>
                <li>• Como está a performance individual?</li>
                <li>• Quantos chamados cada operador atendeu?</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

