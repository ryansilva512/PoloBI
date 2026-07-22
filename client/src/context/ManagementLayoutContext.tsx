import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type ManagementLayoutGroup =
  | "rows"
  | "top"
  | "summary"
  | "operations"
  | "analytics";

export interface ManagementLayoutV4 {
  readonly version: 4;
  readonly rows: readonly number[];
  readonly top: readonly number[];
  readonly summary: readonly number[];
  readonly operations: readonly number[];
  readonly analytics: readonly number[];
}

interface LegacyManagementLayoutV3 {
  readonly version: 3;
  readonly rows: readonly number[];
  readonly top: readonly number[];
  readonly summary: readonly number[];
  readonly operations: readonly number[];
  readonly analytics: readonly number[];
  readonly ranking: readonly number[];
}

type LegacyManagementLayoutGroupV3 = ManagementLayoutGroup | "ranking";

const STORAGE_KEY = "polo-bi-management-layout:v4";
const LEGACY_V3_STORAGE_KEY = "polo-bi-management-layout:v3";
const TARGET_TOTAL = 100;
const SUM_TOLERANCE = 0.5;
const COMPARISON_TOLERANCE = 0.005;

const LAYOUT_GROUPS: readonly ManagementLayoutGroup[] = [
  "rows",
  "top",
  "summary",
  "operations",
  "analytics",
];

const LEGACY_V3_LAYOUT_GROUPS: readonly LegacyManagementLayoutGroupV3[] = [
  ...LAYOUT_GROUPS,
  "ranking",
];

export const DEFAULT_MANAGEMENT_LAYOUT: ManagementLayoutV4 = Object.freeze({
  version: 4,
  rows: Object.freeze([13, 12, 39, 36]),
  top: Object.freeze([64, 36]),
  summary: Object.freeze([11, 11, 11, 11, 11, 22.5, 22.5]),
  operations: Object.freeze([68, 32]),
  analytics: Object.freeze([50, 50]),
});

export const MANAGEMENT_LAYOUT_MINIMUMS: Readonly<
  Record<ManagementLayoutGroup, readonly number[]>
> = Object.freeze({
  rows: Object.freeze([11, 10, 28, 26]),
  top: Object.freeze([50, 28]),
  summary: Object.freeze([8, 8, 8, 8, 8, 18, 18]),
  operations: Object.freeze([50, 30]),
  analytics: Object.freeze([35, 35]),
});

const LEGACY_V3_LAYOUT_MINIMUMS: Readonly<
  Record<LegacyManagementLayoutGroupV3, readonly number[]>
> = Object.freeze({
  rows: Object.freeze([11, 10, 24, 24, 10]),
  top: Object.freeze([50, 28]),
  summary: Object.freeze([8, 8, 8, 8, 8, 18, 18]),
  operations: Object.freeze([50, 30]),
  analytics: Object.freeze([35, 35]),
  ranking: Object.freeze([100]),
});

interface ManagementLayoutContextValue {
  appliedLayout: ManagementLayoutV4;
  draftLayout: ManagementLayoutV4;
  activeLayout: ManagementLayoutV4;
  isEditing: boolean;
  isLayoutReady: boolean;
  hasChanges: boolean;
  beginEditing: () => void;
  updateGroup: (group: ManagementLayoutGroup, values: number[]) => void;
  resetDraft: () => void;
  applyChanges: () => void;
  cancelEditing: () => void;
  setLayoutReady: Dispatch<SetStateAction<boolean>>;
}

const ManagementLayoutContext = createContext<
  ManagementLayoutContextValue | undefined
>(undefined);

function roundLayoutValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cloneLayout(layout: ManagementLayoutV4): ManagementLayoutV4 {
  return {
    version: 4,
    rows: [...layout.rows],
    top: [...layout.top],
    summary: [...layout.summary],
    operations: [...layout.operations],
    analytics: [...layout.analytics],
  };
}

function normalizeValues(
  candidate: unknown,
  minimums: readonly number[],
): number[] | null {
  if (!Array.isArray(candidate) || candidate.length !== minimums.length) {
    return null;
  }

  const values = candidate.map((value) =>
    typeof value === "number" && Number.isFinite(value)
      ? roundLayoutValue(value)
      : Number.NaN,
  );

  if (
    values.some(
      (value, index) =>
        !Number.isFinite(value) ||
        value < minimums[index] ||
        value > TARGET_TOTAL,
    )
  ) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - TARGET_TOTAL) > SUM_TOLERANCE) return null;

  const adjustment = roundLayoutValue(TARGET_TOTAL - total);
  if (Math.abs(adjustment) > COMPARISON_TOLERANCE) {
    const adjustmentIndex = values.reduce((bestIndex, value, index) => {
      const availableSpace = value - minimums[index];
      const bestAvailableSpace = values[bestIndex] - minimums[bestIndex];
      return availableSpace > bestAvailableSpace ? index : bestIndex;
    }, 0);

    values[adjustmentIndex] = roundLayoutValue(
      values[adjustmentIndex] + adjustment,
    );
  }

  const normalizedTotal = roundLayoutValue(
    values.reduce((sum, value) => sum + value, 0),
  );

  if (
    Math.abs(normalizedTotal - TARGET_TOTAL) > COMPARISON_TOLERANCE ||
    values.some((value, index) => value < minimums[index])
  ) {
    return null;
  }

  return values;
}

