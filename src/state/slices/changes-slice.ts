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

// References a CategoryOption.name in the settings slice — admin-managed,
// so a string rather than a fixed union (mirrors RiskLevel).
export type ChangeCategory = string

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
  problemComplexity: string
  problemDescription: string
  currentSolution: string
  successMetrics: string
  simplerAlternative: string
  duration: string
  // Who will use this software (replaces the old internal/external/both flags)
  whoUsesSoftware: string // "Internal" | "External" | "Both"
  requiresStaffPersonalData: string // "Yes" | "No"
  requiresSensitiveData: string // "Yes" | "No"
  usesProductionData: string // "Yes" | "No"
  usesDefaultStack: string // "Yes" | "No"
  llmChoices: string[]
  integratesWithSystems: string[]
  postBuildSupport: string // "Deployment" | "Code Review" | "Both" | "Neither"
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
  riskJustification: string // requester's rationale for the chosen risk level
  selectedApprover?: string // legacy single-approver field (older mock rows)
  approvalPlan?: ResolvedApprovalStage[]
  approvals: ApprovalRecord[]
  aiRequest?: AIRequestData
  rollbackPlan?: RollbackPlan
  supportingDocuments?: EvidenceFile[]
  // Emergency change: urgent action already taken, recorded for retroactive review.
  isEmergency?: boolean
  emergencyActionTaken?: string
  emergencyActionTakenAt?: string
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
      category: "Update Existing System",
      businessJustification: "Finance team requires additional oversight for large invoices to comply with updated internal audit requirements.",
      requestedTimeline: "2026-07-01",
      submitterId: "sarah.j@company.com",
      submitterName: "Sarah Jenkins",
      submitterDepartment: "Finance",
      status: "Under Review",
      riskLevel: "Medium",
      riskJustification: "Workflow change affects financial approvals but is reversible and scoped to a single module.",
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
      category: "Update Existing System",
      businessJustification: "Sales team has been entering incomplete data, leading to inaccurate pipeline reports.",
      requestedTimeline: "2026-06-20",
      submitterId: "marcus.v@company.com",
      submitterName: "Marcus Vance",
      submitterDepartment: "Operations",
      status: "Approved",
      riskLevel: "Low",
      riskJustification: "Field validation tweak with no data migration; trivial to revert.",
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
      category: "Update Existing System",
      businessJustification: "Legacy ERP is being decommissioned by Q3 2026. Vendor records must be migrated to maintain procurement operations.",
      requestedTimeline: "2026-08-01",
      submitterId: "adeyinka@company.com",
      submitterName: "Adeyinka Akinsanya",
      submitterDepartment: "IT",
      status: "In Testing",
      riskLevel: "High",
      riskJustification: "Bulk migration of 2,500 financial records with bank details; high blast radius if mapping is wrong.",
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
      category: "Update Existing System",
      businessJustification: "Internal audit finding: compensation data accessible to non-HR staff through inherited permissions.",
      requestedTimeline: "2026-06-18",
      submitterId: "elena.r@company.com",
      submitterName: "Elena Rostova",
      submitterDepartment: "HR",
      status: "Deployed",
      riskLevel: "High",
      riskJustification: "Touches sensitive compensation data; incorrect permissions could expose confidential records.",
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
      category: "Build New Software/System",
      businessJustification: "Executive leadership requested a consolidated KPI view for monthly board meetings.",
      requestedTimeline: "2026-07-15",
      submitterId: "adeyinka@company.com",
      submitterName: "Adeyinka Akinsanya",
      submitterDepartment: "IT",
      status: "Draft",
      riskLevel: "Low",
      riskJustification: "Read-only reporting dashboard with no impact on source systems.",
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
      category: "Build New Software/System",
      businessJustification: "Current manual onboarding process takes 3-5 days. Automation would reduce it to same-day completion.",
      requestedTimeline: "2026-08-15",
      submitterId: "elena.r@company.com",
      submitterName: "Elena Rostova",
      submitterDepartment: "HR",
      status: "Submitted",
      riskLevel: "Medium",
      riskJustification: "New automation across multiple HR workflows; moderate risk if provisioning misfires.",
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
    {
      id: "CR-2026-0007",
      title: "ChatGPT Enterprise license — HR policy drafting",
      description: "Provision a ChatGPT Enterprise seat for HR to draft and review internal policy documents and employee communications.",
      systemAffected: "",
      category: "Request for AI License",
      businessJustification: "HR drafts a high volume of policy and communication documents; an enterprise-grade AI seat would cut first-draft turnaround significantly while keeping content in an access-controlled tool.",
      requestedTimeline: "2026-07-05",
      submitterId: "elena.r@company.com",
      submitterName: "Elena Rostova",
      submitterDepartment: "HR",
      status: "Under Review",
      riskLevel: "Medium",
      riskJustification: "Drafts may reference employee-specific details before being anonymized, so Department Lead sign-off is required even though the license itself is low-cost.",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Created draft", timestamp: "2026-06-16T09:00:00Z" },
        { stage: "Submitted", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Submitted for review", timestamp: "2026-06-16T09:20:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-16T09:00:00Z",
      updatedAt: "2026-06-16T09:20:00Z",
    },
    {
      id: "CR-2026-0008",
      title: "AI-assisted receipt categorization script",
      description: "Build a small internal script that uses an LLM to auto-categorize expense receipts into the correct GL codes before they reach Finance review.",
      systemAffected: "NetSuite",
      category: "Need AI to Build Something",
      businessJustification: "Manual receipt categorization is a recurring bottleneck during month-end close; automating the first pass frees up reviewer time for exceptions only.",
      requestedTimeline: "2026-06-20",
      submitterId: "sarah.j@company.com",
      submitterName: "Sarah Jenkins",
      submitterDepartment: "Finance",
      status: "Deployed",
      riskLevel: "Low",
      riskJustification: "Self-certified internal AI build — no staff personal or company-sensitive data involved.",
      approvals: [],
      aiRequest: {
        problemComplexity: "Low",
        problemDescription: "Receipts arrive with inconsistent formatting and need to be mapped to the right GL code before they can be posted.",
        currentSolution: "A Finance analyst manually reads each receipt and assigns a GL code.",
        successMetrics: "Cut manual categorization time by at least 70% during month-end close.",
        simplerAlternative: "Considered a rules-based keyword matcher, but it missed too many edge cases.",
        duration: "2 weeks",
        whoUsesSoftware: "Internal",
        requiresStaffPersonalData: "No",
        requiresSensitiveData: "No",
        usesProductionData: "Yes",
        usesDefaultStack: "Yes",
        llmChoices: ["Claude"],
        integratesWithSystems: ["NetSuite"],
        postBuildSupport: "Code Review",
      },
      testPlan: "Run the categorizer against a recent batch of receipts and compare its output to the analyst's original GL codes.",
      testSteps: [
        { id: "ts-8", description: "Run categorizer against 50 sample receipts", expectedOutcome: "At least 90% match analyst-assigned GL codes", result: "pass", notes: "47/50 matched; 3 edge cases correctly routed to manual review", completedBy: "sarah.j@company.com", completedAt: "2026-06-18T11:00:00Z" },
      ],
      evidence: [],
      deployment: {
        deployedBy: "Sarah Jenkins",
        deployedAt: "2026-06-19T13:00:00Z",
        notes: "Script deployed as a scheduled NetSuite integration step; first live batch reviewed manually as a sanity check.",
        verificationStatus: "confirmed",
        signedOffBy: "Sarah Jenkins",
        signedOffAt: "2026-06-19T14:00:00Z",
      },
      timeline: [
        { stage: "Draft", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Created draft", timestamp: "2026-06-15T10:00:00Z" },
        { stage: "Approved", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Self-certified via AI policy acknowledgment", timestamp: "2026-06-15T10:15:00Z" },
        { stage: "In Testing", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Started testing", timestamp: "2026-06-18T10:30:00Z" },
        { stage: "Testing Complete", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "All tests passed", timestamp: "2026-06-18T11:15:00Z" },
        { stage: "Deployed", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Deployed to production", timestamp: "2026-06-19T13:00:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-15T10:00:00Z",
      updatedAt: "2026-06-19T14:00:00Z",
    },
    {
      id: "CR-2026-0009",
      title: "GitHub Copilot license — Operations scripting",
      description: "Provision a GitHub Copilot seat to speed up internal scripting and automation work for the Operations team.",
      systemAffected: "",
      category: "Request for AI License",
      businessJustification: "Operations maintains several internal automation scripts; a Copilot seat would reduce the time spent writing and debugging boilerplate code.",
      requestedTimeline: "2026-07-10",
      submitterId: "marcus.v@company.com",
      submitterName: "Marcus Vance",
      submitterDepartment: "Operations",
      status: "Draft",
      riskLevel: "Low",
      riskJustification: "Single developer seat with no access to customer or financial data beyond what Marcus already has.",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Marcus Vance", actorId: "marcus.v@company.com", action: "Created draft", timestamp: "2026-06-20T08:30:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-20T08:30:00Z",
      updatedAt: "2026-06-20T08:30:00Z",
    },
    {
      id: "CR-2026-0010",
      title: "AI triage assistant for IT helpdesk tickets",
      description: "Build an internal assistant that reads incoming IT helpdesk tickets and suggests a category, priority, and likely owner before a human triages them.",
      systemAffected: "",
      category: "Need AI to Build Something",
      businessJustification: "Helpdesk triage currently takes a few minutes per ticket; pre-sorting tickets would let the IT team start on the highest-priority items first.",
      requestedTimeline: "2026-07-20",
      submitterId: "adeyinka@company.com",
      submitterName: "Adeyinka Akinsanya",
      submitterDepartment: "IT",
      status: "Draft",
      riskLevel: "Medium",
      riskJustification: "Ticket content occasionally includes employee details, so the model's data handling needs review before this can go further than a draft.",
      approvals: [],
      aiRequest: {
        problemComplexity: "Medium",
        problemDescription: "Incoming tickets vary widely in quality and detail, making manual triage slow and inconsistent.",
        currentSolution: "IT staff manually read and tag each ticket before assigning it.",
        successMetrics: "Cut average triage time per ticket by half.",
        simplerAlternative: "Considered a static keyword-based router, but ticket phrasing is too inconsistent.",
        duration: "3 weeks",
        whoUsesSoftware: "Internal",
        requiresStaffPersonalData: "Yes",
        requiresSensitiveData: "No",
        usesProductionData: "Yes",
        usesDefaultStack: "Yes",
        llmChoices: ["Claude"],
        integratesWithSystems: ["Custom Application"],
        postBuildSupport: "Both",
      },
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Adeyinka Akinsanya", actorId: "adeyinka@company.com", action: "Created draft", timestamp: "2026-06-21T09:15:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-21T09:15:00Z",
      updatedAt: "2026-06-21T09:15:00Z",
    },
    {
      id: "CR-2026-0011",
      title: "Travel Portal expense limit update",
      description: "Update the per-diem and expense limits configured in the Travel Portal to match the new 2026 travel policy.",
      systemAffected: "Travel Portal",
      category: "Update Existing System",
      businessJustification: "The 2026 travel policy revised per-diem rates for several regions; the portal's configured limits need to match or employees will see incorrect approval thresholds.",
      requestedTimeline: "2026-07-08",
      submitterId: "sarah.j@company.com",
      submitterName: "Sarah Jenkins",
      submitterDepartment: "Finance",
      status: "Draft",
      riskLevel: "Low",
      riskJustification: "Configuration-only change to limit values; no impact on existing bookings or approvals already in flight.",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Sarah Jenkins", actorId: "sarah.j@company.com", action: "Created draft", timestamp: "2026-06-21T13:45:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-21T13:45:00Z",
      updatedAt: "2026-06-21T13:45:00Z",
    },
    {
      id: "CR-2026-0012",
      title: "Seasonal staff onboarding portal",
      description: "Stand up a lightweight onboarding portal for seasonal and contract staff who don't go through the full HRIS onboarding flow.",
      systemAffected: "",
      category: "Build New Software/System",
      businessJustification: "Seasonal hires currently get onboarded through a mix of email and spreadsheets; a small dedicated portal would standardize document collection and orientation scheduling.",
      requestedTimeline: "2026-08-01",
      submitterId: "elena.r@company.com",
      submitterName: "Elena Rostova",
      submitterDepartment: "HR",
      status: "Draft",
      riskLevel: "Low",
      riskJustification: "New, standalone tool with no integration into HRIS or payroll at this stage.",
      approvals: [],
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        { stage: "Draft", actorName: "Elena Rostova", actorId: "elena.r@company.com", action: "Created draft", timestamp: "2026-06-22T10:00:00Z" },
      ],
      comments: [],
      isQueried: false,
      createdAt: "2026-06-22T10:00:00Z",
      updatedAt: "2026-06-22T10:00:00Z",
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

