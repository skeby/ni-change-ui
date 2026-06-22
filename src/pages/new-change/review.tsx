import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, Modal, message } from "antd";
import { ShieldAlert, CheckCircle, Siren } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../state/store";
import { addChange, deleteChange } from "../../state/slices/changes-slice";
import type {
  ChangeRequest,
  ResolvedApprovalStage,
} from "../../state/slices/changes-slice";
import { useWizard } from "./new-change-wizard";
import { cn } from "../../utils/cn";
import { Utils } from "../../utils";
import Tag from "../../components/ui/tag";
import type { FieldError } from "react-hook-form";

const ReviewStep: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { formData, draftId, categoryKind } = useWizard();
  const { changes } = useAppSelector((state) => state.changes);
  const { currentUserId, users } = useAppSelector((state) => state.auth);
  const riskLevels = useAppSelector((state) => state.settings.riskLevels);
  const approvalRules = useAppSelector((state) => state.settings.approvalRules);
  const currentUser = users.find((u) => u.id === currentUserId);

  const isAIBuild = categoryKind === "ai_build";
  const isEmergency = formData.isEmergency;

  const riskColor = Utils.resolveRiskColor(riskLevels, formData.riskLevel);
  const isLowestSeverity =
    riskLevels.length > 0 &&
    riskLevels.find((r) => r.name === formData.riskLevel)?.severity ===
      Math.min(...riskLevels.map((r) => r.severity));

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [approverSelections, setApproverSelections] = useState<
    Record<string, string>
  >({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Approver candidates: all users with Approver role except the current user
  const approverOptions = users
    .filter((u) => u.id !== currentUserId && u.baseRoles.includes("Approver"))
    .map((u) => ({ label: `${u.name} (${u.department})`, value: u.id }));

  // Approval stages resolved from the Risk × Category × System rule matrix.
  // Emergency changes record action already taken, so they bypass approval.
  const configuredStages = useMemo(
    () =>
      isEmergency
        ? []
        : Utils.resolveApprovalStages(
            approvalRules,
            formData.category,
            formData.systemAffected || "Any",
            formData.riskLevel,
          ),
    [
      approvalRules,
      formData.category,
      formData.systemAffected,
      formData.riskLevel,
      isEmergency,
    ],
  );

  const routingExplanation = useMemo(() => {
    if (isEmergency) {
      return {
        icon: <Siren className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />,
        text: "Emergency change: the action has already been taken. This will be recorded as approved and flagged for retroactive review — no approver selection is needed.",
      };
    }
    if (configuredStages.length === 0) {
      return {
        icon: (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        ),
        text: `No approval rule matches this ${formData.riskLevel} risk ${formData.category} change yet. Contact an admin to configure a rule under Settings → Approval Rules before submitting.`,
      };
    }
    if (isLowestSeverity) {
      return {
        icon: (
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        ),
        text: "This is a low risk change. It will route directly to the approver you select below.",
      };
    }
    return {
      icon: <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />,
      text: `This is a ${formData.riskLevel.toLowerCase()} risk change. It will follow the ${configuredStages.length}-stage approval chain below before it can proceed.`,
    };
  }, [configuredStages, formData.riskLevel, formData.category, isLowestSeverity, isEmergency]);

  const handleTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(false);
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!isEmergency) {
      const missingApprover = configuredStages.some(
        (s) => !approverSelections[s.id],
      );
      if (missingApprover) {
        setSubmitAttempted(true);
        message.error("Select an approver for each stage.");
        return;
      }
    }

    const now = new Date().toISOString();
    const submittedCount = changes.filter(
      (c) => !c.id.startsWith("DRAFT"),
    ).length;
    const newId = `CR-${new Date().getFullYear()}-${String(submittedCount + 1).padStart(4, "0")}`;

    const approvalPlan: ResolvedApprovalStage[] = configuredStages.map((s) => ({
      id: s.id,
      type: s.type,
      role: s.type === "role_based" ? s.role : undefined,
      approverId: approverSelections[s.id],
    }));

    const changeRequest: ChangeRequest = {
      id: newId,
      title: formData.title,
      description: formData.description,
      systemAffected: formData.systemAffected,
      category: formData.category,
      businessJustification: formData.businessJustification,
      requestedTimeline: formData.requestedTimeline,
      submitterId: currentUserId,
      submitterName: currentUser?.name || "",
      submitterDepartment: currentUser?.department || "",
      status: isEmergency ? "Approved" : "Submitted",
      riskLevel: formData.riskLevel,
      riskJustification: formData.riskJustification,
      isEmergency: isEmergency || undefined,
      emergencyActionTaken: isEmergency
        ? formData.emergencyActionTaken
        : undefined,
      emergencyActionTakenAt: isEmergency
        ? formData.emergencyActionTakenAt
        : undefined,
      approvalPlan,
      selectedApprover: approvalPlan.find((s) => s.type === "generic")
        ?.approverId,
      approvals: [],
      aiRequest: isAIBuild ? formData.aiRequest : undefined,
      rollbackPlan: formData.rollbackPlan,
      supportingDocuments: formData.supportingDocuments,
      testPlan: "",
      testSteps: [],
      evidence: [],
      timeline: isEmergency
        ? [
            {
              stage: "Draft",
              actorName: currentUser?.name || "",
              actorId: currentUserId,
              action: "Created draft",
              timestamp: now,
            },
            {
              stage: "Approved",
              actorName: currentUser?.name || "",
              actorId: currentUserId,
              action: "Emergency action recorded — pending retroactive review",
              timestamp: now,
            },
          ]
        : [
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
    };

    dispatch(deleteChange(draftId));
    dispatch(addChange(changeRequest));

    message.success(
      isEmergency
        ? "Emergency change recorded for retroactive review"
        : "Change request submitted",
    );
    setIsSubmitModalOpen(false);
    navigate("/self/changes");
  };

  return (
    <form id="step-form" onSubmit={handleTriggerSubmit} className="space-y-6">
      {/* General Information Summary */}
      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="card-title">General Information</h3>
          {isEmergency && (
            <Tag color="#ef4444" format={false}>
              Emergency Change
            </Tag>
          )}
        </div>

        <div className="text-body-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryField
              label="System Affected"
              value={formData.systemAffected || "N/A (new system)"}
            />
            <SummaryField label="Category" value={formData.category} />
            <SummaryField label="Submitter" value={formData.submitterName} />
            <SummaryField
              label="Department"
              value={formData.submitterDepartment}
            />
            <SummaryField
              label="Requested Timeline"
              value={formData.requestedTimeline}
            />
          </div>

          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Title
            </span>
            <span className="text-primary-alpha text-body-md mt-1 block font-bold">
              "{formData.title}"
            </span>
          </div>

          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Description
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium">
              "{formData.description}"
            </span>
          </div>

          {isEmergency && (
            <div className="border-border-muted border-t pt-3">
              <SummaryField
                label="Emergency Action Taken"
                value={formData.emergencyActionTaken}
                full
              />
              <div className="mt-3">
                <SummaryField
                  label="Action Taken At"
                  value={
                    formData.emergencyActionTakenAt
                      ? new Date(
                          formData.emergencyActionTakenAt,
                        ).toLocaleString()
                      : ""
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Request Summary (conditional) */}
      {isAIBuild && (
        <div className="card space-y-4 p-6">
          <h3 className="card-title">AI Request Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryField
              label="Who Uses It"
              value={formData.aiRequest.whoUsesSoftware}
            />
            <SummaryField label="Duration" value={formData.aiRequest.duration} />
            <SummaryField
              label="Problem Complexity"
              value={formData.aiRequest.problemComplexity}
            />
            <SummaryField
              label="Staff Personal Data"
              value={formData.aiRequest.requiresStaffPersonalData}
            />
            <SummaryField
              label="Sensitive Data"
              value={formData.aiRequest.requiresSensitiveData}
            />
            <SummaryField
              label="Production Data"
              value={formData.aiRequest.usesProductionData}
            />
            <SummaryField
              label="Uses Default Stack"
              value={formData.aiRequest.usesDefaultStack}
            />
            <SummaryField
              label="Post-build Support"
              value={formData.aiRequest.postBuildSupport}
            />
            <SummaryField
              label="LLMs Considered"
              value={formData.aiRequest.llmChoices.join(", ")}
              full
            />
            <SummaryField
              label="Integrates With"
              value={
                formData.aiRequest.integratesWithSystems.length
                  ? formData.aiRequest.integratesWithSystems.join(", ")
                  : "None"
              }
              full
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
          </div>
        </div>
      )}

      {/* Risk & Justification Summary */}
      <div className="card space-y-4 p-6">
        <h3 className="card-title">Risk & Justification</h3>

        <div className="text-body-sm space-y-4">
          <div>
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Risk Level
            </span>
            <Tag color={riskColor} className="mt-1">
              {formData.riskLevel}
            </Tag>
          </div>

          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Risk Justification
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium">
              "{formData.riskJustification}"
            </span>
          </div>

          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Business Justification
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium">
              "{formData.businessJustification}"
            </span>
          </div>
        </div>
      </div>

      {/* Rollback Plan Summary (always present — rollback is mandatory) */}
      <div className="card space-y-4 p-6">
        <h3 className="card-title">Rollback Plan</h3>

        <div className="text-body-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryField
              label="Responsible Person"
              value={formData.rollbackPlan.responsiblePerson}
            />
            <SummaryField
              label="Estimated Time"
              value={formData.rollbackPlan.estimatedTime}
            />
          </div>

          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Rollback Steps
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium">
              "{formData.rollbackPlan.steps}"
            </span>
          </div>

          {formData.rollbackPlan.dependencies && (
            <div className="border-border-muted border-t pt-3">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Dependencies & Risks
              </span>
              <span className="text-fade mt-1 block leading-relaxed font-medium">
                "{formData.rollbackPlan.dependencies}"
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        title={
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              {isEmergency ? "Record Emergency Change" : "Submit Change Request"}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              {isEmergency
                ? "Confirm the emergency action record."
                : "Review the approval routing and confirm submission."}
            </p>
          </div>
        }
        open={isSubmitModalOpen}
        onCancel={() => setIsSubmitModalOpen(false)}
        okText={isEmergency ? "Confirm & Record" : "Confirm & Submit"}
        cancelText="Cancel"
        okButtonProps={{
          className:
            "bg-primary hover:bg-primary/90 text-white border-none! font-semibold",
        }}
        cancelButtonProps={{
          className: "border-border! text-primary-alpha! hover:bg-bg-muted!",
        }}
        bodyProps={{ className: "pb-4!" }}
        onOk={handleConfirmSubmit}
        width={550}
        centered
        destroyOnClose
      >
        <div className="text-primary-alpha space-y-5">
          {/* Routing explanation */}
          <div>
            <span className="text-fade-2 mb-2 block text-[10px] font-bold tracking-wider uppercase">
              Approval Routing
            </span>
            <div className="bg-bg-muted border-border-muted text-body-sm text-fade space-y-2 rounded-2xl border p-4 leading-relaxed font-medium">
              <div className="flex gap-2">
                {routingExplanation.icon}
                <span>{routingExplanation.text}</span>
              </div>
            </div>
          </div>

          {/* Approval Chain Timeline */}
          {!isEmergency && configuredStages.length > 0 && (
            <div className="relative ml-3 space-y-5 pl-6">
              {configuredStages.map((stage, idx) => {
                const isLast = idx === configuredStages.length - 1;
                const fieldError: FieldError | undefined =
                  submitAttempted && !approverSelections[stage.id]
                    ? { type: "required", message: "Select an approver" }
                    : undefined;

                return (
                  <div key={stage.id} className="relative">
                    {!isLast && (
                      <span className="border-border-muted absolute top-6.5 bottom-[-24px] -left-[23px] border-l-2" />
                    )}
                    <span className="dark:bg-bg border-primary absolute top-2 -left-[31px] flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 bg-white">
                      <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                    </span>

                    {stage.type === "role_based" ? (
                      <FormFieldShim
                        label={`Stage ${idx + 1}: ${stage.role}`}
                        error={fieldError}
                      >
                        <Select
                          value={approverSelections[stage.id] || undefined}
                          onChange={(value) =>
                            setApproverSelections((prev) => ({
                              ...prev,
                              [stage.id]: value,
                            }))
                          }
                          placeholder="Select an approver..."
                          className="h-11! w-full"
                          options={users
                            .filter(
                              (u) =>
                                stage.role && u.baseRoles.includes(stage.role),
                            )
                            .map((u) => ({
                              label: `${u.name} (${u.department})`,
                              value: u.id,
                            }))}
                          status={fieldError ? "error" : undefined}
                        />
                      </FormFieldShim>
                    ) : (
                      <FormFieldShim
                        label={`Stage ${idx + 1}: Requester Selects Approver`}
                        error={fieldError}
                      >
                        <Select
                          value={approverSelections[stage.id] || undefined}
                          onChange={(value) =>
                            setApproverSelections((prev) => ({
                              ...prev,
                              [stage.id]: value,
                            }))
                          }
                          placeholder="Select an approver..."
                          className="h-11! w-full"
                          options={approverOptions}
                          status={fieldError ? "error" : undefined}
                        />
                      </FormFieldShim>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </form>
  );
};

/* ── Helper Components ── */

const FormFieldShim: React.FC<{
  label: string;
  error?: FieldError;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="mb-0">
    <span className="text-fade-2 mb-1 block text-[11px] font-bold tracking-wider uppercase">
      {label}
    </span>
    {children}
    {error && <span className="text-error mt-1 block text-sm">{error.message}</span>}
  </div>
);

const SummaryField: React.FC<{
  label: string;
  value: string | undefined;
  full?: boolean;
}> = ({ label, value, full }) => (
  <div className={cn(full && "col-span-full")}>
    <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
      {label}
    </span>
    <span className="text-primary-alpha block whitespace-pre-wrap font-bold">
      {value || <span className="text-fade italic">Not provided</span>}
    </span>
  </div>
);

export default ReviewStep;
