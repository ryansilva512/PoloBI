import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Database,
  Code,
  Layers,
  Users,
  RefreshCw,
  Shield,
  Zap,
  Globe,
  Server,
} from "lucide-react";

export default function Sobre() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Sobre o BI de Help Desk"
        subtitulo="Informações sobre o portal de Business Intelligence, competências técnicas e visão de melhoria contínua"
      />

      {/* Visão Geral */}
      <Card className="rounded-md bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            O que é o Portal de BI de Help Desk?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este portal centraliza todos os indicadores de desempenho do Help Desk em dashboards
            interativos e acionáveis. Nosso objetivo é transformar dados em decisões,
            permitindo que gestores, analistas e diretoria tenham visibilidade clara sobre:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">1</Badge>
              <span>Volume e status de chamados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">2</Badge>
              <span>Cumprimento de SLA</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">3</Badge>
              <span>Satisfação do cliente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsáveis */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipe Responsável
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Gestão de BI</h4>
              <p className="text-xs text-muted-foreground">
                Responsável pela estratégia de dados, definição de KPIs e alinhamento com objetivos de negócio.
              </p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Engenharia de Dados</h4>
              <p className="text-xs text-muted-foreground">
                Responsável pela coleta, transformação e qualidade dos dados que alimentam os dashboards.
              </p>
            </div>
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Analytics</h4>
              <p className="text-xs text-muted-foreground">
                Responsável pela análise de dados, identificação de padrões e geração de insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competências Técnicas */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            Competências Técnicas Envolvidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Data Warehousing</h4>
                  <p className="text-xs text-muted-foreground">
                    Modelagem dimensional, ETL/ELT, integração de fontes de dados heterogêneas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">SQL & Transformação</h4>
                  <p className="text-xs text-muted-foreground">
                    Queries complexas, agregações, window functions, CTEs para análises avançadas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Ferramentas de BI</h4>
                  <p className="text-xs text-muted-foreground">
                    Power BI, Tableau, Looker Studio, Qlik, Grafana para visualização de dados.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Integrações</h4>
                  <p className="text-xs text-muted-foreground">
                    APIs REST, webhooks, conectores para Jira, Zendesk, Freshdesk, ServiceNow.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Server className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Infraestrutura</h4>
                  <p className="text-xs text-muted-foreground">
                    Cloud computing, otimização de queries, cache, performance de dashboards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Governança</h4>
                  <p className="text-xs text-muted-foreground">
                    Qualidade de dados, documentação, controle de acesso, LGPD/GDPR.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrações */}
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integrações Suportadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            O portal está preparado para integrar-se com os principais sistemas de ticketing e comunicação:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Jira Service Management",
              "Zendesk",
              "Freshdesk",
              "ServiceNow",
              "Salesforce Service Cloud",
              "Microsoft Dynamics",
              "Intercom",
              "HubSpot Service Hub",
            ].map((sistema) => (
              <div
                key={sistema}
                className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm"
              >
                <div className="h-2 w-2 rounded-full bg-success" />
                {sistema}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Canais de comunicação: E-mail, Telefone, Chat, WhatsApp Business, Portal de Autoatendimento.
          </p>
        </CardContent>
      </Card>

      {/* Melhoria Contínua */}
      <Card className="rounded-md bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Visão de Melhoria Contínua
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O portal de BI é um produto vivo que evolui constantemente. Nossa abordagem de melhoria contínua inclui:
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-md bg-background space-y-2">
              <h4 className="text-sm font-medium">Feedback dos Usuários</h4>
              <p className="text-xs text-muted-foreground">
                Coletamos sugestões regularmente para priorizar novas funcionalidades e melhorias.
              </p>
            </div>
            <div className="p-4 rounded-md bg-background space-y-2">
              <h4 className="text-sm font-medium">Revisão de Métricas</h4>
              <p className="text-xs text-muted-foreground">
                Avaliamos periodicamente quais KPIs são realmente úteis e removemos métricas de vaidade.
              </p>
            </div>
            <div className="p-4 rounded-md bg-background space-y-2">
              <h4 className="text-sm font-medium">Novas Integrações</h4>
              <p className="text-xs text-muted-foreground">
                Expandimos conectores para novas fontes de dados conforme necessidade.
              </p>
            </div>
            <div className="p-4 rounded-md bg-background space-y-2">
              <h4 className="text-sm font-medium">Performance</h4>
              <p className="text-xs text-muted-foreground">
                Otimizamos constantemente queries e carregamento para melhor experiência.
              </p>
            </div>
            <div className="p-4 rounded-md bg-background space-y-2">
              <h4 className="text-sm font-medium">Análise Preditiva</h4>
              <p className="text-xs text-muted-foreground">
                Em roadmap: previsão de volume, detecção de anomalias e recomendações automáticas.
              </p>
            </div>
            <div className="p-4 rounded-md bg-background space-y-2">
              <h4 className="text-sm font-medium">Automação</h4>
              <p className="text-xs text-muted-foreground">
                Alertas automatizados, relatórios agendados e integração com ferramentas de comunicação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card className="rounded-md">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Dúvidas, sugestões ou problemas? Entre em contato com a equipe de BI através do canal interno ou abra um ticket de suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
