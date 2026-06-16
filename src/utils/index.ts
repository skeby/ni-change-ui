import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export class Utils {
  static cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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
