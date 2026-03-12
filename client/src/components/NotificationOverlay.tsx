// =====================================================================
// NotificationOverlay — Cards de alerta grandes para novos chamados,
// chamados finalizados e erros da API Milvus
// =====================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    Bell,
    CheckCircle2,
    AlertTriangle,
    X,
    Phone,
    User,
    Building2,
    Hash,
    Clock,
    Briefcase,
    ServerCrash,
} from "lucide-react";

// ===================== TYPES =====================

export type NotificationType = "novo_chamado" | "finalizado" | "erro_milvus";

export interface NovoChamadoData {
    codigo: number;
    assunto: string;
    nome_fantasia?: string;
    data_criacao?: string;
    status?: string;
    mesa_trabalho?: string;
    nome?: string; // operador atribuído
}

export interface FinalizadoData {
    codigo: number;
    assunto: string;
    nome?: string; // operador que finalizou
    nome_fantasia?: string;
}

export interface ErroMilvusData {
    status: number;
    message: string;
    endpoint?: string;
    timestamp?: string;
}

export interface AppNotification {
    id: string;
    type: NotificationType;
    data: NovoChamadoData | FinalizadoData | ErroMilvusData;
    createdAt: number;
    duration: number; // ms
}

// ===================== STORE (singleton pub/sub) =====================

type NotificationListener = (notifications: AppNotification[]) => void;

class NotificationStore {
    private notifications: AppNotification[] = [];
    private listeners: Set<NotificationListener> = new Set();
    private counter = 0;

    add(
        type: NotificationType,
        data: NovoChamadoData | FinalizadoData | ErroMilvusData,
        duration = 10000
    ) {
        const id = `notif-${++this.counter}-${Date.now()}`;
        const notification: AppNotification = {
            id,
            type,
            data,
            createdAt: Date.now(),
            duration,
        };

        this.notifications = [notification, ...this.notifications].slice(0, 5);
        this.notify();

        // Auto-remove
        setTimeout(() => this.remove(id), duration);
        return id;
    }

    remove(id: string) {
        const before = this.notifications.length;
        this.notifications = this.notifications.filter((n) => n.id !== id);
        if (this.notifications.length !== before) this.notify();
    }

