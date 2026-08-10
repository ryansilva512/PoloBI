import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { announcementQueue, type AnnouncementQueueSnapshot } from "@/services/announcementQueue";
import {
  notificationStore,
  type AppNotification,
  type ChamadoAtribuidoData,
  type ChamadoExcluidoData,
  type ErroMilvusData,
  type FinalizadoData,
  type NovoChamadoData,
  type PesquisaSatisfacaoData,
  type SLAAvisoData,
  type SLAEstouradoData,
} from "@/stores/notificationStore";
import {
  AlertTriangle,
  BellRing,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Hash,
  MessageSquareQuote,
  MessageSquareText,
  ServerCrash,
  Siren,
  Star,
  Trash2,
  UserCheck,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";

type VisualStyle = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  accentSoft: string;
  border: string;
  glow: string;
  iconSurface: string;
  bar: string;
};

const visualStyles: Record<AppNotification["type"], VisualStyle> = {
  novo_chamado: {
    icon: BellRing,
    eyebrow: "Novo atendimento",
    title: "Chamado aberto",
    accentSoft: "text-sky-200/75",
    border: "border-sky-400/35",
    glow: "shadow-[0_30px_100px_-40px_rgba(14,165,233,0.68)]",
    iconSurface: "border-sky-400/25 bg-sky-400/12 text-sky-300",
    bar: "bg-sky-400",
  },
  chamado_atribuido: {
    icon: UserCheck,
    eyebrow: "Atendimento iniciado",
    title: "Chamado assumido",
    accentSoft: "text-amber-200/75",
    border: "border-amber-400/35",
    glow: "shadow-[0_30px_100px_-40px_rgba(245,158,11,0.65)]",
    iconSurface: "border-amber-400/25 bg-amber-400/12 text-amber-300",
    bar: "bg-amber-400",
  },
  pesquisa_satisfacao: {
    icon: MessageSquareText,
    eyebrow: "Experiência do cliente",
    title: "Nova avaliação recebida",
    accentSoft: "text-violet-200/75",
    border: "border-violet-400/35",
    glow: "shadow-[0_30px_100px_-40px_rgba(139,92,246,0.68)]",
    iconSurface: "border-violet-400/25 bg-violet-400/12 text-violet-300",
    bar: "bg-violet-400",
  },
  chamado_excluido: {
    icon: Trash2,
    eyebrow: "Atualização no MILVUS",
    title: "Chamado identificado como excluído",
    accentSoft: "text-rose-200/75",
    border: "border-rose-400/40",
    glow: "shadow-[0_30px_100px_-40px_rgba(244,63,94,0.7)]",
    iconSurface: "border-rose-400/25 bg-rose-400/12 text-rose-300",
    bar: "bg-rose-400",
  },
  finalizado: {
    icon: CheckCircle2,
    eyebrow: "Atendimento concluído",
    title: "Chamado finalizado",
    accentSoft: "text-emerald-200/75",
    border: "border-emerald-400/35",
    glow: "shadow-[0_30px_100px_-40px_rgba(16,185,129,0.65)]",
    iconSurface: "border-emerald-400/25 bg-emerald-400/12 text-emerald-300",
    bar: "bg-emerald-400",
  },
  sla_aviso: {
    icon: Clock3,
    eyebrow: "Atenção ao primeiro atendimento",
    title: "SLA próximo do limite",
    accentSoft: "text-orange-200/75",
    border: "border-orange-400/40",
    glow: "shadow-[0_30px_100px_-40px_rgba(249,115,22,0.7)]",
    iconSurface: "border-orange-400/25 bg-orange-400/12 text-orange-300",
    bar: "bg-orange-400",
  },
  sla_estourado: {
    icon: Siren,
    eyebrow: "Ação imediata necessária",
    title: "SLA de atendimento excedido",
    accentSoft: "text-red-200/75",
    border: "border-red-400/45",
    glow: "shadow-[0_30px_100px_-40px_rgba(239,68,68,0.72)]",
    iconSurface: "border-red-400/30 bg-red-400/12 text-red-300",
    bar: "bg-red-400",
  },
  erro_milvus: {
    icon: ServerCrash,
    eyebrow: "Integração indisponível",
    title: "Falha na comunicação com o MILVUS",
    accentSoft: "text-red-200/75",
    border: "border-red-400/40",
    glow: "shadow-[0_30px_100px_-40px_rgba(239,68,68,0.68)]",
    iconSurface: "border-red-400/25 bg-red-400/12 text-red-300",
    bar: "bg-red-400",
  },
};

