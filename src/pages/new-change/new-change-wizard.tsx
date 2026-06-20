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
  EvidenceFile,
} from "../../state/slices/changes-slice";
import { saveChangeDraft } from "../../state/slices/changes-slice";
import { useAppSelector, useAppDispatch } from "../../state/store";
import type {
  CategoryOption,
  ChangeCategoryKind,
} from "../../state/slices/settings-slice";

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
  supportingDocuments: EvidenceFile[];

  // Emergency change (admin-only) — recording urgent action already taken
  isEmergency: boolean;
  emergencyActionTaken: string;
  emergencyActionTakenAt: string;

  // Step 2 — AI Request (conditional on ai_build)
  aiRequest: AIRequestData;

  // Step 3 — Risk & Justification
  riskLevel: RiskLevel;
  riskJustification: string;
  businessJustification: string;

  // Step 4 — Rollback Plan
  rollbackPlan: RollbackPlan;

  // Step 5 — Review (resolved approval chain)
  approvalPlan: ResolvedApprovalStage[];
}

export interface WizardContextValue {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  updateFormData: (partial: Partial<WizardFormData>) => void;
  draftId: string;
  /** kind of the currently selected category, or undefined if none */
  categoryKind?: ChangeCategoryKind;
  /** true when this AI-build request qualifies for policy self-certification */
  isSelfCertify: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export const useWizard = () => {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within NewChangeWizard");
  return ctx;
};

/* ── Helpers ── */
export const getCategoryKind = (
  category: ChangeCategory | "",
  categories: CategoryOption[],
): ChangeCategoryKind | undefined =>
  categories.find((c) => c.name === category)?.kind;

const EMPTY_AI_REQUEST: AIRequestData = {
  ruleEngine: "",
  aiMl: "",
  human: "",
  statisticalModeling: "",
  problemComplexity: "",
  problemDescription: "",
  currentSolution: "",
  successMetrics: "",
  simplerAlternative: "",
  duration: "",
  whoUsesSoftware: "",
  requiresStaffPersonalData: "",
  requiresSensitiveData: "",
  usesProductionData: "",
  usesDefaultStack: "",
  llmChoices: [],
  integratesWithSystems: [],
  postBuildSupport: "",
};

const INITIAL_FORM_DATA: WizardFormData = {
  title: "",
  description: "",
  systemAffected: "",
  category: "",
  submitterName: "",
  submitterDepartment: "",
  requestedTimeline: "",
  supportingDocuments: [],

  isEmergency: false,
  emergencyActionTaken: "",
  emergencyActionTakenAt: "",

  aiRequest: EMPTY_AI_REQUEST,

  riskLevel: "",
  riskJustification: "",
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
        category: "",
        businessJustification: "",
        requestedTimeline: "",
        submitterId: currentUser.id,
        submitterName: currentUser.name,
        submitterDepartment: currentUser.department,
        status: "Draft",
        riskLevel: "",
        riskJustification: "",
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
        supportingDocuments: currentDraft.supportingDocuments || [],
        isEmergency: currentDraft.isEmergency || false,
        emergencyActionTaken: currentDraft.emergencyActionTaken || "",
        emergencyActionTakenAt: currentDraft.emergencyActionTakenAt || "",
        aiRequest: currentDraft.aiRequest || EMPTY_AI_REQUEST,
        riskLevel: currentDraft.riskLevel || "",
        riskJustification: currentDraft.riskJustification || "",
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
      const kind = getCategoryKind(next.category, categories);

      // Sync back to Redux draft request
      if (draftId && currentDraft) {
        dispatch(
          saveChangeDraft({
            ...currentDraft,
            title: next.title,
            description: next.description,
            systemAffected: next.systemAffected,
            category: next.category,
            businessJustification: next.businessJustification,
            requestedTimeline: next.requestedTimeline,
            supportingDocuments: next.supportingDocuments,
            isEmergency: next.isEmergency,
            emergencyActionTaken: next.emergencyActionTaken,
            emergencyActionTakenAt: next.emergencyActionTakenAt,
            riskLevel: next.riskLevel,
            riskJustification: next.riskJustification,
            aiRequest: kind === "ai_build" ? next.aiRequest : undefined,
            rollbackPlan: next.rollbackPlan,
            approvalPlan: next.approvalPlan,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      return next;
    });
  };

  const categoryKind = getCategoryKind(formData.category, categories);

  // AI-build requests that are internal-only and touch no staff/sensitive data
  // self-certify against the AI policy instead of going through approval.
  const isSelfCertify =
    categoryKind === "ai_build" &&
    !formData.isEmergency &&
    formData.aiRequest.whoUsesSoftware === "Internal" &&
    formData.aiRequest.requiresStaffPersonalData === "No" &&
    formData.aiRequest.requiresSensitiveData === "No";

  /* ── Steps definition ── */
  const steps = [
    {
      key: "general",
      label: "General Info",
      path: "/self/changes/new/general",
    },
    ...(categoryKind === "ai_build"
      ? [
          {
            key: "ai-request",
            label: "AI Request",
            path: "/self/changes/new/ai-request",
          },
        ]
      : []),
    ...(isSelfCertify
      ? [
          {
            key: "ai-policy",
            label: "AI Policy",
            path: "/self/changes/new/ai-policy",
          },
        ]
      : [
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
        ]),
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
          }),
        );
      }
    }
  }, [currentStepIdx, currentDraft, dispatch, steps]);

  const ctxValue: WizardContextValue = {
    formData,
    setFormData,
    updateFormData,
    draftId,
    categoryKind,
    isSelfCertify,
  };

  if (!draftId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  const isLastStep = currentStepIdx === steps.length - 1;
  const submitLabel = isSelfCertify
    ? "Acknowledge & Submit"
    : "Submit Change Request";

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
                  {isLastStep ? submitLabel : "Save & Next"}
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