function normalizeGroup(
  group: ManagementLayoutGroup,
  candidate: unknown,
): number[] | null {
  return normalizeValues(candidate, MANAGEMENT_LAYOUT_MINIMUMS[group]);
}

function normalizeLayout(candidate: unknown): ManagementLayoutV4 | null {
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const expectedKeys = ["version", ...LAYOUT_GROUPS];
  const actualKeys = Object.keys(record);

  if (
    record.version !== 4 ||
    actualKeys.length !== expectedKeys.length ||
    expectedKeys.some(
      (key) => !Object.prototype.hasOwnProperty.call(record, key),
    )
  ) {
    return null;
  }

  const normalizedGroups = {} as Record<ManagementLayoutGroup, number[]>;
  for (const group of LAYOUT_GROUPS) {
    const normalizedGroup = normalizeGroup(group, record[group]);
    if (!normalizedGroup) return null;
    normalizedGroups[group] = normalizedGroup;
  }

  return {
    version: 4,
    rows: normalizedGroups.rows,
    top: normalizedGroups.top,
    summary: normalizedGroups.summary,
    operations: normalizedGroups.operations,
    analytics: normalizedGroups.analytics,
  };
}

function normalizeLegacyV3Layout(
  candidate: unknown,
): LegacyManagementLayoutV3 | null {
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const expectedKeys = ["version", ...LEGACY_V3_LAYOUT_GROUPS];
  const actualKeys = Object.keys(record);

  if (
    record.version !== 3 ||
    actualKeys.length !== expectedKeys.length ||
    expectedKeys.some(
      (key) => !Object.prototype.hasOwnProperty.call(record, key),
    )
  ) {
    return null;
  }

  const normalizedGroups = {} as Record<
    LegacyManagementLayoutGroupV3,
    number[]
  >;
  for (const group of LEGACY_V3_LAYOUT_GROUPS) {
    const normalizedGroup = normalizeValues(
      record[group],
      LEGACY_V3_LAYOUT_MINIMUMS[group],
    );
    if (!normalizedGroup) return null;
    normalizedGroups[group] = normalizedGroup;
  }

  return {
    version: 3,
    rows: normalizedGroups.rows,
    top: normalizedGroups.top,
    summary: normalizedGroups.summary,
    operations: normalizedGroups.operations,
    analytics: normalizedGroups.analytics,
    ranking: normalizedGroups.ranking,
  };
}

function migrateLegacyV3Layout(candidate: unknown): ManagementLayoutV4 | null {
  const legacyLayout = normalizeLegacyV3Layout(candidate);
  if (!legacyLayout) return null;

  const [topRow, summaryRow, operationsRow, analyticsRow, rankingRow] =
    legacyLayout.rows;
  const migratedRows = normalizeValues(
    [
      topRow,
      summaryRow,
      operationsRow + rankingRow / 2,
      analyticsRow + rankingRow / 2,
    ],
    MANAGEMENT_LAYOUT_MINIMUMS.rows,
  );
  if (!migratedRows) return null;

  return normalizeLayout({
    version: 4,
    rows: migratedRows,
    top: legacyLayout.top,
    summary: legacyLayout.summary,
    operations: legacyLayout.operations,
    analytics: legacyLayout.analytics,
  });
}

function persistLayout(layout: ManagementLayoutV4): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // The in-memory layout remains usable when browser storage is unavailable.
  }
}

function readStoredLayout(): ManagementLayoutV4 {
  if (typeof window === "undefined") {
    return cloneLayout(DEFAULT_MANAGEMENT_LAYOUT);
  }

  const fallback = cloneLayout(DEFAULT_MANAGEMENT_LAYOUT);
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue !== null) {
      const normalizedLayout = normalizeLayout(JSON.parse(storedValue));
      if (normalizedLayout) return normalizedLayout;
      persistLayout(fallback);
      return fallback;
    }

    const legacyV3Value = window.localStorage.getItem(LEGACY_V3_STORAGE_KEY);
    if (legacyV3Value !== null) {
      const migratedLayout = migrateLegacyV3Layout(JSON.parse(legacyV3Value));
      if (migratedLayout) {
        persistLayout(migratedLayout);
        return migratedLayout;
      }
    }
  } catch {
    // Invalid or unavailable storage falls back to the official layout below.
  }

  persistLayout(fallback);
  return fallback;
}

