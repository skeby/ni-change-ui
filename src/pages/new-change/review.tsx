import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select, Modal, message } from "antd";
import { ShieldAlert, CheckCircle } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../state/store";
import { addChange, deleteChange } from "../../state/slices/changes-slice";
import type {
  ChangeRequest,
  ResolvedApprovalStage,
} from "../../state/slices/changes-slice";
import { useWizard } from "./new-change-wizard";
import { cn } from "../../utils/cn";
import { Utils } from "../../utils";
import FormField from "../../components/ui/form-field";
import Tag from "../../components/ui/tag";
import type { FieldError } from "react-hook-form";

const ReviewStep: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { formData, draftId } = useWizard();
  const { changes } = useAppSelector((state) => state.changes);
  const { currentUserId, users } = useAppSelector((state) => state.auth);
  const riskLevels = useAppSelector((state) => state.settings.riskLevels);
  const currentUser = users.find((u) => u.id === currentUserId);

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

  // Approval stages configured for this change's risk level
  const configuredStages = useMemo(
    () =>
      riskLevels.find((r) => r.name === formData.riskLevel)?.approvalStages ??
      [],
    [riskLevels, formData.riskLevel],
  );

  const routingExplanation = useMemo(() => {
    if (configuredStages.length === 0) {
      return {
        icon: (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        ),
        text: `No approval stages are configured for ${formData.riskLevel} risk changes yet. Contact an admin to configure this under Settings → Risk Levels before submitting.`,
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
  }, [configuredStages, formData.riskLevel, isLowestSeverity]);

  const handleTriggerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(false);
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    const missingApprover = configuredStages.some(
      (s) => s.type === "generic" && !approverSelections[s.id],
    );
    if (missingApprover) {
      setSubmitAttempted(true);
      message.error("Select an approver for each requester-selected stage.");
      return;
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
      approverId: s.type === "generic" ? approverSelections[s.id] : undefined,
    }));

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
      riskOverrideJustification:
        formData.riskOverrideJustification || undefined,
      autoAssignedRisk: formData.autoAssignedRisk,
      approvalPlan,
      selectedApprover: approvalPlan.find((s) => s.type === "generic")
        ?.approverId,
      approvals: [],
      aiRequest: formData.category === "AI" ? formData.aiRequest : undefined,
      rollbackPlan: formData.rollbackPlan.steps
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
    };

    dispatch(deleteChange(draftId));
    dispatch(addChange(changeRequest));

    message.success("Change request submitted");
    setIsSubmitModalOpen(false);
    navigate("/self/changes");
  };

  return (
    <form id="step-form" onSubmit={handleTriggerSubmit} className="space-y-6">
      {/* General Information Summary */}
      <div className="card space-y-4 p-6">
        <h3 className="card-title">General Information</h3>

        <div className="text-body-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryField
              label="System Affected"
              value={formData.systemAffected}
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
        </div>
      </div>

      {/* AI Request Summary (conditional) */}
      {formData.category === "AI" && (
        <div className="card space-y-4 p-6">
          <h3 className="card-title">AI Request Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <h3 className="card-title">Risk & Justification</h3>

        <div className="text-body-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Risk Level
              </span>
              <Tag color={riskColor} className="mt-1">
                {formData.riskLevel}
                {formData.riskOverridden && " (overridden)"}
              </Tag>
            </div>
            {formData.riskOverridden && (
              <SummaryField
                label="Override Justification"
                value={formData.riskOverrideJustification}
              />
            )}
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

      {/* Rollback Plan Summary */}
      {formData.rollbackPlan.steps && (
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

            <div className="border-border-muted border-t pt-3">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Dependencies & Risks
              </span>
              <span className="text-fade mt-1 block leading-relaxed font-medium">
                "{formData.rollbackPlan.dependencies}"
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        title={
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              Submit Change Request
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Review the approval routing and confirm submission.
            </p>
          </div>
        }
        open={isSubmitModalOpen}
        onCancel={() => setIsSubmitModalOpen(false)}
        okText="Confirm & Submit"
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
          {configuredStages.length > 0 && (
            <div className="relative ml-3 space-y-5 pl-6">
              {configuredStages.map((stage, idx) => {
                const isLast = idx === configuredStages.length - 1;
                const fieldError: FieldError | undefined =
                  submitAttempted &&
                  stage.type === "generic" &&
                  !approverSelections[stage.id]
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
                      <FormField
                        label={`Stage ${idx + 1}: ${stage.role}`}
                        rootClassName="mb-0!"
                      >
                        <Input
                          value={stage.role}
                          readOnly
                          className="h-11! w-full"
                        />
                      </FormField>
                    ) : (
                      <FormField
                        label={`Stage ${idx + 1}: Requester Selects Approver`}
                        error={fieldError}
                        rootClassName="mb-0!"
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
                      </FormField>
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
