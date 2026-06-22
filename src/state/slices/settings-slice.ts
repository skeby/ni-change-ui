import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SystemOption {
  id: string;
  name: string;
  description: string;
  active: boolean;
  // External URL for seeded defaults, or a base64 data URL captured from the
  // upload control in Settings → Systems.
  logo?: string;
}

// Default-system logos are sourced from Google's public favicon service —
// works for any real-world domain without needing a brand-icon library or
// per-company licensing.
const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

// Each category belongs to one of four behavioral "kinds" that drive the
// request form flow. Admins can add multiple granular categories per kind
// (e.g. a "DNS / Subdomain Request" under update_existing).
export type ChangeCategoryKind =
  | "ai_license"
  | "ai_build"
  | "update_existing"
  | "new_system";

export const CATEGORY_KIND_LABELS: Record<ChangeCategoryKind, string> = {
  ai_license: "AI License Request",
  ai_build: "Build with AI",
  update_existing: "Existing Application Change",
  new_system: "New Software / System",
};

export interface CategoryOption {
  id: string;
  name: string;
  kind: ChangeCategoryKind;
  active: boolean;
}

export type ApprovalStageType = "generic" | "role_based";

export interface ApprovalStage {
  id: string;
  type: ApprovalStageType;
  role?: string; // required when type === "role_based"
}

export interface RiskLevelConfig {
  id: string;
  name: string;
  severity: number; // ordinal rank; lower = less risky. Drives sort order and tag color (derived relative to other levels).
  maxEscalationHours: number;
  escalateTo: string;
}

// Approval routing is resolved from a matrix of rules keyed on
// Category × System × Risk Level. "Any" acts as a wildcard for category/system.
export interface ApprovalRule {
  id: string;
  category: string; // CategoryOption.name, or "Any"
  system: string; // SystemOption.name, or "Any"
  riskLevel: string; // RiskLevelConfig.name (always specific)
  approvalStages: ApprovalStage[];
}

export interface TestChecklistTemplate {
  id: string;
  category: string;
  items: string[];
}

interface SettingsState {
  systems: SystemOption[];
  categories: CategoryOption[];
  riskLevels: RiskLevelConfig[];
  approvalRules: ApprovalRule[];
  testChecklists: TestChecklistTemplate[];
}