function layoutsAreEqual(
  first: ManagementLayoutV4,
  second: ManagementLayoutV4,
): boolean {
  return LAYOUT_GROUPS.every((group) => {
    const firstValues = first[group];
    const secondValues = second[group];
    return (
      firstValues.length === secondValues.length &&
      firstValues.every(
        (value, index) =>
          Math.abs(value - secondValues[index]) <= COMPARISON_TOLERANCE,
      )
    );
  });
}

export function ManagementLayoutProvider({ children }: { children: ReactNode }) {
  const [appliedLayout, setAppliedLayout] =
    useState<ManagementLayoutV4>(readStoredLayout);
  const [draftLayout, setDraftLayout] = useState<ManagementLayoutV4>(() =>
    cloneLayout(appliedLayout),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isLayoutReady, setLayoutReady] = useState(false);

  const beginEditing = useCallback(() => {
    setDraftLayout(cloneLayout(appliedLayout));
    setIsEditing(true);
  }, [appliedLayout]);

  const updateGroup = useCallback(
    (group: ManagementLayoutGroup, values: number[]) => {
      if (!isEditing) return;
      const normalizedValues = normalizeGroup(group, values);
      if (!normalizedValues) return;
      setDraftLayout((currentLayout) => ({
        ...currentLayout,
        [group]: normalizedValues,
      }));
    },
    [isEditing],
  );

  const resetDraft = useCallback(() => {
    if (!isEditing) return;
    setDraftLayout(cloneLayout(DEFAULT_MANAGEMENT_LAYOUT));
  }, [isEditing]);

  const cancelEditing = useCallback(() => {
    setDraftLayout(cloneLayout(appliedLayout));
    setIsEditing(false);
  }, [appliedLayout]);

  const applyChanges = useCallback(() => {
    if (!isEditing) return;
    const validatedLayout = normalizeLayout(draftLayout);
    if (!validatedLayout) {
      setDraftLayout(cloneLayout(appliedLayout));
      setIsEditing(false);
      return;
    }

    const nextLayout = cloneLayout(validatedLayout);
    setAppliedLayout(nextLayout);
    setDraftLayout(cloneLayout(nextLayout));
    setIsEditing(false);
    if (typeof window !== "undefined") persistLayout(nextLayout);
  }, [appliedLayout, draftLayout, isEditing]);

  useEffect(() => {
    if (!isEditing) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cancelEditing();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cancelEditing, isEditing]);

  useEffect(() => {
    if (isEditing || typeof window === "undefined") return undefined;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== STORAGE_KEY) {
        return;
      }

      let nextLayout = cloneLayout(DEFAULT_MANAGEMENT_LAYOUT);
      if (event.newValue) {
        try {
          nextLayout =
            normalizeLayout(JSON.parse(event.newValue)) ??
            cloneLayout(DEFAULT_MANAGEMENT_LAYOUT);
        } catch {
          nextLayout = cloneLayout(DEFAULT_MANAGEMENT_LAYOUT);
        }
      }
      setAppliedLayout(nextLayout);
      setDraftLayout(cloneLayout(nextLayout));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isEditing]);

  const activeLayout = isEditing ? draftLayout : appliedLayout;
  const hasChanges = useMemo(
    () => !layoutsAreEqual(draftLayout, appliedLayout),
    [appliedLayout, draftLayout],
  );
  const contextValue = useMemo<ManagementLayoutContextValue>(
    () => ({
      appliedLayout,
      draftLayout,
      activeLayout,
      isEditing,
      isLayoutReady,
      hasChanges,
      beginEditing,
      updateGroup,
      resetDraft,
      applyChanges,
      cancelEditing,
      setLayoutReady,
    }),
    [
      activeLayout,
      appliedLayout,
      applyChanges,
      beginEditing,
      cancelEditing,
      draftLayout,
      hasChanges,
      isEditing,
      isLayoutReady,
      resetDraft,
      updateGroup,
    ],
  );

  return (
    <ManagementLayoutContext.Provider value={contextValue}>
      {children}
    </ManagementLayoutContext.Provider>
  );
}

export function useManagementLayout(): ManagementLayoutContextValue {
  const context = useContext(ManagementLayoutContext);
  if (!context) {
    throw new Error(
      "useManagementLayout must be used within ManagementLayoutProvider",
    );
  }
  return context;
}
