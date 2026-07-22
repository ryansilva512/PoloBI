import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Lightbulb,
  SmilePlus,
  Wrench,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  shortTitle: string;
  description: string;
  url: string;
  icon: LucideIcon;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Operação",
    items: [
      {
        title: "Visão Geral",
        shortTitle: "Visão geral",
        description: "Pulso executivo da operação",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Operacional",
        shortTitle: "Operacional",
        description: "Equipe e chamados em tempo real",
        url: "/operacional",
        icon: ClipboardList,
      },
      {
        title: "Registros Expirados",
        shortTitle: "Expirados",
        description: "Prazos e desvios críticos",
        url: "/registros-expirados",
        icon: AlertTriangle,
      },
      {
        title: "Pesquisa de Satisfação",
        shortTitle: "Satisfação",
        description: "Percepção e experiência do cliente",
        url: "/pesquisa-satisfacao",
        icon: SmilePlus,
      },
      {
        title: "Manutenção Preventiva",
        shortTitle: "Manutenção",
        description: "Acompanhamento preventivo",
        url: "/manutencao-preventiva",
        icon: Wrench,
      },
    ],
  },
  {
    label: "Conhecimento",
    items: [
      {
        title: "Metodologia",
        shortTitle: "Metodologia",
        description: "Critérios, fórmulas e metas",
        url: "/metodologia",
        icon: Lightbulb,
      },
      {
        title: "Sobre o BI",
        shortTitle: "Sobre",
        description: "Recursos e arquitetura da solução",
        url: "/sobre",
        icon: CircleHelp,
      },
    ],
  },
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);

export function getNavigationItem(pathname: string) {
  return navigationItems.find((item) => item.url === pathname) ?? navigationItems[0];
}