    subscribe(listener: NotificationListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    getAll(): AppNotification[] {
        return [...this.notifications];
    }

    private notify() {
        this.listeners.forEach((l) => l(this.getAll()));
    }
}

export const notificationStore = new NotificationStore();

// ===================== AVATAR HELPER =====================

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

const normalizeName = (value: string) =>
    value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const getAvatarSrc = (nome: string) => {
    const key = normalizeName(nome);
    if (avatarMap[key]) return avatarMap[key];
    const first = key.split(" ")[0];
    if (avatarMap[first]) return avatarMap[first];
    return `/avatars/${key}.png`;
};

// ===================== SINGLE CARD =====================

function NotificationCard({
    notification,
    onDismiss,
}: {
    notification: AppNotification;
    onDismiss: (id: string) => void;
}) {
    const [exiting, setExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const mountRef = useRef(Date.now());

    // Progress bar countdown
    useEffect(() => {
        const start = mountRef.current;
        const dur = notification.duration;
        const tick = () => {
            const elapsed = Date.now() - start;
            const pct = Math.max(0, 100 - (elapsed / dur) * 100);
            setProgress(pct);
            if (pct > 0) {
                requestAnimationFrame(tick);
            }
        };
        const raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [notification.duration]);

    const handleDismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
    }, [notification.id, onDismiss]);

    // Type-specific rendering
    const renderContent = () => {
        switch (notification.type) {
            case "novo_chamado": {
                const d = notification.data as NovoChamadoData;
                return (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-6">
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 shrink-0">
                                <Bell className="h-10 w-10 text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-2xl font-black text-blue-300 truncate">
                                    🔔 Novo Chamado Aberto!
                                </h3>
                                <p className="text-sm text-slate-400 font-medium">
                                    {d.data_criacao
                                        ? new Date(d.data_criacao).toLocaleString("pt-BR")
                                        : new Date().toLocaleString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 pl-1">
                            <div className="flex items-start gap-3">
                                <Hash className="h-6 w-6 text-blue-400/70 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                                        Código
                                    </span>
                                    <p className="text-xl font-black text-white">
                                        #{d.codigo}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Briefcase className="h-6 w-6 text-blue-400/70 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                                        Assunto
                                    </span>
                                    <p className="text-xl font-bold text-slate-200 break-words leading-tight">
                                        {d.assunto}
                                    </p>
                                </div>
                            </div>

                            {d.nome_fantasia && (
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-6 w-6 text-blue-400/70 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                                            Cliente
                                        </span>
                                        <p className="text-lg text-slate-300 font-semibold truncate">
                                            {d.nome_fantasia}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-8 py-2">
                                {d.mesa_trabalho && (
                                    <div className="flex items-center gap-2.5">
                                        <Phone className="h-5 w-5 text-blue-400/60" />
                                        <span className="text-base text-slate-400 font-medium">
                                            {d.mesa_trabalho}
                                        </span>
                                    </div>
                                )}
                                {d.status && (
                                    <span className="text-sm px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                                        {d.status}
                                    </span>
                                )}
                                {d.nome && (
                                    <div className="flex items-center gap-2.5">
                                        <User className="h-5 w-5 text-blue-400/60" />
                                        <span className="text-base text-slate-400 font-medium">
                                            {d.nome}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
            }

            case "finalizado": {
                const d = notification.data as FinalizadoData;
                const operadorNome = d.nome || "Operador";
                return (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-6">
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 shrink-0">
                                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-2xl font-black text-emerald-300 truncate">
                                    ✅ Chamado Finalizado!
                                </h3>
                                <p className="text-sm text-slate-400 font-medium">
                                    {new Date().toLocaleString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        {/* Body with operator avatar */}
                        <div className="flex items-center gap-6 mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <Avatar className="h-20 w-20 ring-4 ring-emerald-500/40 ring-offset-4 ring-offset-slate-900 shrink-0">
                                <AvatarImage
                                    src={getAvatarSrc(operadorNome)}
                                    alt={operadorNome}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-green-700 text-white font-black text-2xl">
                                    {operadorNome.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-xs uppercase text-emerald-400/70 font-bold tracking-widest">
                                    Finalizado por
                                </p>
                                <p className="text-2xl font-black text-emerald-300 truncate">
                                    {operadorNome}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pl-1">
                            <div className="flex items-start gap-3">
                                <Hash className="h-6 w-6 text-emerald-400/70 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                                        Código
                                    </span>
                                    <p className="text-xl font-black text-white">
                                        #{d.codigo}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Briefcase className="h-6 w-6 text-emerald-400/70 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                                        Assunto
                                    </span>
                                    <p className="text-xl font-bold text-slate-200 break-words leading-tight">
                                        {d.assunto}
                                    </p>
                                </div>
                            </div>

                            {d.nome_fantasia && (
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-6 w-6 text-emerald-400/70 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-xs uppercase text-slate-500 font-bold tracking-widest">
                                            Cliente
                                        </span>
                                        <p className="text-lg text-slate-300 font-semibold truncate">
                                            {d.nome_fantasia}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            }

            case "erro_milvus": {
                const d = notification.data as ErroMilvusData;
                return (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 shrink-0">
                                <ServerCrash className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-red-300 truncate">
                                    🚨 Erro na API Milvus!
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    {d.timestamp
                                        ? new Date(d.timestamp).toLocaleString("pt-BR")
                                        : new Date().toLocaleString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="space-y-2 pl-1">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="h-8 w-8 text-red-400 shrink-0" />
                                <div>
                                    <p className="text-2xl font-bold text-red-300 font-mono">
                                        {d.status}
                                    </p>
                                    <p className="text-sm text-red-400/80">
                                        {d.message}
                                    </p>
                                </div>
                            </div>

                            {d.endpoint && (
                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-red-400/70 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <span className="text-[10px] uppercase text-slate-500 tracking-wider">
                                            Endpoint
                                        </span>
                                        <p className="text-xs text-slate-400 font-mono truncate">
                                            {d.endpoint}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            }
        }
    };

    // Color config by type
    const borderColor = {
        novo_chamado: "border-blue-500/40",
        finalizado: "border-emerald-500/40",
        erro_milvus: "border-red-500/40",
    }[notification.type];

    const glowColor = {
        novo_chamado: "shadow-blue-500/20",
        finalizado: "shadow-emerald-500/20",
        erro_milvus: "shadow-red-500/20",
    }[notification.type];

    const progressColor = {
        novo_chamado: "bg-blue-500",
        finalizado: "bg-emerald-500",
        erro_milvus: "bg-red-500",
    }[notification.type];

    return (
        <div
            className={cn(
                "relative w-[700px] max-w-[calc(100vw-4rem)] rounded-3xl border-4 backdrop-blur-2xl bg-slate-900/95 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500",
                borderColor,
                glowColor,
                exiting
                    ? "animate-out zoom-out-95 fade-out-0 duration-300"
                    : "animate-in zoom-in-95 slide-in-from-bottom-10 fade-in-0 duration-500"
            )}
        >
            {/* Close button */}
            <button
                onClick={handleDismiss}
                className="absolute top-5 right-5 z-10 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Content */}
            <div className="p-10 pr-14">{renderContent()}</div>

            {/* Progress bar */}
            <div className="h-1 bg-white/5">
                <div
                    className={cn("h-full transition-none", progressColor)}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// ===================== OVERLAY =====================

export function NotificationOverlay() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        // Get initial state
        setNotifications(notificationStore.getAll());

        // Subscribe to changes
        const unsub = notificationStore.subscribe((updated) => {
            setNotifications(updated);
        });

        return unsub;
    }, []);

    const handleDismiss = useCallback((id: string) => {
        notificationStore.remove(id);
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            <div className="flex flex-col gap-6 pointer-events-none max-h-screen overflow-hidden p-4">
                {notifications.slice(0, 2).map((notification) => (
                    <div key={notification.id} className="pointer-events-auto">
                        <NotificationCard
                            notification={notification}
                            onDismiss={handleDismiss}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
