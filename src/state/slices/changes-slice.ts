import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type ChangeStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "In Testing"
  | "Testing Complete"
  | "Awaiting Deployment"
  | "Deployed"
  | "Post-Deployment Review"
  | "Closed"
  | "Rolled Back"

// References a RiskLevelConfig.name in the settings slice — an open,
// admin-managed list rather than a fixed union.
export type RiskLevel = string

export type ChangeCategory =
  | "New Feature"
  | "Bug Fix"
  | "Configuration Change"
  | "Integration"
  | "Security Patch"
  | "AI"

export interface TimelineEvent {
  stage: string
  actorName: string
  actorId: string
  action: string
  timestamp: string
  comment?: string
  handledInHouse?: boolean
  costInvolved?: boolean
  estimatedCost?: number
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  timestamp: string
  parentId?: string
}

export interface TestStep {
  id: string
  description: string
  expectedOutcome: string
  result: "pending" | "pass" | "fail"
  notes: string
  completedBy?: string
  completedAt?: string
}

export interface EvidenceFile {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

export interface RollbackPlan {
  steps: string
  responsiblePerson: string
  estimatedTime: string
  dependencies: string
}

export interface DeploymentRecord {
  deployedBy: string
  deployedAt: string
  notes: string
  verificationStatus: "pending" | "confirmed" | "issues_found"
  signedOffBy?: string
  signedOffAt?: string
}

export interface ApprovalRecord {
  approverId: string
  approverName: string
  action: "approved" | "rejected" | "info_requested"
  timestamp: string
  comment?: string
  handledInHouse?: boolean
  costInvolved?: boolean
  estimatedCost?: number
}

// Resolved approval chain captured at submission time, derived from the
// risk-level config's approval stages.
export interface ResolvedApprovalStage {
  id: string
  type: "generic" | "role_based"
  role?: string // role label for role-based stages
  approverId?: string // chosen by requester for generic stages
}

export interface AIRequestData {
  frequency: string
  ruleEngine: string
  aiMl: string
  human: string
  statisticalModeling: string
  problemComplexity: string
  problemDescription: string
  currentSolution: string
  successMetrics: string
  simplerAlternative: string
  globalUse: string
  requiresStaffData: string
  requiresSensitiveData: string
  externalUsers: string
  internalOnly: string
  bothUsers: string
  duration: string
}

export interface ChangeRequest {
  id: string
  title: string
  description: string
  systemAffected: string
  category: ChangeCategory
  businessJustification: string
  requestedTimeline: string
  submitterId: string
  submitterName: string
  submitterDepartment: string
  status: ChangeStatus
  riskLevel: RiskLevel
  riskOverridden: boolean
  riskOverrideJustification?: string
  autoAssignedRisk: RiskLevel
  selectedApprover?: string // legacy single-approver field (older mock rows)
  approvalPlan?: ResolvedApprovalStage[]
  approvals: ApprovalRecord[]
  aiRequest?: AIRequestData
  rollbackPlan?: RollbackPlan
  testPlan: string
  testSteps: TestStep[]
  evidence: EvidenceFile[]
  deployment?: DeploymentRecord
  timeline: TimelineEvent[]
  comments: Comment[]
  isQueried: boolean
  queryComment?: string
  createdAt: string
  updatedAt: string
  draftStep?: string
}

const generateMockChanges = (): ChangeRequest[] => {
  return [
    {
      id: "CR-2026-0001",
      title: "Update invoice approval workflow in NetSuite",
      description: "Modify the invoice approval workflow to add a secondary approval step for invoices over $10,000. This includes updating the workflow rules and notification templates.",
      systemAffected: "NetSuite",
      category: "Configuration Change",
      businessJustification: "Finance team requires additional oversight for large invoices to comply with updated internal audit requirements.",
      requestedTimeline: "2026-07-01",
      submitterId: "sarah.j@company.com",
      submitterName: "Sarah Jenkins",
      submitterDepartment: "Finance",
      status: "Under Review",
      riskLevel: "Medium",
      riskOverridden: false,
      autoAssignedRisk: "Medium",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Created draft", timestamp: "2026-06-10T09:00:00Z" },
        { stage: "Submitted", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Submitted for review", timestamp: "2026-06-10T10:30:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-10T09:00:00Z",
      updatedAt: "2026-06-10T10:30:00Z",
    },
    {
      id: "CR-2026-0002",
      title: "Salesforce CRM field validation update",
      description: "Add required field validation for the Opportunity close date and update picklist values for the Lead Source field.",
      systemAffected: "Salesforce",
      category: "Bug Fix",
      businessJustification: "Sales team has been entering incomplete data, leading to inaccurate pipeline reports.",
      requestedTimeline: "2026-06-20",
      submitterId: "marcus.v@company.com",
      submitterName: "Marcus Vance",
      submitterDepartment: "Operations",
      status: "Approved",
      riskLevel: "Low",
      riskOverridden: false,
      autoAssignedRisk: "Low",
      selectedApprover: "adeyinka@company.com",
      approvals: [
        { approverId: "adeyinka@company.com", approverName: "Adeyinka Akinsanya", action: "approved", timestamp: "2026-06-12T14:00:00Z", comment: "Looks good, proceed with testing.", handledInHouse: true, costInvolved: false },
      ],
      testPlan: "Verify field validation triggers on Opportunity save. Test picklist values are updated correctly.",
      testSteps: [
        { id: "ts-1", description: "Create new Opportunity without close date", expectedOutcome: "Validation error displayed", result: "pass", notes: "Working as expected", completedBy: "elena.r@company.com", completedAt: "2026-06-13T10:00:00Z" },
        { id: "ts-2", description: "Verify Lead Source picklist values", expectedOutcome: "New values appear in dropdown", result: "pass", notes: "All 12 values present", completedBy: "elena.r@company.com", completedAt: "2026-06-13T10:30:00Z" },
      ],
      evidence: [
        { id: "ev-1", name: "validation-screenshot.png", type: "image/png", size: 245000, uploadedAt: "2026-06-13T10:15:00Z", uploadedBy: "elena.r@company.com" },
      ],
      rollbackPlan: {
        steps: "1. Remove field validation rule from Opportunity object\n2. Revert picklist values to previous version\n3. Clear cache and verify",
        responsiblePerson: "Marcus Vance",
        estimatedTime: "30 minutes",
        dependencies: "None",
      },
      timeline: [
        { stage: "Draft", actorName: "Marcus Vance", actorId: "marcus.v@company.com", action: "Created draft", timestamp: "2026-06-11T08:00:00Z" },
        { stage: "Submitted", actorName: "Marcus Vance", actorId: "marcus.v@company.com", action: "Submitted for review", timestamp: "2026-06-11T09:00:00Z" },
        { stage: "Approved", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Approved", timestamp: "2026-06-12T14:00:00Z" },
        { stage: "In Testing", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Started testing", timestamp: "2026-06-13T09:00:00Z" },
        { stage: "Testing Complete", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "All tests passed", timestamp: "2026-06-13T11:00:00Z" },
      ],
      comments: [
        { id: "c-1", authorId: "adeyinka@company.com", authorName: "Adeyinka Akinsanya", content: "Please make sure the picklist values match the approved list from the sales team.", timestamp: "2026-06-12T13:45:00Z" },
        { id: "c-2", authorId: "marcus.v@company.com", authorName: "Marcus Vance", content: "Confirmed — using the exact list from the Sales Ops email dated June 5.", timestamp: "2026-06-12T13:50:00Z", parentId: "c-1" },
      ],
      isQueried: false,
      createdAt: "2026-06-11T08:00:00Z",
      updatedAt: "2026-06-13T11:00:00Z",
    },
    {
      id: "CR-2026-0003",
      title: "ERP data migration — vendor master records",
      description: "Migrate 2,500 vendor master records from legacy ERP to new NetSuite instance, including bank details and payment terms.",
      systemAffected: "ERP",
      category: "Integration",
      businessJustification: "Legacy ERP is being decommissioned by Q3 2026. Vendor records must be migrated to maintain procurement operations.",
      requestedTimeline: "2026-08-01",
      submitterId: "adeyinka@company.com",
      submitterName: "Adeyinka Akinsanya",
      submitterDepartment: "IT",
      status: "In Testing",
      riskLevel: "High",
      riskOverridden: false,
      autoAssignedRisk: "High",
      approvals: [
        { approverId: "sarah.j@company.com", approverName: "Sarah Jenkins", action: "approved", timestamp: "2026-06-08T11:00:00Z", comment: "Finance confirms vendor data mapping is correct." },
        { approverId: "marcus.v@company.com", approverName: "Marcus Vance", action: "approved", timestamp: "2026-06-09T09:00:00Z", comment: "IT review complete. Proceed to sandbox testing.", handledInHouse: true, costInvolved: true, estimatedCost: 5000 },
      ],
      testPlan: "Validate all 2,500 records migrated correctly. Verify bank details, payment terms, and vendor classifications.",
      testSteps: [
        { id: "ts-3", description: "Run record count comparison", expectedOutcome: "2500 records in target system", result: "pass", notes: "2500/2500 confirmed", completedBy: "adeyinka@company.com", completedAt: "2026-06-14T10:00:00Z" },
        { id: "ts-4", description: "Validate bank details for top 50 vendors", expectedOutcome: "All bank fields match source", result: "pending", notes: "" },
        { id: "ts-5", description: "Test payment term assignment", expectedOutcome: "Payment terms correctly mapped", result: "pending", notes: "" },
      ],
      evidence: [
        { id: "ev-2", name: "record-count-report.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 1200000, uploadedAt: "2026-06-14T10:15:00Z", uploadedBy: "adeyinka@company.com" },
      ],
      rollbackPlan: {
        steps: "1. Run rollback script to delete migrated records\n2. Restore vendor master from backup snapshot\n3. Verify legacy system connectivity restored",
        responsiblePerson: "Adeyinka Akinsanya",
        estimatedTime: "2 hours",
        dependencies: "Database backup from June 7 must be available",
      },
      timeline: [
        { stage: "Draft", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Created draft", timestamp: "2026-06-05T08:00:00Z" },
        { stage: "Submitted", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Submitted for review", timestamp: "2026-06-06T09:00:00Z" },
        { stage: "Approved", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Dept Lead approved", timestamp: "2026-06-08T11:00:00Z" },
        { stage: "Approved", actorName: "Marcus Vance", actorId: "marcus.v@company.com", action: "IT Manager approved", timestamp: "2026-06-09T09:00:00Z" },
        { stage: "In Testing", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Started sandbox testing", timestamp: "2026-06-14T09:00:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-05T08:00:00Z",
      updatedAt: "2026-06-14T10:15:00Z",
    },
    {
      id: "CR-2026-0004",
      title: "SharePoint permission matrix update",
      description: "Update document library permissions for the HR department to restrict access to employee compensation files.",
      systemAffected: "SharePoint",
      category: "Security Patch",
      businessJustification: "Internal audit finding: compensation data accessible to non-HR staff through inherited permissions.",
      requestedTimeline: "2026-06-18",
      submitterId: "elena.r@company.com",
      submitterName: "Elena Rostova",
      submitterDepartment: "HR",
      status: "Deployed",
      riskLevel: "High",
      riskOverridden: true,
      riskOverrideJustification: "Originally flagged as medium, but elevated to high due to sensitive compensation data involved.",
      autoAssignedRisk: "Medium",
      approvals: [
        { approverId: "sarah.j@company.com", approverName: "Sarah Jenkins", action: "approved", timestamp: "2026-06-06T15:00:00Z" },
        { approverId: "adeyinka@company.com", approverName: "Adeyinka Akinsanya", action: "approved", timestamp: "2026-06-07T10:00:00Z", handledInHouse: true, costInvolved: false },
      ],
      testPlan: "Verify HR team can access compensation library. Verify non-HR users are denied access.",
      testSteps: [
        { id: "ts-6", description: "HR user access test", expectedOutcome: "Full read/write access to compensation library", result: "pass", notes: "Elena confirmed access", completedBy: "elena.r@company.com", completedAt: "2026-06-08T10:00:00Z" },
        { id: "ts-7", description: "Non-HR user access test", expectedOutcome: "Access denied message displayed", result: "pass", notes: "Tested with Marcus (Operations)", completedBy: "marcus.v@company.com", completedAt: "2026-06-08T10:30:00Z" },
      ],
      evidence: [
        { id: "ev-3", name: "access-denied-screenshot.png", type: "image/png", size: 180000, uploadedAt: "2026-06-08T10:35:00Z", uploadedBy: "marcus.v@company.com" },
      ],
      rollbackPlan: {
        steps: "1. Restore previous permission inheritance on compensation library\n2. Verify access restored for all users\n3. Notify HR team of temporary revert",
        responsiblePerson: "Adeyinka Akinsanya",
        estimatedTime: "15 minutes",
        dependencies: "None",
      },
      deployment: {
        deployedBy: "Adeyinka Akinsanya",
        deployedAt: "2026-06-09T14:00:00Z",
        notes: "Permission changes applied via SharePoint admin center. Verified with spot checks.",
        verificationStatus: "confirmed",
        signedOffBy: "Elena Rostova",
        signedOffAt: "2026-06-09T15:00:00Z",
      },
      timeline: [
        { stage: "Draft", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Created draft", timestamp: "2026-06-05T14:00:00Z" },
        { stage: "Submitted", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Submitted for review", timestamp: "2026-06-05T15:00:00Z" },
        { stage: "Approved", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Dept Lead approved", timestamp: "2026-06-06T15:00:00Z" },
        { stage: "Approved", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "IT Manager approved", timestamp: "2026-06-07T10:00:00Z" },
        { stage: "In Testing", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Started testing", timestamp: "2026-06-08T09:00:00Z" },
        { stage: "Testing Complete", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "All tests passed", timestamp: "2026-06-08T11:00:00Z" },
        { stage: "Deployed", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Deployed to production", timestamp: "2026-06-09T14:00:00Z" },
        { stage: "Post-Deployment Review", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Signed off — working as expected", timestamp: "2026-06-09T15:00:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-05T14:00:00Z",
      updatedAt: "2026-06-09T15:00:00Z",
    },
    {
      id: "CR-2026-0005",
      title: "Power BI dashboard — monthly KPI report",
      description: "Create a new Power BI dashboard showing monthly KPIs including revenue, headcount, and project completion rates.",
      systemAffected: "Power BI",
      category: "New Feature",
      businessJustification: "Executive leadership requested a consolidated KPI view for monthly board meetings.",
      requestedTimeline: "2026-07-15",
      submitterId: "adeyinka@company.com",
      submitterName: "Adeyinka Akinsanya",
      submitterDepartment: "IT",
      status: "Draft",
      riskLevel: "Low",
      riskOverridden: false,
      autoAssignedRisk: "Low",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Created draft", timestamp: "2026-06-14T16:00:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-14T16:00:00Z",
      updatedAt: "2026-06-14T16:00:00Z",
    },
    {
      id: "CR-2026-0006",
      title: "HRIS employee onboarding automation",
      description: "Automate the new employee onboarding workflow in HRIS including account provisioning, equipment requests, and orientation scheduling.",
      systemAffected: "HRIS",
      category: "New Feature",
      businessJustification: "Current manual onboarding process takes 3-5 days. Automation would reduce it to same-day completion.",
      requestedTimeline: "2026-08-15",
      submitterId: "elena.r@company.com",
      submitterName: "Elena Rostova",
      submitterDepartment: "HR",
      status: "Submitted",
      riskLevel: "Medium",
      riskOverridden: false,
      autoAssignedRisk: "Medium",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Created draft", timestamp: "2026-06-13T11:00:00Z" },
        { stage: "Submitted", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Submitted for review", timestamp: "2026-06-13T14:00:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-13T11:00:00Z",
      updatedAt: "2026-06-13T14:00:00Z",
    },
  ]
}

interface ChangesState {
  changes: ChangeRequest[]
}

const initialState: ChangesState = {
  changes: generateMockChanges(),
}

const changesSlice = createSlice({
  name: "changes",
  initialState,
  reducers: {
    addChange: (state, action: PayloadAction<ChangeRequest>) => {
      state.changes.unshift(action.payload)
    },
    updateChange: (state, action: PayloadAction<{ id: string; updates: Partial<ChangeRequest> }>) => {
      const idx = state.changes.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) {
        Object.assign(state.changes[idx], action.payload.updates)
        state.changes[idx].updatedAt = new Date().toISOString()
      }
    },
    addTimelineEvent: (state, action: PayloadAction<{ id: string; event: TimelineEvent }>) => {
      const change = state.changes.find((c) => c.id === action.payload.id)
      if (change) {
        change.timeline.push(action.payload.event)
        change.updatedAt = new Date().toISOString()
      }
    },
    addComment: (state, action: PayloadAction<{ id: string; comment: Comment }>) => {
      const change = state.changes.find((c) => c.id === action.payload.id)
      if (change) {
        change.comments.push(action.payload.comment)
        change.updatedAt = new Date().toISOString()
      }
    },
    addApproval: (state, action: PayloadAction<{ id: string; approval: ApprovalRecord }>) => {
      const change = state.changes.find((c) => c.id === action.payload.id)
      if (change) {
        change.approvals.push(action.payload.approval)
        change.updatedAt = new Date().toISOString()
      }
    },
    updateTestStep: (state, action: PayloadAction<{ changeId: string; stepId: string; updates: Partial<TestStep> }>) => {
      const change = state.changes.find((c) => c.id === action.payload.changeId)
      if (change) {
        const step = change.testSteps.find((s) => s.id === action.payload.stepId)
        if (step) {
          Object.assign(step, action.payload.updates)
          change.updatedAt = new Date().toISOString()
        }
      }
    },
    addEvidence: (state, action: PayloadAction<{ changeId: string; evidence: EvidenceFile }>) => {
      const change = state.changes.find((c) => c.id === action.payload.changeId)
      if (change) {
        change.evidence.push(action.payload.evidence)
        change.updatedAt = new Date().toISOString()
      }
    },
    saveChangeDraft: (state, action: PayloadAction<ChangeRequest>) => {
      const idx = state.changes.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) {
        state.changes[idx] = action.payload
      } else {
        state.changes.push(action.payload)
      }
    },
    deleteChange: (state, action: PayloadAction<string>) => {
      state.changes = state.changes.filter((c) => c.id !== action.payload)
    },
  },
})

export const {
  addChange,
  updateChange,
  addTimelineEvent,
  addComment,
  addApproval,
  updateTestStep,
  addEvidence,
  saveChangeDraft,
  deleteChange,
} = changesSlice.actions
export default changesSlice.reducer

