import type { ReactNode } from "react";
import {
  Activity,
  CalendarDays,
  Clock3,
  RefreshCw,
  Timer,
  Trophy,
  UsersRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ManagementResizableLayout } from "@/components/management-resizable-layout";
import { cn } from "@/lib/utils";

export interface ManagementRankingItem {
  operador: string;
  quantidade: number;
}

export interface ManagementActiveTicket {
  status?: unknown;
}

export interface ManagementActivityItem {
  operador: string;
  dias: number[];
  total: number;
}

export interface ManagementCalendarCell {
  dia: number | null;
  quantidade: number;
  data: Date | null;
}

export interface ManagementCalendarData {
  mes: string;
  semanas: ManagementCalendarCell[][];
}

export interface ManagementKpi {
  titulo: string;
  valor: string | number;
  detalhe: string;
  icon: ReactNode;
  valueColor?: string;
}

export interface ManagementResponseTime {
  nome: string;
  tempoMedioMinutos: number;
}

export interface ManagementServiceTime {
  nome: string;
  tempoMedioAtendimentoMinutos: number;
}

export interface ManagementDashboardProps {
  rankingPesquisas: ManagementRankingItem[];
  openTicketsCount: number;
  chamadosAtivos: ManagementActiveTicket[];
  tempoAbertura: string;
  tempoSolucao: string;
  atividade: ManagementActivityItem[];
  calendario: ManagementCalendarData;
  kpis: ManagementKpi[];
  tempoResposta: ManagementResponseTime[];
  tempoAtendimento: ManagementServiceTime[];
  isRefreshing: boolean;
  nextRefreshSeconds: number;
  lastUpdatedLabel: string;
  onRefresh: () => void;
  isOnline: boolean;
  getAvatarSrc: (name: string) => string | null | undefined;
  formatDuration: (minutes: number) => string;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const CALENDAR_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const panelClass =
  "min-w-0 overflow-hidden rounded-2xl border border-slate-700/55 bg-slate-950/68 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.025] backdrop-blur-xl [@media(max-height:820px)]:rounded-xl";

const panelHeadingClass =
  "flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 min-[1700px]:text-xs [@media(max-height:820px)]:gap-1.5 [@media(max-height:820px)]:text-[10px]";

const MANAGEMENT_KPI_LABELS: Readonly<Record<string, string>> = {
  "Qtd Resposta em Dia": "Respostas em dia",
  "Qtd Atendimento em Dia": "Atendimentos em dia",
  "Qtd Resposta Estourada": "Respostas estouradas",
  "Qtd Atendimento Expirado": "Atendimentos expirados",
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-slate-700/70 bg-slate-900/35 px-4 text-center text-xs text-slate-500">
      {label}
    </div>
  );
}

