import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BatteryCharging,
  CalendarDays,
  Check,
  Expand,
  Minimize2,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { BreakAlertOverlay } from "@/components/BreakAlertOverlay";
import { NotificationOverlay } from "@/components/NotificationOverlay";
import { Button } from "@/components/ui/button";
import {
  ManagementLayoutProvider,
  useManagementLayout,
} from "@/context/ManagementLayoutContext";
import { useToast } from "@/hooks/use-toast";
import Home from "@/pages/home";
import { announcementQueue } from "@/services/announcementQueue";

const SOUND_PREFERENCE_KEY = "polo-bi-management-sound-enabled";
const SOUND_PREFERENCE_EVENT = "polo-bi:management-sound-change";

type WakeLockStatus = "active" | "blocked" | "idle" | "unsupported";

interface WakeLockSentinelLike extends EventTarget {
  readonly released: boolean;
  release: () => Promise<void>;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const ManagementHome = memo(function ManagementHome() {
  return <Home mode="management" />;
});

function getInitialSoundPreference() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_PREFERENCE_KEY) !== "false";
}

function GestaoContent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const {
    isEditing,
    isLayoutReady,
    hasChanges,
    beginEditing,
    resetDraft,
    applyChanges,
    cancelEditing,
  } = useManagementLayout();
  const [now, setNow] = useState(() => new Date());
  const [canCustomizeLayout, setCanCustomizeLayout] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(min-width: 1280px)").matches,
  );
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document === "undefined" ? false : Boolean(document.fullscreenElement),
  );
  const [soundEnabled, setSoundEnabled] = useState(getInitialSoundPreference);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [guidanceDismissed, setGuidanceDismissed] = useState(false);
  const [wakeLockStatus, setWakeLockStatus] = useState<WakeLockStatus>(() => {
    if (typeof navigator === "undefined") return "idle";
    return "wakeLock" in navigator ? "idle" : "unsupported";
  });
  const [browserMessage, setBrowserMessage] = useState<string | null>(null);
  const [breakDockTarget, setBreakDockTarget] = useState<HTMLDivElement | null>(
    null,
  );

  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const wakeLockRequestRef = useRef<Promise<void> | null>(null);
  const audioUnlockRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);
  const customizationButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditingRef = useRef(isEditing);

  const publishSoundPreference = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
    announcementQueue.setMuted(!enabled);
    window.dispatchEvent(
      new CustomEvent(SOUND_PREFERENCE_EVENT, { detail: { enabled } }),
    );
  }, []);

  const unlockAudio = useCallback(async () => {
    if (audioUnlocked) return true;
    if (audioUnlockRef.current) return audioUnlockRef.current;

    const unlockPromise = (async () => {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as WindowWithWebkitAudio).webkitAudioContext;

      if (!AudioContextConstructor) {
        if (mountedRef.current) {
          setBrowserMessage("Este navegador não oferece suporte ao áudio da sala.");
        }
        return false;
      }

      try {
        const context = new AudioContextConstructor();
        await context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        gain.gain.value = 0;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.01);
        await context.close();

        if (mountedRef.current) {
          setAudioUnlocked(true);
          setBrowserMessage(null);
        }
        return true;
      } catch {
        if (mountedRef.current) {
          setBrowserMessage(
            "O navegador bloqueou o áudio. Clique em “Ativar som” para tentar novamente.",
          );
        }
        return false;
      }
    })();

    audioUnlockRef.current = unlockPromise;
    try {
      return await unlockPromise;
    } finally {
      audioUnlockRef.current = null;
    }
  }, [audioUnlocked]);

  const requestWakeLock = useCallback(async () => {
    const wakeLock = (navigator as unknown as NavigatorWithWakeLock).wakeLock;
    if (!wakeLock) {
      setWakeLockStatus("unsupported");
      return;
    }

    if (document.visibilityState !== "visible") return;
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      setWakeLockStatus("active");
      return;
    }
    if (wakeLockRequestRef.current) return wakeLockRequestRef.current;

    const request = (async () => {
      try {
        const sentinel = await wakeLock.request("screen");
        if (!mountedRef.current) {
          await sentinel.release();
          return;
        }

        wakeLockRef.current = sentinel;
        setWakeLockStatus("active");
        sentinel.addEventListener(
          "release",
          () => {
            if (wakeLockRef.current === sentinel) wakeLockRef.current = null;
            if (mountedRef.current) setWakeLockStatus("idle");
          },
          { once: true },
        );
      } catch {
        if (mountedRef.current) setWakeLockStatus("blocked");
      }
    })();

    wakeLockRequestRef.current = request;
    try {
      await request;
    } finally {
      wakeLockRequestRef.current = null;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenEnabled) {
      setBrowserMessage("Tela cheia não está disponível neste navegador.");
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      setBrowserMessage(null);
    } catch {
      setBrowserMessage(
        "O navegador bloqueou a tela cheia. Use o botão novamente após interagir com a página.",
      );
    }
  }, []);

  const handleSoundControl = useCallback(async () => {
    if (!soundEnabled) {
      publishSoundPreference(true);
      await unlockAudio();
      return;
    }

    if (!audioUnlocked) {
      await unlockAudio();
      return;
    }

    publishSoundPreference(false);
  }, [audioUnlocked, publishSoundPreference, soundEnabled, unlockAudio]);

  const handleExit = useCallback(() => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
      }
    } catch {
      // O painel pode ter sido aberto sem acesso à aba de origem.
    }

    window.setTimeout(() => navigate("/"), 80);
  }, [navigate]);

  const handleCustomizationToggle = useCallback(() => {
    if (!canCustomizeLayout || !isLayoutReady) return;

    if (isEditing) {
      cancelEditing();
      toast({
        title: "Edição cancelada",
        description: "O último layout aplicado foi restaurado.",
      });
      return;
    }

    beginEditing();
  }, [
    beginEditing,
    canCustomizeLayout,
    cancelEditing,
    isEditing,
    isLayoutReady,
    toast,
  ]);

  const handleResetDraft = useCallback(() => {
    resetDraft();
    toast({
      title: "Layout padrão carregado",
      description: "Revise a prévia e clique em Aplicar para salvar.",
    });
  }, [resetDraft, toast]);

  const handleCancelEditing = useCallback(() => {
    cancelEditing();
    toast({
      title: "Alterações descartadas",
      description: "O último layout aplicado foi restaurado.",
    });
  }, [cancelEditing, toast]);

  const handleApplyChanges = useCallback(() => {
    if (!hasChanges) return;
    applyChanges();
    toast({
      title: "Layout personalizado",
      description: "As proporções foram salvas neste navegador.",
    });
  }, [applyChanges, hasChanges, toast]);

  useEffect(() => {
    mountedRef.current = true;
    const previousTitle = document.title;
    document.title = "Gestão em Tempo Real | Polo BI";
    const clock = window.setInterval(() => setNow(new Date()), 1_000);
    return () => {
      mountedRef.current = false;
      document.title = previousTitle;
      window.clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    const wasEditing = wasEditingRef.current;
    wasEditingRef.current = isEditing;

    if (!wasEditing || isEditing || !canCustomizeLayout) return;

    const focusFrame = window.requestAnimationFrame(() => {
      customizationButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [canCustomizeLayout, isEditing]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      setCanCustomizeLayout(event.matches);
      if (!event.matches && isEditing) cancelEditing();
    };

    setCanCustomizeLayout(desktopQuery.matches);
    desktopQuery.addEventListener("change", handleBreakpointChange);
    return () =>
      desktopQuery.removeEventListener("change", handleBreakpointChange);
  }, [cancelEditing, isEditing]);

  useEffect(() => {
    void requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const sentinel = wakeLockRef.current;
      wakeLockRef.current = null;
      if (sentinel && !sentinel.released) void sentinel.release().catch(() => undefined);
    };
  }, [requestWakeLock]);

  const showGuidance =
    !guidanceDismissed &&
    ((soundEnabled && !audioUnlocked) ||
      (!isFullscreen && document.fullscreenEnabled));

  return (
    <div
      className="dark relative flex h-dvh min-h-[640px] flex-col overflow-hidden bg-[#050914] text-slate-100"
      onPointerDownCapture={() => {
        if (soundEnabled && !audioUnlocked) void unlockAudio();
        if (wakeLockStatus === "blocked") void requestWakeLock();
      }}
      onKeyDownCapture={(event) => {
        if (
          soundEnabled &&
          !audioUnlocked &&
          (event.key === "Enter" || event.key === " ")
        ) {
          void unlockAudio();
        }
      }}
    >
      <a
        href="#management-content"
        className="fixed left-3 top-3 z-[120] -translate-y-20 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition-transform focus:translate-y-0"
      >
        Pular para os indicadores
      </a>

      <header className="relative z-40 flex h-16 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#070d19]/95 px-3 shadow-[0_10px_35px_-28px_rgba(14,165,233,0.8)] backdrop-blur-xl sm:gap-3 sm:px-5 xl:px-7 [@media(max-height:820px)]:h-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
            <img
              src="/Icone_Logo.png"
              alt=""
              className="h-9 w-9 object-contain"
            />
            <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          </span>
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-tight text-white">
                Sala de Gestão
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300 md:flex">
                <Radio className="h-2.5 w-2.5" aria-hidden="true" />
                Ao vivo
              </span>
            </div>
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
              Centro de comando operacional
            </p>
          </div>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <div
            className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 lg:flex"
            title={isOnline ? "Conexão disponível" : "Sem conexão com a rede"}
          >
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            )}
            <span
              className={
                isOnline
                  ? "text-[10px] font-semibold text-emerald-300"
                  : "text-[10px] font-semibold text-rose-300"
              }
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div
            ref={setBreakDockTarget}
            className="flex shrink-0 items-center"
            aria-label="Pausa inteligente"
          />

          <div
            className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 xl:flex"
            title={
              wakeLockStatus === "active"
                ? "Tela mantida ativa"
                : wakeLockStatus === "unsupported"
                  ? "Wake Lock indisponível neste navegador"
                  : "A proteção de tela pode ser ativada pelo navegador"
            }
          >
            <BatteryCharging
              className={
                wakeLockStatus === "active"
                  ? "h-3.5 w-3.5 text-sky-400"
                  : "h-3.5 w-3.5 text-slate-500"
              }
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold text-slate-400">
              {wakeLockStatus === "active" ? "Tela ativa" : "Wake Lock"}
            </span>
          </div>

          <div className="hidden h-10 min-w-[82px] flex-col justify-center border-r border-white/[0.07] pr-2 text-right min-[480px]:flex sm:min-w-[102px] sm:pr-3">
            <time
              dateTime={now.toISOString()}
              className="font-mono text-sm font-bold tabular-nums tracking-[0.06em] text-white sm:text-base"
            >
              {timeFormatter.format(now)}
            </time>
            <span className="hidden max-w-[155px] truncate text-[9px] capitalize text-slate-500 xl:block">
              {dateFormatter.format(now)}
            </span>
          </div>

          <Button
            ref={customizationButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className={
              soundEnabled
                ? "h-9 w-9 border-white/[0.07] bg-white/[0.025] text-sky-300 hover:bg-sky-400/10 hover:text-sky-200"
                : "h-9 w-9 border-white/[0.07] bg-white/[0.025] text-slate-500 hover:text-slate-300"
            }
            onClick={() => void handleSoundControl()}
            aria-label={
              !soundEnabled
                ? "Ativar som"
                : audioUnlocked
                  ? "Desativar som"
                  : "Liberar som"
            }
            aria-pressed={soundEnabled}
            title={
              !soundEnabled
                ? "Ativar notificações sonoras"
                : audioUnlocked
                  ? "Desativar notificações sonoras"
                  : "Clique para liberar o áudio"
            }
          >
            {soundEnabled ? (
              <Volume2 aria-hidden="true" />
            ) : (
              <VolumeX aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={
              isEditing
                ? "h-9 w-9 border border-cyan-400/30 bg-cyan-400/15 text-cyan-200 shadow-[0_0_22px_-10px_rgba(34,211,238,0.9)] hover:bg-cyan-400/20 hover:text-white"
                : "h-9 w-9 border-white/[0.07] bg-white/[0.025] text-slate-300 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            }
            onClick={handleCustomizationToggle}
            disabled={!canCustomizeLayout || !isLayoutReady}
            aria-label={
              isEditing
                ? "Cancelar personalização do layout"
                : "Personalizar tamanho dos blocos"
            }
            aria-pressed={isEditing}
            aria-expanded={isEditing}
            aria-controls="management-layout-editor"
            title={
              !canCustomizeLayout
                ? "A personalização está disponível a partir de 1280 px"
                : !isLayoutReady
                  ? "Carregando preferências do layout"
                  : isEditing
                    ? "Cancelar personalização"
                    : "Personalizar tamanho dos blocos"
            }
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 border-white/[0.07] bg-white/[0.025] text-slate-300 hover:bg-white/[0.07] hover:text-white"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Sair da tela cheia" : "Ativar tela cheia"}
            aria-pressed={isFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Ativar tela cheia"}
          >
            {isFullscreen ? (
              <Minimize2 aria-hidden="true" />
            ) : (
              <Expand aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-2 border-white/[0.07] bg-white/[0.025] px-2.5 text-slate-300 hover:bg-white/[0.07] hover:text-white sm:px-3"
            onClick={handleExit}
            aria-label="Sair da sala e voltar ao dashboard"
            title="Voltar ao dashboard"
          >
            <ArrowLeft aria-hidden="true" />
            <span className="hidden text-xs font-semibold 2xl:inline">Dashboard</span>
          </Button>
        </div>
      </header>

      {isEditing && canCustomizeLayout && (
        <aside
          id="management-layout-editor"
          className="absolute left-1/2 top-[4.65rem] z-[90] flex w-[min(92vw,920px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-cyan-400/20 bg-[#0a1424]/95 p-2.5 shadow-[0_24px_80px_-30px_rgba(6,182,212,0.75)] backdrop-blur-xl xl:left-auto xl:right-[392px] xl:w-[min(calc(100vw-424px),920px)] xl:translate-x-0"
          aria-label="Ferramentas de personalização do wallboard"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-300">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-100">
              Personalizando o wallboard
            </p>
            <p className="truncate text-[10px] leading-relaxed text-slate-400">
              Arraste as alças ou use
              <kbd className="mx-1 rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                ← → ↑ ↓
              </kbd>
              quando uma alça estiver em foco.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 px-2.5 text-[10px] text-slate-300 hover:bg-white/[0.07] hover:text-white"
              onClick={handleResetDraft}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restaurar padrão
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-white/10 bg-white/[0.03] px-3 text-[10px] text-slate-300 hover:bg-white/[0.07] hover:text-white"
              onClick={handleCancelEditing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-cyan-500 px-3 text-[10px] font-semibold text-slate-950 shadow-[0_10px_28px_-14px_rgba(34,211,238,0.9)] hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
              onClick={handleApplyChanges}
              disabled={!hasChanges}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Aplicar
            </Button>
          </div>
        </aside>
      )}

      {showGuidance && !isEditing && (
        <aside
          className="pointer-events-auto absolute left-1/2 top-[4.65rem] z-50 flex w-[min(92vw,720px)] -translate-x-1/2 items-start gap-3 rounded-xl border border-sky-400/20 bg-[#0b1526]/95 p-3 shadow-[0_22px_70px_-30px_rgba(14,165,233,0.65)] backdrop-blur-xl sm:items-center xl:left-auto xl:right-[392px] xl:w-[min(calc(100vw-424px),720px)] xl:translate-x-0"
          aria-label="Configuração recomendada da sala"
        >
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300 sm:flex">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-slate-300 sm:text-xs">
            Para uma experiência contínua, libere o áudio e use tela cheia. Os
            indicadores continuam funcionando mesmo sem essas permissões.
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {soundEnabled && !audioUnlocked && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-sky-400/20 bg-sky-400/10 px-2.5 text-[10px] text-sky-200 hover:bg-sky-400/15"
                onClick={() => void unlockAudio()}
              >
                <Volume2 aria-hidden="true" />
                <span className="hidden sm:inline">Ativar som</span>
              </Button>
            )}
            {!isFullscreen && document.fullscreenEnabled && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-white/10 bg-white/[0.04] px-2.5 text-[10px] text-slate-200 hover:bg-white/[0.08]"
                onClick={() => void toggleFullscreen()}
              >
                <Expand aria-hidden="true" />
                <span className="hidden sm:inline">Tela cheia</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-white"
              onClick={() => setGuidanceDismissed(true)}
              aria-label="Dispensar orientação"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </aside>
      )}

      <main
        id="management-content"
        tabIndex={-1}
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-3 outline-none [scrollbar-color:rgba(71,85,105,0.55)_transparent] sm:px-4 sm:pb-4 sm:pt-4 xl:px-5 2xl:px-6 [@media(max-height:820px)]:px-3 [@media(max-height:820px)]:pb-2.5 [@media(max-height:820px)]:pt-2.5"
        style={isEditing ? { paddingTop: "4.75rem" } : undefined}
      >
        <ManagementHome />
      </main>

      {browserMessage && (
        <div
          className="pointer-events-none fixed bottom-20 left-1/2 z-[180] w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-amber-400/20 bg-amber-950/90 px-4 py-3 text-center text-xs font-medium text-amber-100 shadow-2xl backdrop-blur-xl"
          role="status"
          aria-live="polite"
        >
          {browserMessage}
        </div>
      )}

      <BreakAlertOverlay dockVariant="header" dockTarget={breakDockTarget} />
      <NotificationOverlay />
    </div>
  );
}

export default function Gestao() {
  return (
    <ManagementLayoutProvider>
      <GestaoContent />
    </ManagementLayoutProvider>
  );
}