const avatarMap: Record<string, string> = {
  moraes: "/avatars/Moraes.png",
  victor: "/avatars/Victor.png",
  abraao: "/avatars/Abraão.png",
  carlos: "/avatars/Carlos.png",
  alves: "/avatars/Alves.png",
  bruno: "/avatars/Bruno.png",
  paulo: "/avatars/Paulo.png",
  celio: "/avatars/Célio.png",
  ryan: "/avatars/Ryan.png",
};

const normalizeName = (value: string) => value
  .trim()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const avatarFor = (name: string) => {
  const normalized = normalizeName(name);
  return avatarMap[normalized] ?? avatarMap[normalized.split(" ")[0]] ?? "/avatars/default.svg";
};

const initialsFor = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase() || "OP";

const formatTime = (timestamp: number) => new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
}).format(timestamp);

function Detail({ icon: Icon, label, children }: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] px-3.5 py-3 sm:px-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <div className="mt-0.5 break-words text-sm font-semibold leading-snug text-slate-100 sm:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}

function Operator({ name, label, style }: { name: string; label: string; style: VisualStyle }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
      <Avatar className={cn("h-14 w-14 shrink-0 border-2 bg-slate-800 ring-4 ring-white/[0.035] sm:h-16 sm:w-16", style.border)}>
        <AvatarImage src={avatarFor(name)} alt={`Foto de ${name}`} />
        <AvatarFallback className="bg-slate-800 text-base font-extrabold text-slate-100">
          {initialsFor(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={cn("text-[10px] font-bold uppercase tracking-[0.17em]", style.accentSoft)}>{label}</p>
        <p className="mt-1 truncate text-xl font-black tracking-tight text-white sm:text-2xl">{name}</p>
      </div>
    </div>
  );
}

function TicketJourney({ type }: { type: AppNotification["type"] }) {
  const index = type === "novo_chamado"
    ? 0
    : type === "chamado_atribuido"
      ? 1
      : 2;
  const steps = ["Aberto", "Em atendimento", "Avaliado"];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-slate-950/35 px-3 py-3 sm:px-5" aria-label={`Evolução do chamado: ${steps[Math.max(index, 0)]}`}>
      <ol className="flex items-center" aria-label="Aberto, em atendimento, avaliado">
        {steps.map((step, stepIndex) => {
          const reached = index >= stepIndex;
          const current = index === stepIndex;
          return (
            <li key={step} className={cn("flex min-w-0 items-center", stepIndex < steps.length - 1 && "flex-1")}>
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span className={cn(
                  "grid h-5 w-5 place-items-center rounded-full border transition-colors",
                  reached ? "border-current bg-current/15 text-white" : "border-slate-700 text-slate-600",
                  current && "ring-4 ring-white/[0.05]",
                )}>
                  {reached && !current ? <Check className="h-3 w-3" /> : <Circle className={cn("h-2 w-2", current && "fill-current")} />}
                </span>
                <span className={cn(
                  "whitespace-nowrap text-[9px] font-bold uppercase tracking-wide sm:text-[10px]",
                  reached ? "text-slate-200" : "text-slate-600",
                )}>{step}</span>
              </div>
              {stepIndex < steps.length - 1 && (
                <span className={cn("mx-2 mb-5 h-px flex-1 sm:mx-4", index > stepIndex ? "bg-slate-400" : "bg-slate-700")} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DeletedState() {
  return (
    <div
      className="flex items-center justify-center gap-2.5 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-rose-200"
      aria-label="Estado do registro: excluído"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] sm:text-xs">
        Estado detectado: excluído
      </span>
    </div>
  );
}

function NotificationContent({ notification, style }: { notification: AppNotification; style: VisualStyle }) {
  switch (notification.type) {
    case "novo_chamado": {
      const data = notification.data as NovoChamadoData;
      return (
        <>
          <p className="text-pretty text-xl font-black leading-tight tracking-tight text-white sm:text-3xl">{data.assunto}</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Detail icon={Hash} label="Chamado">#{data.codigo}</Detail>
            <Detail icon={Building2} label="Cliente">{data.nome_fantasia || "Não informado"}</Detail>
            {data.mesa_trabalho && <Detail icon={BriefcaseBusiness} label="Mesa de trabalho">{data.mesa_trabalho}</Detail>}
            {data.status && <Detail icon={Clock3} label="Status inicial">{data.status}</Detail>}
          </div>
        </>
      );
    }
    case "chamado_atribuido": {
      const data = notification.data as ChamadoAtribuidoData;
      return (
        <>
          <Operator name={data.nome || "Operador não informado"} label="Assumido por" style={style} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Detail icon={Hash} label="Chamado">#{data.codigo}</Detail>
            <Detail icon={Building2} label="Cliente">{data.nome_fantasia || "Não informado"}</Detail>
            <div className="sm:col-span-2"><Detail icon={BriefcaseBusiness} label="Assunto">{data.assunto}</Detail></div>
          </div>
        </>
      );
    }
    case "pesquisa_satisfacao": {
      const data = notification.data as PesquisaSatisfacaoData;
      const rating = Number.parseFloat(String(data.nota ?? "0").replace(",", "."));
      const filledStars = Number.isFinite(rating) ? Math.max(0, Math.min(5, Math.round(rating))) : 0;
      return (
        <>
          <Operator name={data.operador || "Operador não informado"} label="Operador avaliado" style={style} />
          <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.07] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-violet-200/70">Nota recebida</p>
                <p className="mt-0.5 text-3xl font-black text-white">{data.nota || "—"}<span className="ml-1 text-sm font-semibold text-slate-400">/ 5</span></p>
              </div>
              <div className="flex gap-1" aria-label={`${filledStars} de 5 estrelas`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={cn("h-5 w-5 sm:h-6 sm:w-6", star <= filledStars ? "fill-amber-300 text-amber-300" : "text-slate-700")} aria-hidden="true" />
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Detail icon={Hash} label="Chamado">#{data.ticket}</Detail>
            <Detail icon={Building2} label="Cliente">{data.razao_social || "Não informado"}</Detail>
          </div>
          {data.descricao_avaliacao?.trim() && (
            <div className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
              <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Comentário do cliente</p>
                <blockquote className="mt-1.5 max-h-28 overflow-y-auto break-words pr-1 text-sm italic leading-relaxed text-slate-200 sm:text-base">
                  “{data.descricao_avaliacao}”
                </blockquote>
              </div>
            </div>
          )}
        </>
      );
    }
    case "chamado_excluido": {
      const data = notification.data as ChamadoExcluidoData;
      return (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-sm leading-relaxed text-rose-100 sm:text-base">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden="true" />
            <p>O relatório do MILVUS passou a marcar este chamado como excluído. O painel não presume quem realizou a ação.</p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Detail icon={Hash} label="Chamado">#{data.codigo}</Detail>
            <Detail icon={Building2} label="Cliente">{data.nome_fantasia || "Não informado"}</Detail>
            {data.assunto && <div className="sm:col-span-2"><Detail icon={BriefcaseBusiness} label="Assunto">{data.assunto}</Detail></div>}
          </div>
          <p className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Detectado às {formatTime(notification.detectedAt ?? notification.createdAt)}
          </p>
        </>
      );
    }
    case "finalizado": {
      const data = notification.data as FinalizadoData;
      return (
        <>
          <Operator name={data.nome || "Operador não informado"} label="Finalizado por" style={style} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Detail icon={Hash} label="Chamado">#{data.codigo}</Detail>
            <Detail icon={Building2} label="Cliente">{data.nome_fantasia || "Não informado"}</Detail>
            <div className="sm:col-span-2"><Detail icon={BriefcaseBusiness} label="Assunto">{data.assunto}</Detail></div>
          </div>
        </>
      );
    }
    case "sla_aviso": {
      const data = notification.data as SLAAvisoData;
      return <SlaContent code={data.codigo} client={data.nome_fantasia} subject={data.assunto} message={`${data.minutos} minutos sem atendimento`} />;
    }
    case "sla_estourado": {
      const data = notification.data as SLAEstouradoData;
      return <SlaContent code={data.codigo} client={data.nome_fantasia} subject={data.assunto} message="Limite de primeiro atendimento excedido" />;
    }
    case "erro_milvus": {
      const data = notification.data as ErroMilvusData;
      return (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4">
            <span className="font-mono text-3xl font-black text-red-300">{data.status}</span>
            <p className="break-words text-sm font-semibold text-red-100 sm:text-base">{data.message}</p>
          </div>
          {data.endpoint && <Detail icon={ServerCrash} label="Endpoint"><span className="font-mono text-xs sm:text-sm">{data.endpoint}</span></Detail>}
        </>
      );
    }
  }
}

function SlaContent({ code, client, subject, message }: { code: number; client?: string; subject: string; message: string }) {
  return (
    <>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 text-center sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">Tempo de resposta</p>
        <p className="mt-1 text-xl font-black text-white sm:text-2xl">{message}</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Detail icon={Hash} label="Chamado">#{code}</Detail>
        <Detail icon={Building2} label="Cliente">{client || "Não informado"}</Detail>
        <div className="sm:col-span-2"><Detail icon={BriefcaseBusiness} label="Assunto">{subject}</Detail></div>
      </div>
    </>
  );
}

const phaseLabels: Record<AppNotification["phase"], string> = {
  waiting: "Aguardando",
  cue: "Sinal sonoro",
  speaking: "Narrando agora",
  displaying: "Detalhes na tela",
};

const phaseOrder: AppNotification["phase"][] = ["cue", "speaking", "displaying"];

function NotificationCard({ notification, pendingCount, muted, onDismiss, onToggleMute }: {
  notification: AppNotification;
  pendingCount: number;
  muted: boolean;
  onDismiss: (id: string) => void;
  onToggleMute: () => void;
}) {
  const style = visualStyles[notification.type];
  const Icon = style.icon;
  const phaseIndex = phaseOrder.indexOf(notification.phase);
  const accessibleAnnouncement = notification.announcementText || (
    notification.type === "erro_milvus"
      ? `${style.title}. ${(notification.data as ErroMilvusData).message}`
      : style.title
  );

  return (
    <section
      role="region"
      aria-labelledby={`notification-title-${notification.id}`}
      className={cn(
        "pointer-events-auto relative flex max-h-[calc(100dvh-1rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border bg-[linear-gradient(145deg,rgba(15,23,42,0.985),rgba(5,10,22,0.985))] text-slate-100 backdrop-blur-2xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-5 motion-safe:duration-300 sm:rounded-[28px]",
        style.border,
        style.glow,
      )}
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {accessibleAnnouncement}. {pendingCount > 0 ? `${pendingCount} avisos aguardando na fila.` : "Este é o único aviso na fila."}
      </p>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.025] px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", style.bar, notification.phase === "speaking" && "motion-safe:animate-pulse")} aria-hidden="true" />
          <span className="truncate">{phaseLabels[notification.phase]}</span>
        </div>
        <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300 sm:text-xs">
          {pendingCount > 0 ? `${pendingCount} aguardando` : "Fila em dia"}
        </span>
      </div>

      <div className="scrollbar-subtle overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-7">
        <header className="flex items-start gap-3.5 sm:gap-5">
          <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl border sm:h-14 sm:w-14", style.iconSurface)}>
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={cn("text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-xs", style.accentSoft)}>{style.eyebrow}</p>
            <h2 id={`notification-title-${notification.id}`} className="mt-1 text-balance text-lg font-black leading-tight tracking-tight text-white sm:text-2xl md:text-[1.7rem]">{style.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-400">Recebido às {formatTime(notification.createdAt)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleMute}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={muted ? "Ativar voz dos avisos" : "Silenciar voz dos avisos"}
              title={muted ? "Ativar voz" : "Silenciar voz"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-slate-400 transition-colors hover:border-rose-400/25 hover:bg-rose-400/10 hover:text-rose-200 focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Pular este aviso"
              title="Pular este aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {["novo_chamado", "chamado_atribuido", "pesquisa_satisfacao"].includes(notification.type) && (
          <div className="mt-5 sm:mt-6"><TicketJourney type={notification.type} /></div>
        )}
        {notification.type === "chamado_excluido" && (
          <div className="mt-5 sm:mt-6"><DeletedState /></div>
        )}
        <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
          <NotificationContent notification={notification} style={style} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-t border-white/[0.06] bg-black/15 p-2" aria-hidden="true">
        {phaseOrder.map((phase, index) => (
          <span key={phase} className={cn("h-1 rounded-full transition-colors", index <= phaseIndex ? style.bar : "bg-white/[0.07]")} />
        ))}
      </div>
    </section>
  );
}

const emptyQueueSnapshot: AnnouncementQueueSnapshot = {
  active: null,
  pendingCount: 0,
  totalCount: 0,
  isBusy: false,
  muted: false,
  phase: null,
};

export function NotificationOverlay() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationStore.getAll());
  const [queueSnapshot, setQueueSnapshot] = useState<AnnouncementQueueSnapshot>(() =>
    typeof window === "undefined" ? emptyQueueSnapshot : announcementQueue.getSnapshot(),
  );

  useEffect(() => notificationStore.subscribe(setNotifications), []);
  useEffect(() => announcementQueue.subscribe(setQueueSnapshot), []);

  const active = useMemo(
    () => notifications.find((notification) => notification.phase !== "waiting") ?? null,
    [notifications],
  );
  const dismiss = useCallback((id: string) => notificationStore.remove(id), []);
  const toggleMute = useCallback(() => {
    const nextMuted = !announcementQueue.isMuted();
    announcementQueue.setMuted(nextMuted);

    if (typeof window !== "undefined" && window.location.pathname.startsWith("/gestao")) {
      const enabled = !nextMuted;
      window.localStorage.setItem("polo-bi-management-sound-enabled", String(enabled));
      window.dispatchEvent(new CustomEvent("polo-bi:management-sound-change", {
        detail: { enabled },
      }));
    }
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[10020] grid place-items-center overflow-hidden bg-slate-950/35 p-2 backdrop-blur-[2px] sm:p-4"
      role="region"
      aria-label="Avisos de chamados"
    >
      <NotificationCard
        notification={active}
        pendingCount={queueSnapshot.pendingCount}
        muted={queueSnapshot.muted}
        onDismiss={dismiss}
        onToggleMute={toggleMute}
      />
    </div>
  );
}

// Compatibilidade: produtores antigos importavam store e tipos deste componente.
export {
  notificationStore,
  type AppNotification,
  type ChamadoAtribuidoData,
  type ChamadoExcluidoData,
  type ErroMilvusData,
  type FinalizadoData,
  type NovoChamadoData,
  type NotificationData,
  type NotificationType,
  type PesquisaSatisfacaoData,
  type SLAAvisoData,
  type SLAEstouradoData,
} from "@/stores/notificationStore";
