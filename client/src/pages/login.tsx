import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUCCESS_FEEDBACK_DURATION = 450;

const highlights = [
  {
    icon: Activity,
    title: "Operação em tempo real",
    description: "Acompanhe chamados ativos e o ritmo da equipe em um só lugar.",
  },
  {
    icon: BarChart3,
    title: "Indicadores acionáveis",
    description: "Transforme métricas de SLA e atendimento em decisões mais rápidas.",
  },
  {
    icon: ShieldCheck,
    title: "Ambiente protegido",
    description: "Acesso reservado à equipe autorizada da Polo Telecom.",
  },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [redirectReady, setRedirectReady] = useState(false);

  useEffect(() => {
    if (!loginSuccess) return;

    const timer = window.setTimeout(() => {
      setRedirectReady(true);
    }, SUCCESS_FEEDBACK_DURATION);

    return () => window.clearTimeout(timer);
  }, [loginSuccess]);

  if (redirectReady || (isAuthenticated && !isSubmitting && !loginSuccess)) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || loginSuccess) return;

    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      setLoginSuccess(true);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setError(result.message || "Não foi possível entrar. Verifique suas credenciais.");
  };

  const clearError = () => {
    if (error) setError("");
  };

  const formLocked = isSubmitting || loginSuccess;

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#060913] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-blue-600/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 right-[-10rem] h-[42rem] w-[42rem] rounded-full bg-red-600/15 blur-[140px]"
      />

      <div className="relative z-10 grid min-h-svh lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.72fr)]">
        <section
          aria-labelledby="login-hero-title"
          className="hidden min-h-svh flex-col justify-between px-10 py-9 lg:flex xl:px-16 xl:py-12"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur-xl">
              <img
                src="/Icone_Logo.png"
                alt=""
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">Polo BI</p>
              <p className="text-xs text-slate-500">Inteligência para Help Desk</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 shadow-lg shadow-red-950/20">
              <Sparkles className="h-3.5 w-3.5" />
              Visibilidade que move a operação
            </div>
            <h1
              id="login-hero-title"
              className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white xl:text-6xl"
            >
              Decisões mais rápidas começam com uma operação visível.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 xl:text-lg">
              Métricas essenciais, desempenho da equipe e alertas críticos reunidos em uma experiência clara e confiável.
            </p>

            <div className="mt-10 grid gap-3 xl:grid-cols-3">
              {highlights.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-md transition-colors duration-200 hover:border-white/[0.14] hover:bg-white/[0.055]"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] text-red-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.07] pt-5 text-xs text-slate-600">
            <span>Polo Telecom · Business Intelligence</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
              Ambiente operacional
            </span>
          </div>
        </section>

        <section
          aria-labelledby="login-title"
          className="flex min-h-svh items-center justify-center border-white/[0.07] bg-slate-950/35 px-5 py-8 backdrop-blur-xl sm:px-8 lg:border-l"
        >
          <div className="w-full max-w-[430px]">
            <div className="mb-9 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <img
                    src="/Icone_Logo.png"
                    alt=""
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Polo BI</p>
                  <p className="text-[11px] text-slate-500">Polo Telecom</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                Seguro
              </span>
            </div>

            <div className="mb-8">
              <div className="mb-5 hidden lg:block">
                <img
                  src="/logo-padrao-polo.png"
                  alt="Polo Telecom"
                  className="h-12 w-auto max-w-[220px] object-contain object-left"
                  onError={(event) => {
                    const image = event.currentTarget;
                    if (image.dataset.fallbackUsed === "true") return;
                    image.dataset.fallbackUsed = "true";
                    image.src = "/Icone_Logo.png";
                  }}
                />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                Área restrita
              </p>
              <h2
                id="login-title"
                className="text-3xl font-semibold tracking-[-0.025em] text-white sm:text-[2.15rem]"
              >
                Bem-vindo de volta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Entre com suas credenciais para acessar o painel operacional.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              aria-busy={isSubmitting}
            >
              <div
                id="login-feedback"
                className="min-h-0"
                aria-live="polite"
                aria-atomic="true"
              >
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 shadow-lg shadow-rose-950/10"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <span className="leading-5">{error}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div
                    role="status"
                    className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 shadow-lg shadow-emerald-950/10"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    </span>
                    <span>
                      <strong className="block font-semibold">Acesso liberado</strong>
                      <span className="text-xs text-emerald-200/70">Preparando seu dashboard…</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                  E-mail
                </Label>
                <div className="group relative">
                  <Mail
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-red-300"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="nome@polotelecom.com.br"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearError();
                    }}
                    className="h-12 rounded-xl border-white/10 bg-white/[0.045] pl-10 text-[15px] text-white shadow-inner shadow-black/10 outline-none placeholder:text-slate-600 focus-visible:border-red-400/60 focus-visible:ring-2 focus-visible:ring-red-500/15 disabled:opacity-60"
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={formLocked}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-feedback" : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Senha
                </Label>
                <div className="group relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-red-300"
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearError();
                    }}
                    className="h-12 rounded-xl border-white/10 bg-white/[0.045] px-10 pl-10 text-[15px] text-white shadow-inner shadow-black/10 outline-none placeholder:text-slate-600 focus-visible:border-red-400/60 focus-visible:ring-2 focus-visible:ring-red-500/15 disabled:opacity-60"
                    required
                    autoComplete="current-password"
                    disabled={formLocked}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-feedback" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={formLocked}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 disabled:pointer-events-none disabled:opacity-50"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="group mt-1 h-12 w-full rounded-xl border-red-400/20 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-5 text-sm font-semibold text-white shadow-[0_16px_38px_-16px_rgba(239,68,68,0.65)] transition-all duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c17]"
                disabled={formLocked}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    Verificando acesso…
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Acesso liberado
                  </>
                ) : (
                  <>
                    Entrar no Polo BI
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/[0.07] pt-6 text-center text-xs text-slate-600">
              <LockKeyhole className="h-3.5 w-3.5" />
              Suas credenciais são processadas em ambiente protegido.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
