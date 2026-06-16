import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface SystemOption {
  id: string
  name: string
  description: string
  active: boolean
}

export interface CategoryOption {
  id: string
  name: string
  defaultRisk: "Low" | "Medium" | "High"
  active: boolean
}

export interface RiskRule {
  id: string
  category: string
  condition: string
  assignedRisk: "Low" | "Medium" | "High"
}

export interface ApprovalRoute {
  id: string
  riskLevel: "Low" | "Medium" | "High"
  approvers: string[]
  description: string
}

export interface SLAConfig {
  id: string
  riskLevel: "Low" | "Medium" | "High"
  maxHours: number
  escalateTo: string
}

export interface TestChecklistTemplate {
  id: string
  category: string
  items: string[]
}

interface SettingsState {
  systems: SystemOption[]
  categories: CategoryOption[]
  riskRules: RiskRule[]
  approvalRoutes: ApprovalRoute[]
  slaConfigs: SLAConfig[]
  testChecklists: TestChecklistTemplate[]
}

const initialState: SettingsState = {
  systems: [
    { id: "sys-1", name: "NetSuite", description: "Financial and ERP platform", active: true },
    { id: "sys-2", name: "Salesforce", description: "CRM platform", active: true },
    { id: "sys-3", name: "ERP", description: "Enterprise Resource Planning", active: true },
    { id: "sys-4", name: "HRIS", description: "Human Resource Information System", active: true },
    { id: "sys-5", name: "CRM", description: "Customer Relationship Management", active: true },
    { id: "sys-6", name: "SharePoint", description: "Document management and collaboration", active: true },
    { id: "sys-7", name: "Power BI", description: "Business intelligence and reporting", active: true },
    { id: "sys-8", name: "Custom Application", description: "Custom-built internal applications", active: true },
    { id: "sys-9", name: "Other", description: "Other systems not listed", active: true },
  ],
  categories: [
    { id: "cat-1", name: "New Feature", defaultRisk: "Medium", active: true },
    { id: "cat-2", name: "Bug Fix", defaultRisk: "Low", active: true },
    { id: "cat-3", name: "Configuration Change", defaultRisk: "Medium", active: true },
    { id: "cat-4", name: "Integration", defaultRisk: "High", active: true },
    { id: "cat-5", name: "Security Patch", defaultRisk: "High", active: true },
    { id: "cat-6", name: "AI", defaultRisk: "High", active: true },
  ],
  riskRules: [
    { id: "rr-1", category: "Bug Fix", condition: "UI-only changes", assignedRisk: "Low" },
    { id: "rr-2", category: "Bug Fix", condition: "Data-affecting changes", assignedRisk: "Medium" },
    { id: "rr-3", category: "Configuration Change", condition: "Workflow modifications", assignedRisk: "Medium" },
    { id: "rr-4", category: "Integration", condition: "Any integration change", assignedRisk: "High" },
    { id: "rr-5", category: "Security Patch", condition: "Access control changes", assignedRisk: "High" },
    { id: "rr-6", category: "New Feature", condition: "Report or dashboard", assignedRisk: "Low" },
  ],
  approvalRoutes: [
    { id: "ar-1", riskLevel: "Low", approvers: ["Selected by requester"], description: "Single approver — requester selects" },
    { id: "ar-2", riskLevel: "Medium", approvers: ["Department Lead"], description: "Department lead approval" },
    { id: "ar-3", riskLevel: "High", approvers: ["Department Lead", "IT Manager / CAB"], description: "Multi-level: department lead then IT manager" },
  ],
  slaConfigs: [
    { id: "sla-1", riskLevel: "Low", maxHours: 24, escalateTo: "Department Lead" },
    { id: "sla-2", riskLevel: "Medium", maxHours: 48, escalateTo: "IT Manager" },
    { id: "sla-3", riskLevel: "High", maxHours: 48, escalateTo: "CAB Chair" },
  ],
  testChecklists: [
    { id: "tc-1", category: "New Feature", items: ["Verify feature works as described", "Test edge cases", "Check permissions/access", "Verify no regressions", "Review UI/UX consistency"] },
    { id: "tc-2", category: "Bug Fix", items: ["Reproduce original bug", "Verify fix resolves the issue", "Test related functionality", "Verify no regressions"] },
    { id: "tc-3", category: "Configuration Change", items: ["Verify configuration applied correctly", "Test affected workflows", "Validate notification triggers", "Check performance impact"] },
    { id: "tc-4", category: "Integration", items: ["Verify API connectivity in sandbox", "Test data mapping/transformation", "Validate error handling", "Check authentication/authorization", "Performance/load test", "Verify rollback procedure"] },
    { id: "tc-5", category: "Security Patch", items: ["Verify security fix applied", "Test access controls", "Penetration testing (if applicable)", "Verify audit logging", "Check for side effects"] },
    { id: "tc-6", category: "AI", items: ["Verify model accuracy", "Test input validation", "Check bias and fairness", "Validate data privacy compliance", "Performance benchmarking", "Test fallback behavior"] },
  ],
}

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    addSystem: (state, action: PayloadAction<SystemOption>) => {
      state.systems.push(action.payload)
    },
    updateSystem: (state, action: PayloadAction<{ id: string; updates: Partial<SystemOption> }>) => {
      const sys = state.systems.find((s) => s.id === action.payload.id)
      if (sys) Object.assign(sys, action.payload.updates)
    },
    removeSystem: (state, action: PayloadAction<string>) => {
      state.systems = state.systems.filter((s) => s.id !== action.payload)
    },
    addCategory: (state, action: PayloadAction<CategoryOption>) => {
      state.categories.push(action.payload)
    },
    updateCategory: (state, action: PayloadAction<{ id: string; updates: Partial<CategoryOption> }>) => {
      const cat = state.categories.find((c) => c.id === action.payload.id)
      if (cat) Object.assign(cat, action.payload.updates)
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload)
    },
    addRiskRule: (state, action: PayloadAction<RiskRule>) => {
      state.riskRules.push(action.payload)
    },
    updateRiskRule: (state, action: PayloadAction<{ id: string; updates: Partial<RiskRule> }>) => {
      const rule = state.riskRules.find((r) => r.id === action.payload.id)
      if (rule) Object.assign(rule, action.payload.updates)
    },
    removeRiskRule: (state, action: PayloadAction<string>) => {
      state.riskRules = state.riskRules.filter((r) => r.id !== action.payload)
    },
    updateApprovalRoute: (state, action: PayloadAction<{ id: string; updates: Partial<ApprovalRoute> }>) => {
      const route = state.approvalRoutes.find((r) => r.id === action.payload.id)
      if (route) Object.assign(route, action.payload.updates)
    },
    updateSLAConfig: (state, action: PayloadAction<{ id: string; updates: Partial<SLAConfig> }>) => {
      const config = state.slaConfigs.find((c) => c.id === action.payload.id)
      if (config) Object.assign(config, action.payload.updates)
    },
    updateTestChecklist: (state, action: PayloadAction<{ id: string; items: string[] }>) => {
      const checklist = state.testChecklists.find((c) => c.id === action.payload.id)
      if (checklist) checklist.items = action.payload.items
    },
  },
})

export const {
  addSystem,
  updateSystem,
  removeSystem,
  addCategory,
  updateCategory,
  removeCategory,
  addRiskRule,
  updateRiskRule,
  removeRiskRule,
  updateApprovalRoute,
  updateSLAConfig,
  updateTestChecklist,
} = settingsSlice.actions
export default settingsSlice.reducer
