import { Link, useLocation } from "wouter";
import { Activity, Radio } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigationGroups } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [location] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.06]">
      <SidebarHeader className="h-20 justify-center border-b border-white/[0.06] px-3">
        <Link
          href="/"
          onClick={handleNavigate}
          className="group/brand flex min-w-0 items-center gap-3 rounded-xl px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Ir para a visão geral"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-white/10 transition-transform duration-200 group-hover/brand:scale-[1.03]">
            <img src="/Icone_Logo.png" alt="" className="h-9 w-9 object-contain" />
            <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold tracking-tight text-white">
              Polo BI
            </span>
            <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Intelligence Hub
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navigationGroups.map((group) => (
          <SidebarGroup className="py-2" key={group.label}>
            <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {group.items.map((item) => {
                  const isActive = location === item.url;

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        size="lg"
                        tooltip={item.title}
                        className={cn(
                          "relative h-12 rounded-xl px-3 text-slate-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white group-data-[collapsible=icon]:justify-center",
                          isActive &&
                            "bg-gradient-to-r from-red-500/15 via-red-500/[0.08] to-transparent text-white shadow-[inset_0_0_0_1px_rgba(239,68,68,0.12)] hover:bg-red-500/15"
                        )}
                      >
                        <Link
                          href={item.url}
                          onClick={handleNavigate}
                          aria-current={isActive ? "page" : undefined}
                          data-testid={`link-${item.url.replace("/", "") || "home"}`}
                        >
                          {isActive && (
                            <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                          )}
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isActive ? "bg-red-500/15 text-red-400" : "text-slate-500 group-hover/menu-button:text-slate-200"
                            )}
                          >
                            <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                            <span className="block truncate text-[13px] font-medium">{item.title}</span>
                            <span className="block truncate text-[10px] font-normal text-slate-600">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-1">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Activity className="h-4 w-4" aria-hidden="true" />
            <Radio className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-emerald-400" aria-hidden="true" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-[11px] font-medium text-slate-300">Monitoramento ativo</span>
            <span className="block text-[9px] text-slate-600">Atualização em tempo real</span>
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