function formatCountdown(value: number) {
  const safeValue = Math.max(0, Math.round(value));
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function activityTone(value: number, maxValue: number) {
  if (value <= 0) return "border-white/[0.025] bg-slate-900/35 text-slate-700";
  const intensity = value / Math.max(maxValue, 1);
  if (intensity <= 0.25) return "border-sky-400/15 bg-sky-500/10 text-sky-300";
  if (intensity <= 0.5) return "border-blue-400/20 bg-blue-500/20 text-blue-200";
  if (intensity <= 0.75) return "border-orange-400/25 bg-orange-500/25 text-orange-200";
  return "border-orange-300/35 bg-orange-500 text-white shadow-[0_0_16px_-5px_rgba(249,115,22,0.85)]";
}

function calendarTone(value: number, maxValue: number) {
  if (value <= 0) return "border-white/[0.035] bg-white/[0.015] text-slate-600";
  const intensity = value / Math.max(maxValue, 1);
  if (intensity <= 0.25) return "border-sky-400/15 bg-sky-500/[0.08] text-sky-300";
  if (intensity <= 0.5) return "border-blue-400/20 bg-blue-500/15 text-blue-200";
  if (intensity <= 0.75) return "border-orange-400/25 bg-orange-500/20 text-orange-200";
  return "border-orange-300/35 bg-gradient-to-br from-orange-500/95 to-orange-600/75 text-white shadow-[0_8px_22px_-12px_rgba(249,115,22,0.9)]";
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "?";
}

function RankedTimeList({
  items,
  tone,
  emptyLabel,
  getName,
  getValue,
  formatDuration,
}: {
  items: Array<ManagementResponseTime | ManagementServiceTime>;
  tone: "blue" | "emerald";
  emptyLabel: string;
  getName: (item: ManagementResponseTime | ManagementServiceTime) => string;
  getValue: (item: ManagementResponseTime | ManagementServiceTime) => number;
  formatDuration: (minutes: number) => string;
}) {
  if (items.length === 0) return <EmptyState label={emptyLabel} />;

  const visibleItems = items.slice(0, 8);
  const max = Math.max(...visibleItems.map(getValue), 1);

  return (
    <div className="flex min-h-full flex-col justify-between gap-1.5 [@media(max-height:820px)]:gap-0.5">
      {visibleItems.map((item, index) => {
        const name = getName(item);
        const value = getValue(item);
        return (
          <div key={`${name}-${index}`} className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 [@media(max-height:820px)]:gap-y-px">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold min-[1700px]:h-6 min-[1700px]:w-6 min-[1700px]:text-[10px] [@media(max-height:820px)]:h-4 [@media(max-height:820px)]:w-4 [@media(max-height:820px)]:text-[8px]",
                  tone === "blue" ? "bg-sky-500/15 text-sky-300" : "bg-emerald-500/15 text-emerald-300",
                )}
              >
                {index + 1}
              </span>
              <span className="truncate text-xs font-semibold text-slate-200 min-[1700px]:text-sm [@media(max-height:820px)]:text-[11px]" title={name}>
                {name}
              </span>
            </div>
            <span
              className={cn(
                "font-mono text-[11px] font-bold tabular-nums min-[1700px]:text-xs [@media(max-height:820px)]:text-[10px]",
                tone === "blue" ? "text-sky-300" : "text-emerald-300",
              )}
            >
              {formatDuration(value)}
            </span>
            <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-800 min-[1700px]:h-2 [@media(max-height:820px)]:h-1">
              <div
                className={cn(
                  "h-full rounded-full",
                  tone === "blue"
                    ? "bg-gradient-to-r from-blue-600 to-sky-400"
                    : "bg-gradient-to-r from-emerald-600 to-teal-400",
                )}
                style={{ width: `${Math.max((value / max) * 100, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
      {items.length > visibleItems.length && (
        <span className="sr-only">Mais {items.length - visibleItems.length} operadores no período</span>
      )}
    </div>
  );
}

export function ManagementDashboard({
  rankingPesquisas,
  openTicketsCount,
  chamadosAtivos,
  tempoAbertura,
  tempoSolucao,
  atividade,
  calendario,
  kpis,
  tempoResposta,
  tempoAtendimento,
  isRefreshing,
  nextRefreshSeconds,
  lastUpdatedLabel,
  onRefresh,
  isOnline,
  getAvatarSrc,
  formatDuration,
}: ManagementDashboardProps) {
  const attendingCount = chamadosAtivos.filter(
    (ticket) => String(ticket?.status ?? "").toLocaleLowerCase("pt-BR") === "atendendo",
  ).length;
  const pausedCount = chamadosAtivos.filter(
    (ticket) => String(ticket?.status ?? "").toLocaleLowerCase("pt-BR") === "pausado",
  ).length;
  const activityItems = atividade.slice(0, 8);
  const maxActivityTotal = Math.max(...activityItems.map((item) => item.total), 1);
  const maxDailyActivity = Math.max(
    ...activityItems.flatMap((item) => item.dias.slice(0, WEEK_DAYS.length)),
    1,
  );
  const calendarCells = calendario.semanas.flat();
  const hasCalendarDays = calendarCells.some((cell) => cell.dia !== null);
  const calendarTotal = calendarCells.reduce((total, cell) => total + cell.quantidade, 0);
  const calendarPeak = calendarCells.reduce<ManagementCalendarCell | null>((peak, cell) => {
    if (cell.dia === null || cell.quantidade <= 0) return peak;
    return !peak || cell.quantidade > peak.quantidade ? cell : peak;
  }, null);
  const maxCalendarActivity = Math.max(calendarPeak?.quantidade ?? 0, 1);

  const topPanels: [ReactNode, ReactNode] = [
    (
      <section
        className={cn(panelClass, "h-full border-amber-500/20 p-3 [@media(max-height:820px)]:p-2")}
        aria-labelledby="management-ranking-title"
      >
        <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] sm:flex-row sm:items-center [@media(max-height:820px)]:gap-2">
          <div className="flex shrink-0 items-center gap-2.5 border-b border-amber-500/15 pb-2.5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 [@media(max-height:820px)]:gap-2 [@media(max-height:820px)]:pr-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/12 ring-1 ring-amber-400/20 [@media(max-height:820px)]:h-8 [@media(max-height:820px)]:w-8 [@media(max-height:820px)]:rounded-lg">
              <Trophy className="h-4.5 w-4.5 text-amber-300" aria-hidden="true" />
            </span>
            <div>
              <h2 id="management-ranking-title" className="text-xs font-black uppercase tracking-[0.12em] text-amber-300 [@media(max-height:820px)]:text-[11px]">
                Top avaliados
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500 [@media(max-height:820px)]:text-[9px]">Pesquisa de satisfação</p>
            </div>
          </div>

          {rankingPesquisas.length === 0 ? (
            <div className="min-w-0 flex-1">
              <EmptyState label="Nenhuma avaliação registrada no período." />
            </div>
          ) : (
            <ol className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3 [@media(max-height:820px)]:gap-1.5" aria-label="Ranking de avaliações">
              {rankingPesquisas.slice(0, 3).map((item, index) => (
                <li
                  key={`${item.operador}-${index}`}
                  className={cn(
                    "flex min-w-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 [@media(max-height:820px)]:gap-2 [@media(max-height:820px)]:rounded-lg [@media(max-height:820px)]:px-2 [@media(max-height:820px)]:py-1.5",
                    index === 0
                      ? "border-amber-400/25 bg-amber-400/[0.08]"
                      : "border-white/[0.045] bg-white/[0.025]",
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "h-10 w-10 border-2 border-slate-700 ring-2 ring-offset-1 ring-offset-slate-950 [@media(max-height:820px)]:h-8 [@media(max-height:820px)]:w-8",
                        index === 0 && "border-amber-300/70 ring-amber-400/25",
                        index === 1 && "ring-slate-400/20",
                        index === 2 && "ring-orange-600/20",
                      )}
                    >
                      <AvatarImage src={getAvatarSrc(item.operador) ?? undefined} alt={`Foto de ${item.operador}`} />
                      <AvatarFallback className="bg-slate-800 text-[10px] font-black text-slate-200">
                        {item.operador.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] font-black shadow-lg",
                        index === 0 && "bg-amber-400 text-amber-950",
                        index === 1 && "bg-slate-300 text-slate-950",
                        index === 2 && "bg-orange-700 text-orange-50",
                      )}
                    >
                      {index + 1}º
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("truncate text-xs font-bold text-slate-200", index === 0 && "text-amber-200")} title={item.operador}>
                      {item.operador}
                    </p>
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className={cn("text-lg font-black tabular-nums text-slate-100 [@media(max-height:820px)]:text-base", index === 0 && "text-amber-300")}>
                        {item.quantidade}
                      </span>
                      <span className="text-[9px] text-slate-500">avaliações</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    ),
    (

      <section
        className={cn(panelClass, "h-full border-emerald-500/20 p-3 [@media(max-height:820px)]:p-2")}
        aria-labelledby="management-active-title"
      >
        <div className="flex h-full min-h-0 items-center justify-between gap-4 overflow-y-auto [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin]">
          <div>
            <h2 id="management-active-title" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300 [@media(max-height:820px)]:text-[10px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.08)]" aria-hidden="true" />
              Chamados ativos
            </h2>
            <strong className="mt-1 block text-4xl font-black leading-none tracking-tight text-white tabular-nums [@media(max-height:820px)]:text-3xl">
              {openTicketsCount.toLocaleString("pt-BR")}
            </strong>
          </div>
          <dl className="grid min-w-32 gap-2 text-xs [@media(max-height:820px)]:gap-1.5 [@media(max-height:820px)]:text-[11px]">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-400/10 bg-emerald-400/10 px-3 py-1.5 [@media(max-height:820px)]:py-1">
              <dt className="text-emerald-200/65">Atendendo</dt>
              <dd className="font-black text-emerald-300 tabular-nums">{attendingCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-400/10 bg-amber-400/10 px-3 py-1.5 [@media(max-height:820px)]:py-1">
              <dt className="text-amber-200/65">Pausados</dt>
              <dd className="font-black text-amber-300 tabular-nums">{pausedCount}</dd>
            </div>
          </dl>
        </div>
      </section>
    ),
  ];

  const metaPanels: [ReactNode, ReactNode] = [
    (
      <section
        className={cn(
          panelClass,
          "group relative flex h-full min-h-[88px] items-center overflow-auto border-sky-500/20 bg-sky-500/[0.035] p-3 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] xl:min-h-0 [@media(max-height:820px)]:p-2",
        )}
        aria-label={`Tempo médio de resposta ${tempoAbertura}; meta 00:05:00`}
      >
        <div className="flex w-full min-w-0 items-center justify-center gap-3 [@media(max-height:820px)]:gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sky-400/15 bg-sky-400/10 text-sky-300 [@media(max-height:820px)]:h-7 [@media(max-height:820px)]:w-7" aria-hidden="true">
            <Timer className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-center">
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-sky-400">Meta de resposta · 00:05:00</p>
            <p className="mt-1 font-mono text-xl font-black leading-none text-sky-200 tabular-nums [@media(max-height:820px)]:mt-0.5 [@media(max-height:820px)]:text-lg">{tempoAbertura}</p>
          </div>
        </div>
      </section>
    ),
    (
      <section
        className={cn(
          panelClass,
          "group relative flex h-full min-h-[88px] items-center overflow-auto border-emerald-500/20 bg-emerald-500/[0.035] p-3 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] xl:min-h-0 [@media(max-height:820px)]:p-2",
        )}
        aria-label={`Tempo médio de solução ${tempoSolucao}; meta 04:00:00`}
      >
        <div className="flex w-full min-w-0 items-center justify-center gap-3 [@media(max-height:820px)]:gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-400/15 bg-emerald-400/10 text-emerald-300 [@media(max-height:820px)]:h-7 [@media(max-height:820px)]:w-7" aria-hidden="true">
            <Clock3 className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-center">
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">Meta de solução · 04:00:00</p>
            <p className="mt-1 font-mono text-xl font-black leading-none text-emerald-200 tabular-nums [@media(max-height:820px)]:mt-0.5 [@media(max-height:820px)]:text-lg">{tempoSolucao}</p>
          </div>
        </div>
      </section>
    ),
  ];

  const operationPanels: [ReactNode, ReactNode] = [
    (
      <section
        className={cn(
          panelClass,
          "flex h-full min-h-0 flex-col border-orange-400/10 p-2.5 [@media(max-height:820px)]:p-1.5",
        )}
        aria-labelledby="management-activity-title"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-orange-400/15 bg-orange-400/[0.08] text-orange-300 [@media(max-height:820px)]:h-6 [@media(max-height:820px)]:w-6 [@media(max-height:820px)]:rounded-lg">
              <Activity className="h-4 w-4 [@media(max-height:820px)]:h-3 [@media(max-height:820px)]:w-3" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="management-activity-title" className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-300 [@media(max-height:820px)]:text-[9px]">
                Atividade por dia da semana
              </h2>
              <p className="mt-0.5 truncate text-[9px] text-slate-600 [@media(max-height:820px)]:hidden">
                Ritmo operacional e distribuição da equipe
              </p>
            </div>
          </div>

          <dl className="flex shrink-0 items-center">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.045] bg-white/[0.025] px-2 py-1 [@media(max-height:820px)]:px-1.5 [@media(max-height:820px)]:py-0.5">
              <UsersRound className="h-3 w-3 text-sky-400" aria-hidden="true" />
              <dt className="sr-only">Operadores exibidos</dt>
              <dd className="text-[9px] font-semibold text-slate-400 [@media(max-height:820px)]:text-[8px]">
                <strong className="mr-1 text-slate-100 tabular-nums">{activityItems.length}</strong>
                operadores
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-2 min-h-0 flex-1 overflow-auto rounded-xl border border-white/[0.045] bg-slate-950/45 [scrollbar-color:rgba(71,85,105,0.5)_transparent] [scrollbar-width:thin] [@media(max-height:820px)]:mt-1 [@media(max-height:820px)]:rounded-lg">
          <table className="w-full min-w-[650px] table-fixed border-separate border-spacing-0 text-[10px] leading-none [@media(max-height:820px)]:text-[9px]" aria-label="Atividade semanal por operador">
            <caption className="sr-only">
              Atividade de até oito operadores, distribuída pelos sete dias da semana, com total individual.
            </caption>
            <thead className="sticky top-0 z-30 bg-slate-900/95 text-slate-500 shadow-[0_1px_0_rgba(51,65,85,0.65)] backdrop-blur-xl">
              <tr>
                <th scope="col" className="sticky left-0 z-40 w-[27%] bg-slate-900/95 px-2.5 py-1.5 text-left text-[9px] font-bold uppercase tracking-[0.1em] min-[1700px]:py-2 [@media(max-height:820px)]:px-2 [@media(max-height:820px)]:py-1">
                  Operador
                </th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} scope="col" className="w-[8%] px-0.5 py-1.5 text-center text-[9px] font-bold min-[1700px]:py-2 [@media(max-height:820px)]:py-1 [@media(max-height:820px)]:text-[8px]">
                    {day}
                  </th>
                ))}
                <th scope="col" className="w-[17%] px-2 py-1.5 text-right text-[9px] font-bold uppercase tracking-[0.08em] min-[1700px]:py-2 [@media(max-height:820px)]:py-1 [@media(max-height:820px)]:text-[8px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {activityItems.map((item, index) => (
                <tr key={`${item.operador}-${index}`} className="group transition-colors hover:bg-white/[0.025]">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-slate-800/55 bg-slate-950/95 px-2.5 py-0.5 text-left group-last:border-b-0 group-hover:bg-slate-900/95 min-[1700px]:py-1 [@media(max-height:820px)]:px-2 [@media(max-height:820px)]:py-px"
                  >
                    <div className="flex min-w-0 items-center gap-2 [@media(max-height:820px)]:gap-1.5">
                      <Avatar className="h-5 w-5 shrink-0 border border-slate-600/70 ring-1 ring-white/[0.04] min-[1700px]:h-6 min-[1700px]:w-6 [@media(max-height:820px)]:h-5 [@media(max-height:820px)]:w-5">
                        <AvatarImage src={getAvatarSrc(item.operador) ?? undefined} alt={`Foto de ${item.operador}`} />
                        <AvatarFallback className="bg-slate-800 text-[7px] font-black text-slate-300">
                          {getInitials(item.operador)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-[10px] font-bold text-slate-200 [@media(max-height:820px)]:text-[9px]" title={item.operador}>
                          {item.operador}
                        </span>
                      </span>
                    </div>
                  </th>
                  {WEEK_DAYS.map((day, dayIndex) => {
                    const value = item.dias[dayIndex] ?? 0;
                    return (
                      <td key={day} className="border-b border-slate-800/55 px-0.5 py-0.5 text-center group-last:border-b-0 min-[1700px]:py-1 [@media(max-height:820px)]:py-px">
                        <span
                          className={cn(
                            "mx-auto inline-flex h-5 min-w-7 items-center justify-center rounded-lg border px-1 text-[9px] font-black tabular-nums transition-transform group-hover:scale-[1.03] min-[1700px]:h-6 [@media(max-height:820px)]:h-4 [@media(max-height:820px)]:min-w-5 [@media(max-height:820px)]:rounded-md [@media(max-height:820px)]:text-[8px]",
                            activityTone(value, maxDailyActivity),
                          )}
                          title={`${day}, ${item.operador}: ${value} chamado${value === 1 ? "" : "s"}`}
                          aria-label={`${day}: ${value} chamado${value === 1 ? "" : "s"}`}
                        >
                          {value > 0 ? value : "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border-b border-slate-800/55 px-2 py-0.5 group-last:border-b-0 min-[1700px]:py-1 [@media(max-height:820px)]:py-px">
                    <div className="ml-auto w-full max-w-[94px]">
                      <div className="flex items-baseline justify-end gap-1">
                        <strong className="text-[11px] font-black text-slate-100 tabular-nums [@media(max-height:820px)]:text-[9px]">
                          {item.total.toLocaleString("pt-BR")}
                        </strong>
                        <span className="text-[7px] uppercase tracking-wide text-slate-600 [@media(max-height:820px)]:hidden">sol.</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800 [@media(max-height:820px)]:mt-0.5 [@media(max-height:820px)]:h-0.5" aria-hidden="true">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-orange-400"
                          style={{ width: `${Math.max((item.total / maxActivityTotal) * 100, item.total > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {activityItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-slate-500">Sem atividade no período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {atividade.length > activityItems.length && (
          <p className="sr-only">Exibindo os oito primeiros de {atividade.length} operadores.</p>
        )}
      </section>
    ),
    (
      <section
        className={cn(
          panelClass,
          "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] border-sky-400/10 p-2.5 [@media(max-height:820px)]:p-1.5",
        )}
        aria-labelledby="management-calendar-title"
      >
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-sky-400/15 bg-sky-400/[0.08] text-sky-300 [@media(max-height:820px)]:h-6 [@media(max-height:820px)]:w-6 [@media(max-height:820px)]:rounded-lg">
              <CalendarDays className="h-4 w-4 [@media(max-height:820px)]:h-3 [@media(max-height:820px)]:w-3" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="management-calendar-title" className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-300 [@media(max-height:820px)]:text-[9px]">
                Chamados por dia
              </h2>
              <p className="mt-0.5 truncate text-[9px] text-slate-600 [@media(max-height:820px)]:text-[8px]">
                <span className="capitalize">{calendario.mes || "Período atual"}</span> <span aria-hidden="true">·</span> data da solução
              </p>
            </div>
          </div>

          <dl className="flex shrink-0 items-center gap-1 [@media(max-height:820px)]:gap-0.5">
            <div className="rounded-lg border border-white/[0.045] bg-white/[0.025] px-2 py-1 text-right [@media(max-height:820px)]:px-1.5 [@media(max-height:820px)]:py-0.5">
              <dt className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-600">Total</dt>
              <dd className="text-[11px] font-black leading-none text-sky-200 tabular-nums [@media(max-height:820px)]:text-[9px]">{calendarTotal.toLocaleString("pt-BR")}</dd>
            </div>
            <div className="rounded-lg border border-orange-400/10 bg-orange-400/[0.055] px-2 py-1 text-right [@media(max-height:820px)]:px-1.5 [@media(max-height:820px)]:py-0.5">
              <dt className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-600">Pico</dt>
              <dd className="flex items-baseline justify-end gap-1 text-[11px] font-black leading-none text-orange-200 tabular-nums [@media(max-height:820px)]:text-[9px]">
                {calendarPeak?.quantidade ?? 0}
                {calendarPeak?.dia != null && <span className="text-[7px] font-semibold text-slate-600">dia {calendarPeak.dia}</span>}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-2 min-h-0 overflow-y-auto rounded-xl border border-white/[0.045] bg-slate-950/45 p-1 [scrollbar-color:rgba(71,85,105,0.5)_transparent] [scrollbar-width:thin] [@media(max-height:820px)]:mt-1 [@media(max-height:820px)]:rounded-lg [@media(max-height:820px)]:p-0.5">
          {!hasCalendarDays ? (
            <div className="grid h-full min-h-16 place-items-center">
              <EmptyState label="Sem chamados no período." />
            </div>
          ) : (
            <table className="h-full w-full table-fixed border-separate border-spacing-x-0.5 border-spacing-y-0.5 text-[9px] [@media(max-height:820px)]:text-[8px]" aria-label={`Calendário de chamados solucionados em ${calendario.mes || "período atual"}`}>
              <caption className="sr-only">
                Cada célula apresenta o dia do mês e a quantidade de chamados solucionados.
              </caption>
              <thead className="text-slate-600">
                <tr>
                  {CALENDAR_DAYS.map((day) => (
                    <th key={day} scope="col" className="px-0.5 py-0.5 text-center text-[8px] font-bold uppercase tracking-wide [@media(max-height:820px)]:py-0 [@media(max-height:820px)]:text-[7px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendario.semanas.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((cell, dayIndex) => (
                      <td key={`${weekIndex}-${dayIndex}`} className="h-8 p-px text-center [@media(max-height:820px)]:h-6 [@media(max-height:820px)]:p-0">
                        {cell.dia === null ? (
                          <span className="block h-full w-full" aria-hidden="true" />
                        ) : (
                          <div
                            className={cn(
                              "mx-auto flex h-full min-h-8 w-full max-w-[58px] flex-col justify-between rounded-lg border px-1.5 py-1 transition-colors [@media(max-height:820px)]:min-h-5 [@media(max-height:820px)]:flex-row [@media(max-height:820px)]:items-center [@media(max-height:820px)]:rounded-md [@media(max-height:820px)]:px-1 [@media(max-height:820px)]:py-0.5",
                              calendarTone(cell.quantidade, maxCalendarActivity),
                            )}
                            title={`Dia ${cell.dia}: ${cell.quantidade} chamado${cell.quantidade === 1 ? "" : "s"} solucionado${cell.quantidade === 1 ? "" : "s"}`}
                            aria-label={`Dia ${cell.dia}: ${cell.quantidade} chamado${cell.quantidade === 1 ? "" : "s"} solucionado${cell.quantidade === 1 ? "" : "s"}`}
                          >
                            <span className="self-start text-[8px] font-bold leading-none opacity-70 tabular-nums [@media(max-height:820px)]:self-auto [@media(max-height:820px)]:text-[7px]">
                              {cell.dia}
                            </span>
                            <span className="self-end text-[11px] font-black leading-none tabular-nums [@media(max-height:820px)]:self-auto [@media(max-height:820px)]:text-[9px]">
                              {cell.quantidade > 0 ? cell.quantidade : "—"}
                            </span>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="mt-1.5 flex min-w-0 flex-wrap items-center justify-between gap-1.5 border-t border-slate-800/70 px-0.5 pt-1.5 [@media(max-height:820px)]:mt-1 [@media(max-height:820px)]:pt-1">
          <div className="flex min-w-0 items-center gap-1.5 text-[9px] [@media(max-height:820px)]:text-[8px]">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_8px_currentColor]", isOnline ? "bg-emerald-400 text-emerald-400" : "bg-red-400 text-red-400")} aria-hidden="true" />
            <strong className={cn("font-semibold", isOnline ? "text-emerald-300" : "text-red-300")}>{isOnline ? "Online" : "Offline"}</strong>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <span className="truncate text-slate-500">Última: {lastUpdatedLabel || "aguardando"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="font-mono text-[9px] font-bold text-slate-400 tabular-nums [@media(max-height:820px)]:text-[8px]" aria-label={`Próxima atualização em ${nextRefreshSeconds} segundos`}>
              {formatCountdown(nextRefreshSeconds)}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing || !isOnline}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2 text-[9px] font-bold text-slate-300 transition-colors hover:border-sky-400/35 hover:bg-sky-400/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 [@media(max-height:820px)]:h-5 [@media(max-height:820px)]:px-1.5 [@media(max-height:820px)]:text-[8px]"
              aria-label="Atualizar dados agora"
            >
              <RefreshCw className={cn("h-3 w-3 [@media(max-height:820px)]:h-2.5 [@media(max-height:820px)]:w-2.5", isRefreshing && "animate-spin")} aria-hidden="true" />
              Atualizar
            </button>
          </div>
        </footer>
      </section>
    ),
  ];

  const visibleKpis = kpis.slice(0, 5);
  const renderKpiPanel = (index: number): ReactNode => {
    const kpi = visibleKpis[index];
    if (!kpi) {
      return (
        <div
          key={`empty-kpi-${index}`}
          className={cn(
            panelClass,
            "flex h-full min-h-[88px] items-center overflow-auto p-3 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] xl:min-h-0 [@media(max-height:820px)]:p-2",
          )}
        >
          <EmptyState label="Indicador indisponível para o período." />
        </div>
      );
    }

    const displayTitle = MANAGEMENT_KPI_LABELS[kpi.titulo] ?? kpi.titulo;

    return (
            <article
              key={`${kpi.titulo}-${index}`}
              className={cn(
                panelClass,
                "relative flex h-full min-h-[88px] flex-col overflow-auto p-3 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] xl:min-h-0 [@media(max-height:820px)]:p-2",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="line-clamp-2 text-[9px] font-bold uppercase leading-tight tracking-[0.1em] text-slate-500 [@media(max-height:820px)]:text-[8px]" title={kpi.titulo}>{displayTitle}</h2>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.035] bg-white/[0.04] [&>svg]:h-4 [&>svg]:w-4 [@media(max-height:820px)]:h-6 [@media(max-height:820px)]:w-6 [@media(max-height:820px)]:[&>svg]:h-3.5 [@media(max-height:820px)]:[&>svg]:w-3.5" aria-hidden="true">
                  {kpi.icon}
                </span>
              </div>
              <div className="mt-1 flex min-h-0 flex-1 items-center justify-between gap-2">
                <strong className={cn("text-2xl font-black leading-none tracking-tight text-white tabular-nums [@media(max-height:820px)]:text-xl", kpi.valueColor)}>{kpi.valor}</strong>
                {kpi.detalhe && <span className="pb-0.5 text-[10px] font-bold text-slate-500 tabular-nums [@media(max-height:820px)]:text-[9px]">{kpi.detalhe}</span>}
              </div>
              {kpi.detalhe && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800 [@media(max-height:820px)]:mt-1" aria-hidden="true">
                  <div
                    className={cn(
                      "h-full rounded-full opacity-70",
                      kpi.valueColor?.includes("red")
                        ? "bg-rose-500"
                        : kpi.valueColor?.includes("sky")
                          ? "bg-sky-500"
                          : "bg-emerald-500",
                    )}
                    style={{ width: /^\d+(?:\.\d+)?%$/.test(kpi.detalhe) ? kpi.detalhe : "0%" }}
                  />
                </div>
              )}
            </article>
    );
  };
  const kpiPanels: [ReactNode, ReactNode, ReactNode, ReactNode, ReactNode] = [
    renderKpiPanel(0),
    renderKpiPanel(1),
    renderKpiPanel(2),
    renderKpiPanel(3),
    renderKpiPanel(4),
  ];

  const summaryPanels: [
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
  ] = [...kpiPanels, ...metaPanels];

  const responseTimePanel: ReactNode = (
      <section className={cn(panelClass, "flex h-full min-h-[220px] flex-col p-3 xl:min-h-0 [@media(max-height:820px)]:p-2")} aria-labelledby="management-response-title">
        <h2 id="management-response-title" className={panelHeadingClass}>
          <Timer className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          Tempo médio de resposta
        </h2>
        <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto pb-1 pr-1 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] [@media(max-height:820px)]:mt-1.5">
          <RankedTimeList
            items={tempoResposta}
            tone="blue"
            emptyLabel="Sem tempos de resposta no período."
            getName={(item) => item.nome}
            getValue={(item) => "tempoMedioMinutos" in item ? item.tempoMedioMinutos : 0}
            formatDuration={formatDuration}
          />
        </div>
      </section>
  );

  const serviceTimePanel: ReactNode = (
      <section className={cn(panelClass, "flex h-full min-h-[220px] flex-col p-3 xl:min-h-0 [@media(max-height:820px)]:p-2")} aria-labelledby="management-service-title">
        <h2 id="management-service-title" className={panelHeadingClass}>
          <Clock3 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          Tempo médio de atendimento
        </h2>
        <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto pb-1 pr-1 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin] [@media(max-height:820px)]:mt-1.5">
          <RankedTimeList
            items={tempoAtendimento}
            tone="emerald"
            emptyLabel="Sem tempos de atendimento no período."
            getName={(item) => item.nome}
            getValue={(item) => "tempoMedioAtendimentoMinutos" in item ? item.tempoMedioAtendimentoMinutos : 0}
            formatDuration={formatDuration}
          />
        </div>
      </section>
  );

  const analyticsPanels: [ReactNode, ReactNode] = [
    responseTimePanel,
    serviceTimePanel,
  ];

  return (
    <ManagementResizableLayout
      top={topPanels}
      summary={summaryPanels}
      operations={operationPanels}
      analytics={analyticsPanels}
    />
  );
}

export default ManagementDashboard;
