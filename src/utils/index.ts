import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import chroma from 'chroma-js';
import { colorMap } from '../static';
import {
  CATEGORY_KIND_LABELS,
  CATEGORY_KIND_ORDER,
} from '../state/slices/settings-slice';
import type {
  RiskLevelConfig,
  ApprovalRule,
  ApprovalStage,
  CategoryOption,
} from '../state/slices/settings-slice';

const RISK_COLOR_SCALE = chroma
  .scale(['#10b981', '#f59e0b', '#ef4444'])
  .mode('lab');

export class Utils {
  static cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }

  // Derives a tag color for a risk level from its rank relative to every
  // other configured risk level (green -> amber -> red), so colors stay
  // evenly spread as levels are added, removed, or re-ranked.
  static resolveRiskColor(riskLevels: RiskLevelConfig[], name: string): string {
    const sorted = [...riskLevels].sort((a, b) => a.severity - b.severity);
    const idx = sorted.findIndex((r) => r.name === name);
    if (idx === -1) return colorMap[name.toLowerCase()] || '#6b7280';
    const t = sorted.length <= 1 ? 0 : idx / (sorted.length - 1);
    return RISK_COLOR_SCALE(t).hex();
  }

  // Resolves the approval stage chain for a change from the rule matrix,
  // matching the most specific rule first within the request's risk level:
  //   exact category + exact system
  //   exact category + Any system
  //   Any category + exact system
  //   Any category + Any system
  // Returns [] when no rule matches (callers render an empty-state message).
  static resolveApprovalStages(
    rules: ApprovalRule[],
    category: string,
    system: string,
    riskLevel: string,
  ): ApprovalStage[] {
    const scoped = rules.filter((r) => r.riskLevel === riskLevel);
    const precedence: ((r: ApprovalRule) => boolean)[] = [
      (r) => r.category === category && r.system === system,
      (r) => r.category === category && r.system === "Any",
      (r) => r.category === "Any" && r.system === system,
      (r) => r.category === "Any" && r.system === "Any",
    ];
    for (const matches of precedence) {
      const rule = scoped.find(matches);
      if (rule) return rule.approvalStages;
    }
    return [];
  }

  static formatCompactNumber(num: number): string {
    if (num >= 1e9) {
      const formatted = (num / 1e9).toFixed(2);
      return parseFloat(formatted) + "B";
    }
    if (num >= 1e6) {
      const formatted = (num / 1e6).toFixed(2);
      return parseFloat(formatted) + "M";
    }
    if (num >= 1e3) {
      const formatted = (num / 1e3).toFixed(2);
      return parseFloat(formatted) + "K";
    }
    return num.toString();
  }

  // Resolves the display label for a category's behavioral kind, looked up
  // by category name (CategoryOption.name as stored on a ChangeRequest).
  static resolveCategoryKindLabel(
    categories: CategoryOption[],
    categoryName: string,
  ): string {
    const category = categories.find((c) => c.name === categoryName);
    return category ? CATEGORY_KIND_LABELS[category.kind] : "—";
  }

  // Groups active categories by their behavioral kind for use as antd Select
  // `options` (each group renders as an OptGroup). Kinds with no active
  // categories are omitted.
  static groupCategoriesByKind(categories: CategoryOption[]) {
    return CATEGORY_KIND_ORDER.map((kind) => ({
      label: CATEGORY_KIND_LABELS[kind],
      title: CATEGORY_KIND_LABELS[kind],
      options: categories
        .filter((c) => c.active && c.kind === kind)
        .map((c) => ({ label: c.name, value: c.name })),
    })).filter((g) => g.options.length > 0);
  }

  static generateChangeId(): string {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
    return `CR-${year}-${seq}`;
  }
}