const initialState: SettingsState = {
  systems: [
    {
      id: "sys-1",
      name: "NetSuite",
      description: "Financial and ERP platform",
      active: true,
      logo: faviconUrl("netsuite.com"),
    },
    {
      id: "sys-2",
      name: "Salesforce",
      description: "CRM platform",
      active: true,
      logo: faviconUrl("salesforce.com"),
    },
    {
      id: "sys-3",
      name: "ERP",
      description: "Enterprise Resource Planning",
      active: true,
      logo: "/favicon-192x192.png",
    },
    {
      id: "sys-4",
      name: "HRIS",
      description: "Human Resource Information System",
      active: true,
      logo: "/favicon-192x192.png",
    },
    // {
    //   id: "sys-5",
    //   name: "CRM",
    //   description: "Customer Relationship Management",
    //   active: true,
    //   logo: "/favicon-192x192.png",
    // },
    {
      id: "sys-6",
      name: "SharePoint",
      description: "Document management and collaboration",
      active: true,
      logo: faviconUrl("sharepoint.com"),
    },
    {
      id: "sys-7",
      name: "Power BI",
      description: "Business intelligence and reporting",
      active: true,
      logo: faviconUrl("powerbi.microsoft.com"),
    },
    {
      id: "sys-10",
      name: "Agiloft",
      description: "Contract lifecycle management (CLM) platform",
      active: true,
      logo: faviconUrl("agiloft.com"),
    },
    {
      id: "sys-11",
      name: "Travel Portal",
      description: "Employee travel request and booking portal",
      active: true,
      logo: "/favicon-192x192.png",
    },
    {
      id: "sys-12",
      name: "Card Reconciliation",
      description: "Corporate card transaction reconciliation system",
      active: true,
      logo: "/favicon-192x192.png",
    },
    {
      id: "sys-13",
      name: "Microsoft Dynamics 365",
      description: "ERP and CRM business applications suite",
      active: true,
      logo: faviconUrl("dynamics.microsoft.com"),
    },
    {
      id: "sys-14",
      name: "NICOR Forms",
      description: "Internal forms and intake workflow platform",
      active: true,
    },
    {
      id: "sys-15",
      name: "DocuSign",
      description: "Electronic signature and document execution platform",
      active: true,
      logo: faviconUrl("docusign.com"),
    },
    {
      id: "sys-8",
      name: "Custom Application",
      description: "Custom-built internal applications",
      active: true,
      logo: "/favicon-192x192.png",
    },
    {
      id: "sys-9",
      name: "Other",
      description: "Other systems not listed",
      active: true,
      logo: "/favicon-192x192.png",
    },
  ],
  categories: [
    {
      id: "cat-1",
      name: "Request for AI License",
      kind: "ai_license",
      active: true,
    },
    {
      id: "cat-2",
      name: "Need AI to Build Something",
      kind: "ai_build",
      active: true,
    },
    {
      id: "cat-3",
      name: "Update Existing System",
      kind: "update_existing",
      active: true,
    },
    {
      id: "cat-4",
      name: "Build New Software/System",
      kind: "new_system",
      active: true,
    },
  ],
  riskLevels: [
    {
      id: "risk-low",
      name: "Low",
      severity: 1,
      maxEscalationHours: 24,
      escalateTo: "marcus.v@company.com",
    },
    {
      id: "risk-medium",
      name: "Medium",
      severity: 2,
      maxEscalationHours: 48,
      escalateTo: "adeyinka@company.com",
    },
    {
      id: "risk-high",
      name: "High",
      severity: 3,
      maxEscalationHours: 48,
      escalateTo: "adeyinka@company.com",
    },
  ],
  // Default routing matrix. "Any" category/system rules provide a baseline
  // per risk level; admins add more specific rules via Settings → Approval Rules.
  approvalRules: [
    {
      id: "ar-low",
      category: "Any",
      system: "Any",
      riskLevel: "Low",
      approvalStages: [{ id: "stg-low-1", type: "generic" }],
    },
    {
      id: "ar-medium",
      category: "Any",
      system: "Any",
      riskLevel: "Medium",
      approvalStages: [
        { id: "stg-med-1", type: "role_based", role: "Department Lead" },
      ],
    },
    {
      id: "ar-high",
      category: "Any",
      system: "Any",
      riskLevel: "High",
      approvalStages: [
        { id: "stg-high-1", type: "role_based", role: "Department Lead" },
        { id: "stg-high-2", type: "role_based", role: "IT Manager" },
        { id: "stg-high-3", type: "role_based", role: "CAB" },
      ],
    },
    {
      id: "ar-ai-high",
      category: "Need AI to Build Something",
      system: "Any",
      riskLevel: "High",
      approvalStages: [
        { id: "stg-aih-1", type: "role_based", role: "Department Lead" },
        { id: "stg-aih-2", type: "role_based", role: "Security Officer" },
        { id: "stg-aih-3", type: "role_based", role: "CAB" },
      ],
    },
  ],
  testChecklists: [
    {
      id: "tc-1",
      category: "Request for AI License",
      items: [
        "Verify license terms reviewed and accepted",
        "Confirm vendor security/compliance documentation",
        "Validate data handling meets policy",
        "Check user access provisioning",
      ],
    },
    {
      id: "tc-2",
      category: "Need AI to Build Something",
      items: [
        "Verify model accuracy",
        "Test input validation",
        "Check bias and fairness",
        "Validate data privacy compliance",
        "Performance benchmarking",
        "Test fallback behavior",
      ],
    },
    {
      id: "tc-3",
      category: "Update Existing System",
      items: [
        "Verify change applied correctly",
        "Test affected workflows",
        "Validate notification triggers",
        "Check performance impact",
        "Verify no regressions",
        "Verify rollback procedure",
      ],
    },
    {
      id: "tc-4",
      category: "Build New Software/System",
      items: [
        "Verify feature works as described",
        "Test edge cases",
        "Check permissions/access",
        "Validate integrations",
        "Review UI/UX consistency",
        "Performance/load test",
      ],
    },
  ],
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    addSystem: (state, action: PayloadAction<SystemOption>) => {
      state.systems.push(action.payload);
    },
    updateSystem: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<SystemOption> }>,
    ) => {
      const sys = state.systems.find((s) => s.id === action.payload.id);
      if (sys) Object.assign(sys, action.payload.updates);
    },
    removeSystem: (state, action: PayloadAction<string>) => {
      state.systems = state.systems.filter((s) => s.id !== action.payload);
    },
    addCategory: (state, action: PayloadAction<CategoryOption>) => {
      state.categories.push(action.payload);
    },
    updateCategory: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<CategoryOption> }>,
    ) => {
      const cat = state.categories.find((c) => c.id === action.payload.id);
      if (cat) Object.assign(cat, action.payload.updates);
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (c) => c.id !== action.payload,
      );
    },
    addRiskLevel: (state, action: PayloadAction<RiskLevelConfig>) => {
      state.riskLevels.push(action.payload);
    },
    updateRiskLevel: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<RiskLevelConfig> }>,
    ) => {
      const level = state.riskLevels.find((r) => r.id === action.payload.id);
      if (level) Object.assign(level, action.payload.updates);
    },
    removeRiskLevel: (state, action: PayloadAction<string>) => {
      state.riskLevels = state.riskLevels.filter(
        (r) => r.id !== action.payload,
      );
    },
    addApprovalRule: (state, action: PayloadAction<ApprovalRule>) => {
      state.approvalRules.push(action.payload);
    },
    updateApprovalRule: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ApprovalRule> }>,
    ) => {
      const rule = state.approvalRules.find((r) => r.id === action.payload.id);
      if (rule) Object.assign(rule, action.payload.updates);
    },
    removeApprovalRule: (state, action: PayloadAction<string>) => {
      state.approvalRules = state.approvalRules.filter(
        (r) => r.id !== action.payload,
      );
    },
    updateTestChecklist: (
      state,
      action: PayloadAction<{ id: string; items: string[] }>,
    ) => {
      const checklist = state.testChecklists.find(
        (c) => c.id === action.payload.id,
      );
      if (checklist) checklist.items = action.payload.items;
    },
  },
});

export const {
  addSystem,
  updateSystem,
  removeSystem,
  addCategory,
  updateCategory,
  removeCategory,
  addRiskLevel,
  updateRiskLevel,
  removeRiskLevel,
  addApprovalRule,
  updateApprovalRule,
  removeApprovalRule,
  updateTestChecklist,
} = settingsSlice.actions;
export default settingsSlice.reducer;
