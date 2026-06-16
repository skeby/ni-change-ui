import React from "react"
import { useNavigate } from "react-router-dom"
import { Select } from "antd"
import {
  FileText,
  Cpu,
  ShieldCheck,
  Shield,
  ShieldAlert,
  RotateCcw,
  Send,
  User,
} from "lucide-react"
import { useAppSelector, useAppDispatch } from "../../state/store"
import { addChange } from "../../state/slices/changes-slice"
import type { ChangeRequest, RiskLevel } from "../../state/slices/changes-slice"
import { useWizard } from "./new-change-wizard"
import { cn } from "../../utils/cn"

const RISK_STYLES: Record<RiskLevel, { color: string; icon: React.ReactNode }> =
  {
    Low: {
      color: "text-emerald-600 dark:text-emerald-400",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    Medium: {
      color: "text-amber-600 dark:text-amber-400",
      icon: <Shield className="h-4 w-4" />,
    },
    High: {
      color: "text-red-600 dark:text-red-400",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
  }

const ReviewStep: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { formData, updateFormData } = useWizard()
  const { currentUserId, users } = useAppSelector((state) => state.auth)
  const currentUser = users.find((u) => u.id === currentUserId)

  const riskStyle = RISK_STYLES[formData.riskLevel] || RISK_STYLES.Low

  const isLowRisk = formData.riskLevel === "Low"

  // Approver candidates: all users with Approver role except the current user
  const approverOptions = users
    .filter(
      (u) => u.id !== currentUserId && u.baseRoles.includes("Approver")
    )
    .map((u) => ({ label: `${u.name} (${u.department})`, value: u.id }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date().toISOString()
    const newId = `CR-${new Date().getFullYear()}-${String(Date.now()).slice(-4).padStart(4, "0")}`

    const changeRequest: ChangeRequest = {
      id: newId,
      title: formData.title,
      description: formData.description,
      systemAffected: formData.systemAffected,
      category: formData.category as ChangeRequest["category"],
      businessJustification: formData.businessJustification,
      requestedTimeline: formData.requestedTimeline,
      submitterId: currentUserId,
      submitterName: currentUser?.name || "",
      submitterDepartment: currentUser?.department || "",
      status: "Submitted",
      riskLevel: formData.riskLevel,
      riskOverridden: formData.riskOverridden,
      riskOverrideJustification: formData.riskOverrideJustification || undefined,
      autoAssignedRisk: formData.autoAssignedRisk,
      selectedApprover: isLowRisk ? formData.selectedApprover : undefined,
      approvals: [],
      aiRequest:
        formData.category === "AI" ? formData.aiRequest : undefined,
      rollbackPlan:
        formData.rollbackPlan.steps
          ? formData.rollbackPlan
          : undefined,
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: [
        {
          stage: "Draft",
          actorName: currentUser?.name || "",
          actorId: currentUserId,
          action: "Created draft",
          timestamp: now,
        },
        {
          stage: "Submitted",
          actorName: currentUser?.name || "",
          actorId: currentUserId,
          action: "Submitted for review",
          timestamp: now,
        },
      ],
      comments: [],
      isQueried: false,
      createdAt: now,
      updatedAt: now,
    }

    dispatch(addChange(changeRequest))

    // Clear wizard draft from localStorage
    localStorage.removeItem("ni-change-wizard-draft")

    navigate("/self/changes")
  }

  return (
    <form id="step-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="card-title mb-0.5">Review & Submit</h3>
            <p className="card-description">
              Review all details before submitting. Use the Previous button to go
              back and make changes.
            </p>
          </div>
        </div>
      </div>

      {/* General Information Summary */}
      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-2">
          <FileText className="text-primary h-4 w-4" />
          <h4 className="text-body-md text-primary-alpha font-bold">
            General Information
          </h4>
        </div>
        <div className="border-border grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-2">
          <SummaryField label="Title" value={formData.title} full />
          <SummaryField label="Description" value={formData.description} full />
          <SummaryField label="System Affected" value={formData.systemAffected} />
          <SummaryField label="Category" value={formData.category} />
          <SummaryField label="Submitter" value={formData.submitterName} />
          <SummaryField label="Department" value={formData.submitterDepartment} />
          <SummaryField
            label="Requested Timeline"
            value={formData.requestedTimeline}
          />
        </div>
      </div>

      {/* AI Request Summary (conditional) */}
      {formData.category === "AI" && (
        <div className="card space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary h-4 w-4" />
            <h4 className="text-body-md text-primary-alpha font-bold">
              AI Request Details
            </h4>
          </div>
          <div className="border-border grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-2 lg:grid-cols-3">
            <SummaryField
              label="Frequency"
              value={formData.aiRequest.frequency}
            />
            <SummaryField
              label="Rule Engine"
              value={formData.aiRequest.ruleEngine}
            />
            <SummaryField label="AI & ML" value={formData.aiRequest.aiMl} />
            <SummaryField
              label="Human / Manual"
              value={formData.aiRequest.human}
            />
            <SummaryField
              label="Statistical Modeling"
              value={formData.aiRequest.statisticalModeling}
            />
            <SummaryField
              label="Problem Complexity"
              value={formData.aiRequest.problemComplexity}
            />
            <SummaryField
              label="Problem Description"
              value={formData.aiRequest.problemDescription}
              full
            />
            <SummaryField
              label="Current Solution"
              value={formData.aiRequest.currentSolution}
              full
            />
            <SummaryField
              label="Success Metrics"
              value={formData.aiRequest.successMetrics}
              full
            />
            <SummaryField
              label="Simpler Alternative"
              value={formData.aiRequest.simplerAlternative}
              full
            />
            <SummaryField
              label="Global Use"
              value={formData.aiRequest.globalUse}
            />
            <SummaryField
              label="Staff Data"
              value={formData.aiRequest.requiresStaffData}
            />
            <SummaryField
              label="Sensitive Data"
              value={formData.aiRequest.requiresSensitiveData}
            />
            <SummaryField
              label="External Users"
              value={formData.aiRequest.externalUsers}
            />
            <SummaryField
              label="Internal Only"
              value={formData.aiRequest.internalOnly}
            />
            <SummaryField
              label="Both Users"
              value={formData.aiRequest.bothUsers}
            />
            <SummaryField
              label="Duration"
              value={formData.aiRequest.duration}
            />
          </div>
        </div>
      )}

      {/* Risk & Justification Summary */}
      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-2">
          {riskStyle.icon}
          <h4 className="text-body-md text-primary-alpha font-bold">
            Risk & Justification
          </h4>
        </div>
        <div className="border-border grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-fade text-body-xs block font-bold uppercase tracking-wide">
              Risk Level
            </span>
            <span
              className={cn("text-body-sm flex items-center gap-1.5 font-semibold", riskStyle.color)}
            >
              {riskStyle.icon} {formData.riskLevel}
              {formData.riskOverridden && " (overridden)"}
            </span>
          </div>
          {formData.riskOverridden && (
            <SummaryField
              label="Override Justification"
              value={formData.riskOverrideJustification}
            />
          )}
          <SummaryField
            label="Business Justification"
            value={formData.businessJustification}
            full
          />
        </div>
      </div>

      {/* Rollback Plan Summary */}
      {formData.rollbackPlan.steps && (
        <div className="card space-y-4 p-6">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-primary h-4 w-4" />
            <h4 className="text-body-md text-primary-alpha font-bold">
              Rollback Plan
            </h4>
          </div>
          <div className="border-border grid grid-cols-1 gap-4 rounded-xl border p-4 md:grid-cols-2">
            <SummaryField
              label="Rollback Steps"
              value={formData.rollbackPlan.steps}
              full
            />
            <SummaryField
              label="Responsible Person"
              value={formData.rollbackPlan.responsiblePerson}
            />
            <SummaryField
              label="Estimated Time"
              value={formData.rollbackPlan.estimatedTime}
            />
            <SummaryField
              label="Dependencies & Risks"
              value={formData.rollbackPlan.dependencies}
              full
            />
          </div>
        </div>
      )}

      {/* Approval Routing */}
      <div className="card space-y-4 p-6">
        <div className="flex items-center gap-2">
          <User className="text-primary h-4 w-4" />
          <h4 className="text-body-md text-primary-alpha font-bold">
            Approval Routing
          </h4>
        </div>

        {isLowRisk ? (
          <div className="space-y-3">
            <p className="text-body-sm text-fade">
              Low risk changes require a single approver. Select who should
              review this request.
            </p>
            <div className="max-w-md">
              <label className="text-body-sm text-primary-alpha mb-1.5 block font-bold">
                Select Approver <span className="text-error font-bold">*</span>
              </label>
              <Select
                value={formData.selectedApprover || undefined}
                onChange={(value) => updateFormData({ selectedApprover: value })}
                placeholder="Select an approver..."
                className="bg-background-light! w-full! rounded-xl! h-12!"
                options={approverOptions}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-body-sm text-fade">
              {formData.riskLevel === "Medium"
                ? "Medium risk changes follow a two-tier approval chain."
                : "High risk changes follow the full approval chain including executive sign-off."}
            </p>
            <div className="border-border bg-bg-muted/30 space-y-2 rounded-xl border p-4">
              {formData.riskLevel === "Medium" && (
                <>
                  <ApprovalChainItem step={1} label="Department Lead" />
                  <ApprovalChainItem step={2} label="IT Manager" />
                </>
              )}
              {formData.riskLevel === "High" && (
                <>
                  <ApprovalChainItem step={1} label="Department Lead" />
                  <ApprovalChainItem step={2} label="IT Manager" />
                  <ApprovalChainItem step={3} label="CTO / Executive Sponsor" />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

/* ── Helper Components ── */

const SummaryField: React.FC<{
  label: string
  value: string | undefined
  full?: boolean
}> = ({ label, value, full }) => (
  <div className={cn("space-y-1", full && "col-span-full")}>
    <span className="text-fade text-body-xs block font-bold uppercase tracking-wide">
      {label}
    </span>
    <span className="text-primary-alpha text-body-sm block whitespace-pre-wrap font-medium">
      {value || <span className="text-fade italic">Not provided</span>}
    </span>
  </div>
)

const ApprovalChainItem: React.FC<{ step: number; label: string }> = ({
  step,
  label,
}) => (
  <div className="flex items-center gap-3">
    <span className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
      {step}
    </span>
    <span className="text-body-sm text-primary-alpha font-semibold">
      {label}
    </span>
  </div>
)

export default ReviewStep
