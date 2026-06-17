import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SystemOption {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  defaultRisk: string; // references a RiskLevelConfig.name
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
  testChecklists: TestChecklistTemplate[];
}

const initialState: SettingsState = {
  systems: [
    {
      id: "sys-1",
      name: "NetSuite",
      description: "Financial and ERP platform",
      active: true,
    },
    {
      id: "sys-2",
      name: "Salesforce",
      description: "CRM platform",
      active: true,
    },
    {
      id: "sys-3",
      name: "ERP",
      description: "Enterprise Resource Planning",
      active: true,
    },
    {
      id: "sys-4",
      name: "HRIS",
      description: "Human Resource Information System",
      active: true,
    },
    {
      id: "sys-5",
      name: "CRM",
      description: "Customer Relationship Management",
      active: true,
    },
    {
      id: "sys-6",
      name: "SharePoint",
      description: "Document management and collaboration",
      active: true,
    },
    {
      id: "sys-7",
      name: "Power BI",
      description: "Business intelligence and reporting",
      active: true,
    },
    {
      id: "sys-8",
      name: "Custom Application",
      description: "Custom-built internal applications",
      active: true,
    },
    {
      id: "sys-9",
      name: "Other",
      description: "Other systems not listed",
      active: true,
    },
  ],
  categories: [
    { id: "cat-1", name: "General Update", defaultRisk: "Low", active: true },
    { id: "cat-2", name: "New Feature", defaultRisk: "Medium", active: true },
    { id: "cat-3", name: "Bug Fix", defaultRisk: "Low", active: true },
    {
      id: "cat-4",
      name: "Configuration Change",
      defaultRisk: "Medium",
      active: true,
    },
    { id: "cat-5", name: "Integration", defaultRisk: "High", active: true },
    { id: "cat-6", name: "Security Patch", defaultRisk: "High", active: true },
    { id: "cat-7", name: "AI", defaultRisk: "High", active: true },
  ],
  riskLevels: [
    {
      id: "risk-low",
      name: "Low",
      severity: 1,
      maxEscalationHours: 24,
      escalateTo: "marcus.v@company.com",
      approvalStages: [{ id: "stg-low-1", type: "generic" }],
    },
    {
      id: "risk-medium",
      name: "Medium",
      severity: 2,
      maxEscalationHours: 48,
      escalateTo: "adeyinka@company.com",
      approvalStages: [
        { id: "stg-med-1", type: "role_based", role: "Department Lead" },
      ],
    },
    {
      id: "risk-high",
      name: "High",
      severity: 3,
      maxEscalationHours: 48,
      escalateTo: "adeyinka@company.com",
      approvalStages: [
        { id: "stg-high-1", type: "role_based", role: "Department Lead" },
        { id: "stg-high-2", type: "role_based", role: "IT Manager" },
        { id: "stg-high-3", type: "role_based", role: "CAB" },
      ],
    },
  ],
  testChecklists: [
    {
      id: "tc-1",
      category: "New Feature",
      items: [
        "Verify feature works as described",
        "Test edge cases",
        "Check permissions/access",
        "Verify no regressions",
        "Review UI/UX consistency",
      ],
    },
    {
      id: "tc-2",
      category: "Bug Fix",
      items: [
        "Reproduce original bug",
        "Verify fix resolves the issue",
        "Test related functionality",
        "Verify no regressions",
      ],
    },
    {
      id: "tc-3",
      category: "Configuration Change",
      items: [
        "Verify configuration applied correctly",
        "Test affected workflows",
        "Validate notification triggers",
        "Check performance impact",
      ],
    },
    {
      id: "tc-4",
      category: "Integration",
      items: [
        "Verify API connectivity in sandbox",
        "Test data mapping/transformation",
        "Validate error handling",
        "Check authentication/authorization",
        "Performance/load test",
        "Verify rollback procedure",
      ],
    },
    {
      id: "tc-5",
      category: "Security Patch",
      items: [
        "Verify security fix applied",
        "Test access controls",
        "Penetration testing (if applicable)",
        "Verify audit logging",
        "Check for side effects",
      ],
    },
    {
      id: "tc-6",
      category: "AI",
      items: [
        "Verify model accuracy",
        "Test input validation",
        "Check bias and fairness",
        "Validate data privacy compliance",
        "Performance benchmarking",
        "Test fallback behavior",
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
  updateTestChecklist,
} = settingsSlice.actions;
export default settingsSlice.reducer;
