import { useMemo } from "react";
import { useAppSelector } from "../../state/store";
import type { ChangeRequest } from "../../state/slices/changes-slice";
import {
  CATEGORY_KIND_LABELS,
  type ChangeCategoryKind,
} from "../../state/slices/settings-slice";

export interface KindData {
  kind: ChangeCategoryKind;
  label: string;
  count: number;
  all: ChangeRequest[];
  recent: ChangeRequest[];
  statusCounts: Record<string, number>;
}

export const KIND_ORDER: ChangeCategoryKind[] = [
  "ai_license",
  "ai_build",
  "update_existing",
  "new_system",
];

/**
 * Aggregates change requests across the whole organization by category kind,
 * for the admin Overview pages (Change Graph + Change Journey). Maps each
 * change's category name → its CategoryOption.kind via the settings registry.
 */
export const useChangesByKind = () => {
  const { changes } = useAppSelector((state) => state.changes);
  const { categories } = useAppSelector((state) => state.settings);

  return useMemo(() => {
    const kindByCategory: Record<string, ChangeCategoryKind> = {};
    categories.forEach((c) => {
      kindByCategory[c.name] = c.kind;
    });

    const orgChanges = changes.filter((c) => !c.id.startsWith("DRAFT"));

    const byKind = {} as Record<ChangeCategoryKind, KindData>;
    KIND_ORDER.forEach((kind) => {
      byKind[kind] = {
        kind,
        label: CATEGORY_KIND_LABELS[kind],
        count: 0,
        all: [],
        recent: [],
        statusCounts: {},
      };
    });

    orgChanges.forEach((change) => {
      const kind = kindByCategory[change.category];
      if (!kind || !byKind[kind]) return;
      const data = byKind[kind];
      data.count += 1;
      data.statusCounts[change.status] =
        (data.statusCounts[change.status] || 0) + 1;
      data.all.push(change);
    });

    // Sort each kind's lists by most recent activity; recent keeps the top 6.
    KIND_ORDER.forEach((kind) => {
      byKind[kind].all.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
      byKind[kind].recent = byKind[kind].all.slice(0, 6);
    });

    const ordered = KIND_ORDER.map((k) => byKind[k]);
    const totalCount = ordered.reduce((sum, k) => sum + k.count, 0);

    return { byKind, ordered, totalCount };
  }, [changes, categories]);
};
