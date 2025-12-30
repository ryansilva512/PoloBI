import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { FilterProvider } from "@/context/FilterContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Operacional from "@/pages/operacional";
import RegistrosExpirados from "@/pages/registros-expirados";
import Metodologia from "@/pages/metodologia";
import Sobre from "@/pages/sobre";
import ManutencaoPreventiva from "@/pages/manutencao-preventiva";
import PesquisaSatisfacao from "@/pages/pesquisa-satisfacao";
import Login from "@/pages/login";

function ProtectedRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/operacional" component={Operacional} />
      <Route path="/registros-expirados" component={RegistrosExpirados} />
      <Route path="/manutencao-preventiva" component={ManutencaoPreventiva} />
      <Route path="/pesquisa-satisfacao" component={PesquisaSatisfacao} />
      <Route path="/metodologia" component={Metodologia} />
      <Route path="/sobre" component={Sobre} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Componente de cabeçalho com botão de logout
function Header() {
  const { logout, user } = useAuth();
  const headerLogoPrimary = "/logo-padrao-polo.png";
  const headerLogoFallback = "/Icone_Logo.png";

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <img
          src={headerLogoPrimary}
          alt="Polo Telecom"
          className="h-10 w-auto max-w-[240px] object-contain"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallbackUsed === "true") return;
            img.dataset.fallbackUsed = "true";
            img.src = headerLogoFallback;
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {user.email}
          </span>
        )}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Sair"
          className="text-muted-foreground hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function AuthenticatedLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <ScrollArea className="flex-1">
            <main className="p-6">
              <ProtectedRouter />
            </main>
          </ScrollArea>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  return (
    <Switch>
      {/* Rota de login (não protegida) */}
      <Route path="/login" component={Login} />

      {/* Todas as outras rotas são protegidas */}
      <Route>
        <ProtectedRoute>
          <AuthenticatedLayout />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bi-helpdesk-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FilterProvider>
            <TooltipProvider>
              <AppRoutes />
              <Toaster />
            </TooltipProvider>
          </FilterProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

