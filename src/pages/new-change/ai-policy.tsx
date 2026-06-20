import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, message } from "antd";
import { ShieldCheck } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../state/store";
import { addChange, deleteChange } from "../../state/slices/changes-slice";
import type { ChangeRequest } from "../../state/slices/changes-slice";
import { useWizard } from "./new-change-wizard";

const AIPolicyStep: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { formData, draftId, isSelfCertify } = useWizard();
  const { changes } = useAppSelector((state) => state.changes);
  const { currentUserId, users } = useAppSelector((state) => state.auth);
  const riskLevels = useAppSelector((state) => state.settings.riskLevels);
  const currentUser = users.find((u) => u.id === currentUserId);

  const [agreed, setAgreed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const lowestRisk =
    [...riskLevels].sort((a, b) => a.severity - b.severity)[0]?.name || "Low";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSelfCertify) {
      // Conditions changed since arriving here — send back to the risk path.
      navigate(`/self/changes/new/risk?draftId=${draftId}`);
      return;
    }
    if (!agreed) {
      setAttempted(true);
      message.error("You must acknowledge the AI usage policy to submit.");
      return;
    }

    const now = new Date().toISOString();
    const submittedCount = changes.filter(
      (c) => !c.id.startsWith("DRAFT"),
    ).length;
    const newId = `CR-${new Date().getFullYear()}-${String(submittedCount + 1).padStart(4, "0")}`;

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
      status: "Approved",
      riskLevel: lowestRisk,
      riskJustification:
        "Self-certified internal AI build — no staff personal or company-sensitive data involved.",
      approvalPlan: [],
      approvals: [],
      aiRequest: formData.aiRequest,
      supportingDocuments: formData.supportingDocuments,
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
          stage: "Approved",
          actorName: currentUser?.name || "",
          actorId: currentUserId,
          action: "Self-certified via AI policy acknowledgment",
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

    message.success("AI request self-certified and submitted");
    navigate("/self/changes");
  };

  return (
    <form id="step-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="card-title mb-1">AI Policy Acknowledgment</h3>
            <p className="card-description">
              Because this is an internal-only AI build that does not use staff
              personal data or company-sensitive data, it can be self-certified
              against the Company AI Usage Policy — no approval chain required.
            </p>
          </div>
        </div>

        {/* TODO: replace with the real Company AI Usage Policy text from legal/compliance */}
        <div className="bg-bg-muted border-border-muted text-body-sm text-fade max-h-72 space-y-3 overflow-y-auto rounded-2xl border p-5 leading-relaxed font-medium">
          <p className="text-primary-alpha font-bold">Company AI Usage Policy</p>
          <p>
            <span className="italic">
              [Placeholder — replace with the organization's approved AI usage
              policy text.]
            </span>
          </p>
          <p>
            1. AI tools must only be used for legitimate business purposes
            consistent with company values and applicable law.
          </p>
          <p>
            2. Do not input staff personal data, customer data, or
            company-confidential information into AI tools that have not been
            approved for such use.
          </p>
          <p>
            3. Outputs from AI tools must be reviewed by a human before being
            relied upon for decisions, communications, or published material.
          </p>
          <p>
            4. Usage must respect intellectual-property, privacy, and security
            obligations, and follow the organization's data-handling standards.
          </p>
          <p>
            5. Report any incident, misuse, or unexpected behavior to the
            security team promptly.
          </p>
        </div>

        <Checkbox
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className={attempted && !agreed ? "ring-1 ring-red-400 rounded" : ""}
        >
          <span className="text-body-sm text-primary-alpha font-medium">
            I have read and agree to comply with the Company AI Usage Policy.
          </span>
        </Checkbox>
        {attempted && !agreed && (
          <span className="text-error block text-sm">
            Acknowledgment is required to submit.
          </span>
        )}
      </div>
    </form>
  );
};

export default AIPolicyStep;
