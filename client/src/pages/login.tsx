import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const [, setLocation] = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    // Se já autenticado E não estamos mostrando animação de sucesso, redireciona para home
    if (isAuthenticated && !loginSuccess) {
        setLocation('/');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            // Mostrar animação de sucesso por 2 segundos antes de redirecionar
            setLoginSuccess(true);
            setIsLoading(false);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLocation('/');
        } else {
            setIsLoading(false);
            setError(result.message || 'Erro ao fazer login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 bg-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <img
                            src="/logo-padrao-polo.png"
                            alt="Polo Telecom"
                            className="h-20 w-auto object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Polo BI
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Entre com suas credenciais para acessar o dashboard
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Success message */}
                        {loginSuccess && (
                            <div className="flex items-center justify-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                                    <span className="font-medium">Login realizado com sucesso!</span>
                                    <span className="text-xs text-green-300">Carregando dashboard...</span>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">
                                Senha
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold shadow-lg shadow-red-500/20 transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
                        Dashboard de Business Intelligence
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
