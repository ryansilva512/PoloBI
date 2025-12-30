import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();

    // Mostra loading enquanto verifica sessão
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                    <span className="text-slate-400 text-sm">Verificando sessão...</span>
                </div>
            </div>
        );
    }

    // Se não autenticado, redireciona para login
    if (!isAuthenticated) {
        return <Redirect to="/login" />;
    }

    // Se autenticado, renderiza o conteúdo
    return <>{children}</>;
}
