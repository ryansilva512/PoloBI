import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  SmilePlus,
  Search,
  BookOpen,
  Lightbulb,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuPrincipal = [
  {
    title: "Visão Geral",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Operacional",
    url: "/operacional",
    icon: ClipboardList,
  },
  {
    title: "SLA & Performance",
    url: "/sla",
    icon: Clock,
  },
];

const menuReferencia = [
  {
    title: "Metodologia",
    url: "/metodologia",
    icon: Lightbulb,
  },
  {
    title: "Sobre o BI",
    url: "/sobre",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  // Usa exatamente o nome do arquivo na pasta public
  const logoPrimary = "/Icone_Logo.png";
  const logoFallback = "/logo-polo.svg";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-transparent">
            <img
              src={logoPrimary}
              alt="Polo BI"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.endsWith(logoFallback)) return;
                img.src = logoFallback;
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Polo BI</h1>
            <p className="text-xs text-muted-foreground">Polo Telecom</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2">
            Dashboards
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuPrincipal.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "home"}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2">
            Referência
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuReferencia.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href={item.url} data-testid={`link-${item.url.replace("/", "")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Atualizado em tempo real
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
