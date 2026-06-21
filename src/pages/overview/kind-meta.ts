import type { FC, CSSProperties } from "react";
import { KeyRound, Bot, Wrench, Rocket } from "lucide-react";
import type { ChangeCategoryKind } from "../../state/slices/settings-slice";

type IconType = FC<{ className?: string; style?: CSSProperties }>;

export interface KindMeta {
  icon: IconType;
  color: string;
  tagline: string;
}

// Visual identity for each request kind, shared across the Overview pages.
export const KIND_META: Record<ChangeCategoryKind, KindMeta> = {
  ai_license: {
    icon: KeyRound,
    color: "#6366f1",
    tagline: "License an existing AI tool",
  },
  ai_build: {
    icon: Bot,
    color: "#8b5cf6",
    tagline: "Build a new AI solution",
  },
  update_existing: {
    icon: Wrench,
    color: "#2563eb",
    tagline: "Change an existing system",
  },
  new_system: {
    icon: Rocket,
    color: "#10b981",
    tagline: "Request brand-new software",
  },
};
