import React, { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Outlet, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Steps, Button } from "antd";
import type {
  ChangeCategory,
  RiskLevel,
  AIRequestData,
  RollbackPlan,
  ResolvedApprovalStage,
  ChangeRequest,
} from "../../state/slices/changes-slice";
import { saveChangeDraft } from "../../state/slices/changes-slice";
import { useAppSelector, useAppDispatch } from "../../state/store";
import type { CategoryOption } from "../../state/slices/settings-slice";

/* ── Wizard form data shape ── */
export interface WizardFormData {
  // Step 1 — General
  title: string;
  description: string;
  systemAffected: string;
  category: ChangeCategory | "";
  submitterName: string;
  submitterDepartment: string;
  requestedTimeline: string;

  // Step 2 — AI Request (conditional)
  aiRequest: AIRequestData;

  // Step 3 — Risk & Justification
  autoAssignedRisk: RiskLevel;
  riskLevel: RiskLevel;
  riskOverridden: boolean;
  riskOverrideJustification: string;
  businessJustification: string;

  // Step 4 — Rollback Plan
  rollbackPlan: RollbackPlan;

  // Step 5 — Review (resolved approval chain for the selected risk level)
  approvalPlan: ResolvedApprovalStage[];
}

export interface WizardContextValue {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  updateFormData: (partial: Partial<WizardFormData>) => void;
  draftId: string;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export const useWizard = () => {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within NewChangeWizard");
  return ctx;
};

/* ── Helper: derive auto-assigned risk from the category's defaultRisk ── */
const deriveRisk = (
  category: ChangeCategory | "",
  categories: CategoryOption[],
): RiskLevel => {
  if (!category) return "Low";
  return categories.find((c) => c.name === category)?.defaultRisk ?? "Low";
};

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

  approvalPlan: [],
};

const NewChangeWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const categories = useAppSelector((state) => state.settings.categories);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  const { changes } = useAppSelector((state) => state.changes);
  const { currentUserId, users } = useAppSelector((state) => state.auth);
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const draftId = searchParams.get("draftId") || "";
  const currentDraft = changes.find((c) => c.id === draftId);

  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);

  // Initialize a new draft if no draftId exists
  useEffect(() => {
    if (!draftId) {
      const newDraftId = `DRAFT-${Date.now()}`;
      const newDraft: ChangeRequest = {
        id: newDraftId,
        title: "",
        description: "",
        systemAffected: "",
        category: "New Feature",
        businessJustification: "",
        requestedTimeline: "",
        submitterId: currentUser.id,
        submitterName: currentUser.name,
        submitterDepartment: currentUser.department,
        status: "Draft",
        riskLevel: "Low",
        riskOverridden: false,
        autoAssignedRisk: "Low",
        approvals: [],
        testPlan: "",
        testSteps: [],
        evidence: [],
        timeline: [],
        comments: [],
        isQueried: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draftStep: "general",
      };
      dispatch(saveChangeDraft(newDraft));
      navigate(`/self/changes/new/general?draftId=${newDraftId}`, { replace: true });
    }
  }, [draftId, dispatch, navigate, currentUser]);

  // Sync formData context with currentDraft from Redux store when loaded
  useEffect(() => {
    if (currentDraft) {
      setFormData({
        title: currentDraft.title || "",
        description: currentDraft.description || "",
        systemAffected: currentDraft.systemAffected || "",
        category: currentDraft.category || "",
        submitterName: currentDraft.submitterName || "",
        submitterDepartment: currentDraft.submitterDepartment || "",
        requestedTimeline: currentDraft.requestedTimeline || "",
        aiRequest: currentDraft.aiRequest || INITIAL_FORM_DATA.aiRequest,
        autoAssignedRisk: currentDraft.autoAssignedRisk || "Low",
        riskLevel: currentDraft.riskLevel || "Low",
        riskOverridden: currentDraft.riskOverridden || false,
        riskOverrideJustification: currentDraft.riskOverrideJustification || "",
        businessJustification: currentDraft.businessJustification || "",
        rollbackPlan: currentDraft.rollbackPlan || INITIAL_FORM_DATA.rollbackPlan,
        approvalPlan: currentDraft.approvalPlan || [],
      });
    }
  }, [currentDraft]);

  useEffect(() => {
    setPortalEl(document.getElementById("layout-footer-portal"));
  }, []);

  const updateFormData = (partial: Partial<WizardFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...partial };
      // Auto-recalculate risk when category changes
      if (partial.category !== undefined) {
        const autoRisk = deriveRisk(next.category, categories);
        next.autoAssignedRisk = autoRisk;
        if (!next.riskOverridden) {
          next.riskLevel = autoRisk;
        }
      }

      // Sync back to Redux draft request
      if (draftId && currentDraft) {
        dispatch(
          saveChangeDraft({
            ...currentDraft,
            title: next.title,
            description: next.description,
            systemAffected: next.systemAffected,
            category: next.category as any,
            businessJustification: next.businessJustification,
            requestedTimeline: next.requestedTimeline,
            riskLevel: next.riskLevel,
            riskOverridden: next.riskOverridden,
            riskOverrideJustification: next.riskOverrideJustification,
            autoAssignedRisk: next.autoAssignedRisk,
            aiRequest: next.category === "AI" ? next.aiRequest : undefined,
            rollbackPlan: next.rollbackPlan,
            approvalPlan: next.approvalPlan,
            updatedAt: new Date().toISOString(),
          })
        );
      }
      return next;
    });
  };

  /* ── Steps definition ── */
  const steps = [
    {
      key: "general",
      label: "General Info",
      path: "/self/changes/new/general",
    },
    ...(formData.category === "AI"
      ? [
          {
            key: "ai-request",
            label: "AI Request",
            path: "/self/changes/new/ai-request",
          },
        ]
      : []),
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
  ];

  const currentStepIdx = steps.findIndex((s) =>
    location.pathname.startsWith(s.path),
  );

  // Auto-save current wizard step to draft metadata
  useEffect(() => {
    if (currentDraft && currentStepIdx >= 0) {
      const stepKey = steps[currentStepIdx].key;
      if (currentDraft.draftStep !== stepKey) {
        dispatch(
          saveChangeDraft({
            ...currentDraft,
            draftStep: stepKey,
            updatedAt: new Date().toISOString(),
          })
        );
      }
    }
  }, [currentStepIdx, currentDraft, dispatch, steps]);

  const ctxValue: WizardContextValue = {
    formData,
    setFormData,
    updateFormData,
    draftId,
  };

  if (!draftId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

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
                  navigate(`${steps[current].path}?draftId=${draftId}`);
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
                    onClick={() => navigate(`${steps[currentStepIdx - 1].path}?draftId=${draftId}`)}
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
            portalEl,
          )}
      </div>
    </WizardContext.Provider>
  );
};

export default NewChangeWizard;
