import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { GripHorizontal, GripVertical } from "lucide-react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelGroupHandle,
} from "react-resizable-panels";

import {
  MANAGEMENT_LAYOUT_MINIMUMS,
  useManagementLayout,
  type ManagementLayoutGroup,
} from "@/context/ManagementLayoutContext";
import { cn } from "@/lib/utils";

type Pair = readonly [ReactNode, ReactNode];
type Septet = readonly [
  ReactNode,
  ReactNode,
  ReactNode,
  ReactNode,
  ReactNode,
  ReactNode,
  ReactNode,
];

export interface ManagementResizableLayoutProps {
  top: Pair;
  summary: Septet;
  operations: Pair;
  analytics: Pair;
  className?: string;
}

type ContentGroup = Extract<
  ManagementLayoutGroup,
  "top" | "summary" | "operations" | "analytics"
>;
type LayoutGroup = "rows" | ContentGroup;

interface RowDefinition {
  group: ContentGroup;
  label: string;
  items: readonly ReactNode[];
  itemLabels: readonly string[];
}

const GROUPS: readonly LayoutGroup[] = [
  "rows",
  "top",
  "summary",
  "operations",
  "analytics",
];

const GROUP_LABELS: Readonly<Record<ContentGroup, string>> = {
  top: "visão geral",
  summary: "resumo executivo",
  operations: "atividade operacional",
  analytics: "tempos operacionais",
};

const VALUE_TOLERANCE = 0.06;

