import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import chroma from 'chroma-js';
import { colorMap } from '../static';
import type { RiskLevelConfig } from '../state/slices/settings-slice';

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

  static generateChangeId(): string {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
    return `CR-${year}-${seq}`;
  }
}
