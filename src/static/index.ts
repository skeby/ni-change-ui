export { NI_CHANGE_THEME } from "./theme";

export const FORM = {
  LABEL_PROPS: { className: "text-sm text-secondary-alpha leading-5" },
  CLASS_NAME: "bg-background-light! w-full! rounded-xl! h-12!",
  TEXTAREA_CLASS_NAME: "bg-background-light! w-full! rounded-xl! p-3.5!",
};

// Fixed roles available for role-based approval stages
export const APPROVAL_ROLES = [
  "Department Lead",
  "IT Manager",
  "CAB",
  "CTO / Executive Sponsor",
  "Security Officer",
];

export const colorMap: Record<string, string> = {
  // ── Change lifecycle statuses ──
  draft: "#6b7280", // Gray-500
  submitted: "#3b82f6", // Blue-500
  submit: "#3b82f6",
  "under review": "#f59e0b", // Amber-500
  approved: "#10b981", // Emerald-500
  approve: "#10b981",
  rejected: "#ef4444", // Red-500
  reject: "#ef4444",
  "in testing": "#8b5cf6", // Violet-500
  "testing complete": "#6366f1", // Indigo-500
  "awaiting deployment": "#06b6d4", // Cyan-500
  deployed: "#10b981", // Emerald-500
  "post-deployment review": "#84cc16", // Lime-500
  closed: "#6b7280", // Gray-500
  "rolled back": "#e11d48", // Rose-600

  // ── Risk levels ──
  low: "#10b981", // Emerald-500
  medium: "#f59e0b", // Amber-500
  high: "#ef4444", // Red-500

  // ── Approval actions ──
  info_requested: "#f59e0b",
  "info requested": "#f59e0b",

  // ── Test step results ──
  pass: "#10b981",
  fail: "#ef4444",
  pending: "#6b7280",

  // ── Query / flags ──
  queried: "#f59e0b",
  query: "#f59e0b",
  resolved: "#10b981",
};
