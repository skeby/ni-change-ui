import React, { createContext, useContext, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Steps, Button } from "antd"
import type {
  ChangeCategory,
  RiskLevel,
  AIRequestData,
  RollbackPlan,
} from "../../state/slices/changes-slice"

/* ── Wizard form data shape ── */
export interface WizardFormData {
  // Step 1 — General
  title: string
  description: string
  systemAffected: string
  category: ChangeCategory | ""
  submitterName: string
  submitterDepartment: string
  requestedTimeline: string

  // Step 2 — AI Request (conditional)
  aiRequest: AIRequestData

  // Step 3 — Risk & Justification
  autoAssignedRisk: RiskLevel
  riskLevel: RiskLevel
  riskOverridden: boolean
  riskOverrideJustification: string
  businessJustification: string

  // Step 4 — Rollback Plan
  rollbackPlan: RollbackPlan

  // Step 5 — Review
  selectedApprover: string
}

export interface WizardContextValue {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  updateFormData: (partial: Partial<WizardFormData>) => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export const useWizard = () => {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error("useWizard must be used within NewChangeWizard")
  return ctx
}

/* ── Helper: derive auto-assigned risk from category ── */
const deriveRisk = (category: ChangeCategory | ""): RiskLevel => {
  switch (category) {
    case "Bug Fix":
    case "Configuration Change":
      return "Low"
    case "New Feature":
    case "Integration":
    case "AI":
      return "Medium"
    case "Security Patch":
      return "High"
    default:
      return "Low"
  }
}

const INITIAL_FORM_DATA: WizardFormData = {
  title: "",
  description: "",
  systemAffected: "",
  category: "",
  submitterName: "",
  submitterDepartment: "",
  requestedTimeline: "",

  aiRequest: {
    frequency: "",
    ruleEngine: "",
    aiMl: "",
    human: "",
    statisticalModeling: "",
    problemComplexity: "",
    problemDescription: "",
    currentSolution: "",
    successMetrics: "",
    simplerAlternative: "",
    globalUse: "",
    requiresStaffData: "",
    requiresSensitiveData: "",
    externalUsers: "",
    internalOnly: "",
    bothUsers: "",
    duration: "",
  },

  autoAssignedRisk: "Low",
  riskLevel: "Low",
  riskOverridden: false,
  riskOverrideJustification: "",
  businessJustification: "",

  rollbackPlan: {
    steps: "",
    responsiblePerson: "",
    estimatedTime: "",
    dependencies: "",
  },

  selectedApprover: "",
}

const NewChangeWizard: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  const [formData, setFormData] = useState<WizardFormData>(() => {
    const saved = localStorage.getItem("ni-change-wizard-draft")
    if (saved) {
      try {
        return { ...INITIAL_FORM_DATA, ...JSON.parse(saved) }
      } catch {
        return INITIAL_FORM_DATA
      }
    }
    return INITIAL_FORM_DATA
  })

  // Persist draft to localStorage on every change
  useEffect(() => {
    localStorage.setItem("ni-change-wizard-draft", JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    setPortalEl(document.getElementById("layout-footer-portal"))
  }, [])

  const updateFormData = (partial: Partial<WizardFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...partial }
      // Auto-recalculate risk when category changes
      if (partial.category !== undefined) {
        const autoRisk = deriveRisk(next.category)
        next.autoAssignedRisk = autoRisk
        if (!next.riskOverridden) {
          next.riskLevel = autoRisk
        }
      }
      return next
    })
  }

  /* ── Steps definition ── */
  const steps = [
    { key: "general", label: "General Info", path: "/self/changes/new/general" },
    {
      key: "ai-request",
      label: "AI Request",
      path: "/self/changes/new/ai-request",
    },
    {
      key: "risk",
      label: "Risk & Justification",
      path: "/self/changes/new/risk",
    },
    {
      key: "rollback",
      label: "Rollback Plan",
      path: "/self/changes/new/rollback",
    },
    {
      key: "review",
      label: "Review & Submit",
      path: "/self/changes/new/review",
    },
  ]

  const currentStepIdx = steps.findIndex((s) =>
    location.pathname.startsWith(s.path)
  )

  const ctxValue: WizardContextValue = { formData, setFormData, updateFormData }

  return (
    <WizardContext.Provider value={ctxValue}>
      <div className="space-y-8 pb-10">
        {/* Step Progress Tracker */}
        <div className="card flex flex-col justify-between gap-7 p-6 md:flex-row md:items-center">
          <div className="flex-1">
            <Steps
              current={currentStepIdx}
              onChange={(current) => {
                if (current < currentStepIdx) {
                  navigate(steps[current].path)
                }
              }}
              items={steps.map((step, idx) => ({
                title: step.label,
                disabled: idx > currentStepIdx,
              }))}
              size="small"
              responsive
            />
          </div>
        </div>

        {/* Current step content */}
        <div className="animate-fade-in">
          <Outlet />
        </div>

        {/* Footer portal navigation */}
        {portalEl &&
          createPortal(
            <div className="bg-bg border-border flex h-[68px] w-full items-center justify-end border-t px-8">
              <div className="mx-auto flex w-full justify-end gap-x-2">
                {currentStepIdx > 0 && (
                  <Button
                    onClick={() => navigate(steps[currentStepIdx - 1].path)}
                    className="border-border! text-fade! h-10! cursor-pointer rounded-lg! bg-transparent px-6! leading-5! font-semibold! shadow-none!"
                  >
                    Previous
                  </Button>
                )}
                <Button
                  form="step-form"
                  htmlType="submit"
                  type="primary"
                  className="bg-primary! h-10! cursor-pointer rounded-lg! px-6! leading-5! font-semibold! text-white! shadow-none!"
                >
                  {currentStepIdx === steps.length - 1
                    ? "Submit Change Request"
                    : "Save & Next"}
                </Button>
              </div>
            </div>,
            portalEl
          )}
      </div>
    </WizardContext.Provider>
  )
}

export default NewChangeWizard