function layoutsMatch(first: readonly number[], second: readonly number[]) {
  return (
    first.length === second.length &&
    first.every(
      (value, index) => Math.abs(value - second[index]) <= VALUE_TOLERANCE,
    )
  );
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function useDesktopWallboard() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(min-width: 1280px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

function PanelPercentage({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-2 top-2 z-40 rounded-md border border-cyan-300/30 bg-slate-950/95 px-2 py-1 font-mono text-[9px] font-bold tabular-nums text-cyan-200 shadow-lg backdrop-blur"
    >
      L {formatPercent(width)}% · A {formatPercent(height)}%
    </span>
  );
}

function ContentPanel({
  children,
  isEditing,
  width,
  height,
}: {
  children: ReactNode;
  isEditing: boolean;
  width: number;
  height: number;
}) {
  return (
    <div
      className={cn(
        "relative h-full min-h-0 min-w-0 overflow-auto rounded-2xl [scrollbar-color:rgba(34,211,238,0.35)_transparent] [scrollbar-width:thin]",
        isEditing &&
          "ring-1 ring-inset ring-cyan-300/30 transition-[box-shadow]",
      )}
    >
      {isEditing && <PanelPercentage width={width} height={height} />}
      <div className="h-full min-h-0 min-w-0 [&>*]:h-full">{children}</div>
    </div>
  );
}

function ResizeHandle({
  direction,
  isEditing,
  id,
  label,
}: {
  direction: "horizontal" | "vertical";
  isEditing: boolean;
  id: string;
  label: string;
}) {
  const isHorizontalGroup = direction === "horizontal";

  return (
    <PanelResizeHandle
      id={id}
      disabled={!isEditing}
      tabIndex={isEditing ? 0 : -1}
      aria-label={label}
      hitAreaMargins={{ coarse: 19, fine: 8 }}
      className={cn(
        "group/management-handle relative z-30 flex shrink-0 touch-none select-none items-center justify-center rounded-md outline-none transition-colors",
        isHorizontalGroup
          ? isEditing
            ? "w-2.5 cursor-col-resize"
            : "w-1.5"
          : isEditing
            ? "h-2.5 cursor-row-resize"
            : "h-1.5",
        isEditing
          ? "bg-cyan-400/[0.07] hover:bg-cyan-400/15 focus-visible:bg-cyan-400/20 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050914] data-[resize-handle-active]:bg-cyan-400/20"
          : "pointer-events-none bg-transparent",
      )}
    >
      {isEditing && (
        <span className="grid h-5 w-5 place-items-center rounded-md border border-cyan-300/30 bg-slate-950 text-cyan-300 shadow-md transition-transform group-hover/management-handle:scale-110">
          {isHorizontalGroup ? (
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <GripHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      )}
    </PanelResizeHandle>
  );
}

function MobileLayout({
  top,
  summary,
  operations,
  analytics,
  className,
}: ManagementResizableLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-h-full min-w-0 grid-cols-1 content-start gap-2.5 pb-4 [scrollbar-color:rgba(71,85,105,0.55)_transparent] [scrollbar-width:thin]",
        className,
      )}
      aria-label="Painel de gestão em tempo real"
    >
      <div className="grid min-w-0 gap-2.5 lg:grid-cols-[2fr_1fr]">
        {top.map((item, index) => (
          <div key={`management-mobile-top-${index}`} className="min-w-0">
            {item}
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-10">
        {summary.map((item, index) => (
          <div
            key={`management-mobile-summary-${index}`}
            className={cn(
              "min-w-0",
              index < 5 ? "lg:col-span-2" : "lg:col-span-5",
            )}
          >
            {item}
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-2.5 lg:grid-cols-[68fr_32fr]">
        {operations.map((item, index) => (
          <div key={`management-mobile-operations-${index}`} className="min-w-0">
            {item}
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
        {analytics.map((item, index) => (
          <div key={`management-mobile-analytics-${index}`} className="min-w-0">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManagementResizableLayout(
  props: ManagementResizableLayoutProps,
) {
  const { activeLayout, isEditing, updateGroup, setLayoutReady } =
    useManagementLayout();
  const isDesktop = useDesktopWallboard();

  const rowsRef = useRef<ImperativePanelGroupHandle>(null);
  const topRef = useRef<ImperativePanelGroupHandle>(null);
  const summaryRef = useRef<ImperativePanelGroupHandle>(null);
  const operationsRef = useRef<ImperativePanelGroupHandle>(null);
  const analyticsRef = useRef<ImperativePanelGroupHandle>(null);

  const groupRefs = useMemo<
    Record<LayoutGroup, RefObject<ImperativePanelGroupHandle>>
  >(
    () => ({
      rows: rowsRef,
      top: topRef,
      summary: summaryRef,
      operations: operationsRef,
      analytics: analyticsRef,
    }),
    [],
  );

  const activeLayoutRef = useRef(activeLayout);
  const isEditingRef = useRef(isEditing);
  activeLayoutRef.current = activeLayout;
  isEditingRef.current = isEditing;

  const rowDefinitions = useMemo<readonly RowDefinition[]>(
    () => [
      {
        group: "top",
        label: GROUP_LABELS.top,
        items: props.top,
        itemLabels: ["Top avaliados", "Chamados ativos"],
      },
      {
        group: "summary",
        label: GROUP_LABELS.summary,
        items: props.summary,
        itemLabels: [
          "Tickets finalizados",
          "Respostas em dia",
          "Atendimentos em dia",
          "Respostas estouradas",
          "Atendimentos expirados",
          "Meta de resposta",
          "Meta de solução",
        ],
      },
      {
        group: "operations",
        label: GROUP_LABELS.operations,
        items: props.operations,
        itemLabels: ["Atividade por dia da semana", "Chamados por dia"],
      },
      {
        group: "analytics",
        label: GROUP_LABELS.analytics,
        items: props.analytics,
        itemLabels: [
          "Tempo médio de resposta",
          "Tempo médio de atendimento",
        ],
      },
    ],
    [props.analytics, props.operations, props.summary, props.top],
  );

  const handleLayout = useCallback(
    (group: LayoutGroup, values: number[]) => {
      if (!isEditingRef.current) return;
      if (layoutsMatch(values, activeLayoutRef.current[group])) return;
      updateGroup(group, values);
    },
    [updateGroup],
  );

  useEffect(() => {
    setLayoutReady(isDesktop);
    return () => setLayoutReady(false);
  }, [isDesktop, setLayoutReady]);

  useLayoutEffect(() => {
    if (!isDesktop) return;

    GROUPS.forEach((group) => {
      const panelGroup = groupRefs[group].current;
      const desiredLayout = activeLayout[group];
      if (!panelGroup || layoutsMatch(panelGroup.getLayout(), desiredLayout)) {
        return;
      }
      panelGroup.setLayout([...desiredLayout]);
    });
  }, [activeLayout, groupRefs, isDesktop]);

  if (!isDesktop) return <MobileLayout {...props} />;

  return (
    <div
      className={cn(
        "h-full min-h-0 min-w-0 overflow-hidden [@media(max-height:719px)]:min-h-[620px]",
        props.className,
      )}
      aria-label="Painel de gestão em tempo real"
    >
      <PanelGroup
        ref={rowsRef}
        id="management-layout-rows"
        direction="vertical"
        keyboardResizeBy={2}
        onLayout={(values) => handleLayout("rows", values)}
        className="h-full min-h-0 min-w-0"
      >
        {rowDefinitions.map((row, rowIndex) => (
          <Fragment key={row.group}>
            <Panel
              id={`management-row-${row.group}`}
              order={rowIndex}
              defaultSize={activeLayout.rows[rowIndex]}
              minSize={MANAGEMENT_LAYOUT_MINIMUMS.rows[rowIndex]}
              collapsible={false}
              className="min-h-0 min-w-0 overflow-hidden"
            >
              {row.items.length === 1 ? (
                <ContentPanel
                  isEditing={isEditing}
                  width={100}
                  height={activeLayout.rows[rowIndex]}
                >
                  {row.items[0]}
                </ContentPanel>
              ) : (
                <PanelGroup
                  ref={groupRefs[row.group]}
                  id={`management-layout-${row.group}`}
                  direction="horizontal"
                  keyboardResizeBy={2}
                  onLayout={(values) => handleLayout(row.group, values)}
                  className="h-full min-h-0 min-w-0"
                >
                  {row.items.map((item, itemIndex) => (
                    <Fragment key={`${row.group}-${itemIndex}`}>
                      <Panel
                        id={`management-${row.group}-panel-${itemIndex}`}
                        order={itemIndex}
                        defaultSize={activeLayout[row.group][itemIndex]}
                        minSize={
                          MANAGEMENT_LAYOUT_MINIMUMS[row.group][itemIndex]
                        }
                        collapsible={false}
                        className="min-h-0 min-w-0 overflow-hidden"
                      >
                        <ContentPanel
                          isEditing={isEditing}
                          width={activeLayout[row.group][itemIndex]}
                          height={activeLayout.rows[rowIndex]}
                        >
                          {item}
                        </ContentPanel>
                      </Panel>

                      {itemIndex < row.items.length - 1 && (
                        <ResizeHandle
                          direction="horizontal"
                          isEditing={isEditing}
                          id={`management-${row.group}-handle-${itemIndex}`}
                          label={`Redimensionar largura entre ${row.itemLabels[itemIndex]} e ${row.itemLabels[itemIndex + 1]}`}
                        />
                      )}
                    </Fragment>
                  ))}
                </PanelGroup>
              )}
            </Panel>

            {rowIndex < rowDefinitions.length - 1 && (
              <ResizeHandle
                direction="vertical"
                isEditing={isEditing}
                id={`management-row-handle-${rowIndex}`}
                label={`Redimensionar altura entre as faixas de ${row.label} e ${rowDefinitions[rowIndex + 1].label}`}
              />
            )}
          </Fragment>
        ))}
      </PanelGroup>
    </div>
  );
}

export default ManagementResizableLayout;
