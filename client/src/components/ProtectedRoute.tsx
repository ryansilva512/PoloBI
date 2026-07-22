import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(14,165,233,0.12),transparent_32rem)]" />
        <div className="relative flex flex-col items-center gap-5" role="status" aria-live="polite">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
            <img src="/Icone_Logo.png" alt="" className="h-11 w-11 object-contain" />
            <span className="absolute -inset-1 animate-spin rounded-[1.15rem] border border-transparent border-t-red-500/80" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">Preparando seu painel</p>
            <p className="mt-1 text-xs text-slate-500">Validando a sessão com segurança...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/login" />;

  return <>{children}</>;
}
