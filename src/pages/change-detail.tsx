import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../state/store";
import {
  updateChange,
  addTimelineEvent,
  addApproval,
  updateTestStep,
  addEvidence,
  type ChangeStatus,
  type RiskLevel,
  type ChangeCategory,
  type TestStep,
} from "../state/slices/changes-slice";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Radio,
  Modal,
  Checkbox,
  InputNumber,
  Empty,
  Tooltip,
  message,
  type TableProps,
} from "antd";
import { Collapse } from "../components/ui/collapse";
import Tag from "../components/ui/tag";
import { DataTable } from "../components/ui/data-table";
import dayjs from "dayjs";
import { cn } from "../utils/cn";
import { Utils } from "../utils";
import {
  FaArrowLeft,
  FaClockRotateLeft,
  FaFlask,
  FaRocket,
  FaRotateLeft,
  FaCircleInfo,
  FaCheck,
  FaXmark,
  FaUpload,
  FaFile,
  FaPenToSquare,
  FaFloppyDisk,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";
import Label from "../components/ui/label";
import { FORM } from "../static";

const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Status + Risk badge helpers
// ---------------------------------------------------------------------------

const StatusTag: React.FC<{ status: ChangeStatus }> = ({ status }) => (
  <Tag value={status} format={false}>
    {status}
  </Tag>
);

const RiskTag: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const { riskLevels } = useAppSelector((state) => state.settings);
  return (
    <Tag color={Utils.resolveRiskColor(riskLevels, level)}>{level} Risk</Tag>
  );
};

const SummaryField: React.FC<{
  label: string;
  value?: string;
  full?: boolean;
}> = ({ label, value, full }) => (
  <div className={cn(full && "col-span-full")}>
    <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
      {label}
    </span>
    <span className="text-primary-alpha mt-1 block whitespace-pre-wrap font-bold">
      {value || <span className="text-fade italic">Not provided</span>}
    </span>
  </div>
);

export const ChangeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { changes } = useAppSelector((state) => state.changes);
  const { currentUserId, users, activeRoles } = useAppSelector(
    (state) => state.auth,
  );
  const settings = useAppSelector((state) => state.settings);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const change = useMemo(() => changes.find((c) => c.id === id), [changes, id]);

  // ---- Collapsible sections state ----
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    overview: false,
    testing: false,
    deployment: false,
    rollback: false,
    workflow: true,
  });

  const isAllExpanded = useMemo(() => {
    return Object.values(expanded).every((val) => val);
  }, [expanded]);

  const expandAll = () => {
    setExpanded({
      overview: true,
      testing: true,
      deployment: true,
      rollback: true,
      workflow: true,
    });
  };

  const collapseAll = () => {
    setExpanded({
      overview: false,
      testing: false,
      deployment: false,
      rollback: false,
      workflow: false,
    });
  };

  // ---- Approver action modal state ----
  const [approverAction, setApproverAction] = useState<
    "approve" | "query" | "decline" | null
  >(null);
  const [actionComment, setActionComment] = useState("");
  const [actionError, setActionError] = useState("");
  const [handledInHouse, setHandledInHouse] = useState(true);
  const [costInvolved, setCostInvolved] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  // ---- Testing state ----
  const [testPlanDraft, setTestPlanDraft] = useState("");
  const [testNotes, setTestNotes] = useState<Record<string, string>>({});

  // ---- Deployment state ----
  const [deployNotes, setDeployNotes] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "confirmed" | "issues_found"
  >("confirmed");

  // ---- Rollback state ----
  const [rollbackSteps, setRollbackSteps] = useState("");
  const [rollbackPerson, setRollbackPerson] = useState("");
  const [rollbackTime, setRollbackTime] = useState("");
  const [rollbackDeps, setRollbackDeps] = useState("");

  // ---- Edit mode state ----
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSystemAffected, setEditSystemAffected] = useState("");
  const [editCategory, setEditCategory] = useState<ChangeCategory | "">("");
  const [editBusinessJustification, setEditBusinessJustification] =
    useState("");
  const [editRequestedTimeline, setEditRequestedTimeline] = useState("");

  // Sync local state when change loads
  React.useEffect(() => {
    if (change) {
      setTestPlanDraft(change.testPlan || "");
      if (change.rollbackPlan) {
        setRollbackSteps(change.rollbackPlan.steps);
        setRollbackPerson(change.rollbackPlan.responsiblePerson);
        setRollbackTime(change.rollbackPlan.estimatedTime);
        setRollbackDeps(change.rollbackPlan.dependencies);
      }
    }
  }, [change?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived permissions
  const isApprover =
    activeRoles.includes("Approver") || activeRoles.includes("Admin");
  const isTester = activeRoles.includes("Tester");
  const isAdmin = activeRoles.includes("Admin");
  const canApprove =
    isApprover &&
    change &&
    ["Under Review", "Submitted"].includes(change.status);
  const canTest = isTester && change?.status === "In Testing";
  const canDeploy =
    change &&
    ["Testing Complete", "Awaiting Deployment"].includes(change.status);
  const isDeployed = !!change?.deployment;
  const isSubmitter = change?.submitterId === currentUserId;
  const canEdit =
    !!change &&
    (isAdmin ||
      (isSubmitter && ["Submitted", "Under Review"].includes(change.status)));

  // Test checklist from settings
  const testChecklist = useMemo(() => {
    if (!change) return null;
    return settings.testChecklists.find(
      (tc) => tc.category === change.category,
    );
  }, [change, settings.testChecklists]);

  const testStepColumns = useMemo<TableProps<TestStep>["columns"]>(
    () => [
      {
        title: "Test Step / Description",
        key: "description",
        render: (_, record) => (
          <div className="space-y-1">
            <span className="text-primary-alpha text-sm font-bold block">
              {record.description}
            </span>
            <span className="text-fade-2 text-xs block font-medium">
              Expected: {record.expectedOutcome}
            </span>
            {record.completedBy && (
              <span className="text-fade-2 text-[10px] block font-medium mt-1">
                Completed by{" "}
                {users.find((u) => u.id === record.completedBy)?.name ||
                  record.completedBy}
                {record.completedAt && (
                  <>
                    {" "}
                    on{" "}
                    {dayjs(record.completedAt).format("MMM D, YYYY h:mm A")}
                  </>
                )}
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "result",
        key: "result",
        width: 120,
        render: (val: string) => (
          <Tag value={val} format={true}>
            {val}
          </Tag>
        ),
      },
      {
        title: "Action / Notes",
        key: "action",
        render: (_, record) => {
          if (canTest) {
            return (
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  type={record.result === "pass" ? "primary" : "default"}
                  className={
                    record.result === "pass"
                      ? "!bg-emerald-600! !border-emerald-600!"
                      : ""
                  }
                  onClick={() => handleTestStepToggle(record.id, "pass")}
                >
                  <FaCheck className="mr-1 h-3 w-3" />
                  Pass
                </Button>
                <Button
                  size="small"
                  danger
                  type={record.result === "fail" ? "primary" : "default"}
                  onClick={() => handleTestStepToggle(record.id, "fail")}
                >
                  <FaXmark className="mr-1 h-3 w-3" />
                  Fail
                </Button>
                <Input
                  size="small"
                  placeholder="Notes..."
                  value={testNotes[record.id] ?? record.notes}
                  onChange={(e) =>
                    setTestNotes((prev) => ({
                      ...prev,
                      [record.id]: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    dispatch(
                      updateTestStep({
                        changeId: change?.id || "",
                        stepId: record.id,
                        updates: {
                          notes: testNotes[record.id] ?? record.notes,
                        },
                      })
                    );
                  }}
                  className="flex-1 min-w-[120px]"
                />
              </div>
            );
          }
          return record.notes ? (
            <span className="text-fade text-xs italic">"{record.notes}"</span>
          ) : (
            <span className="text-fade-2 text-xs italic">No notes</span>
          );
        },
      },
    ],
    [canTest, testNotes, change?.id, users, dispatch]
  );

  // -----------------------------------------------------------------------
  // Not found
  // -----------------------------------------------------------------------

  if (!change) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Empty description="Change request not found" />
        <Button type="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Action handlers
  // -----------------------------------------------------------------------

  const handleSubmitAction = (action: "approve" | "query" | "decline") => {
    setActionError("");
    if (action !== "approve" && !actionComment.trim()) {
      setActionError("A comment or description is required for this action.");
      return;
    }

    const approvalAction: "approved" | "rejected" | "info_requested" =
      action === "approve"
        ? "approved"
        : action === "decline"
          ? "rejected"
          : "info_requested";

    const approval = {
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: approvalAction,
      timestamp: new Date().toISOString(),
      comment: actionComment || undefined,
      handledInHouse:
        action === "approve" && isAdmin ? handledInHouse : undefined,
      costInvolved: action === "approve" && isAdmin ? costInvolved : undefined,
      estimatedCost:
        action === "approve" && isAdmin && costInvolved
          ? estimatedCost
          : undefined,
    };

    dispatch(addApproval({ id: change.id, approval }));

    const newStatus: ChangeStatus =
      approvalAction === "approved"
        ? "Approved"
        : approvalAction === "rejected"
          ? "Rejected"
          : change.status;

    if (approvalAction !== "info_requested") {
      dispatch(updateChange({ id: change.id, updates: { status: newStatus } }));
    } else {
      dispatch(
        updateChange({
          id: change.id,
          updates: { isQueried: true, queryComment: actionComment },
        }),
      );
    }

    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: newStatus,
          actorName: currentUser.name,
          actorId: currentUser.id,
          action:
            approvalAction === "approved"
              ? "Approved"
              : approvalAction === "rejected"
                ? "Rejected"
                : "Requested more information",
          timestamp: new Date().toISOString(),
          comment: actionComment || undefined,
          handledInHouse: approval.handledInHouse,
          costInvolved: approval.costInvolved,
          estimatedCost: approval.estimatedCost,
        },
      }),
    );

    setActionComment("");
    setCostInvolved(false);
    setEstimatedCost(0);
    setApproverAction(null);
  };

  const handleTestStepToggle = (stepId: string, result: "pass" | "fail") => {
    dispatch(
      updateTestStep({
        changeId: change.id,
        stepId,
        updates: {
          result,
          completedBy: currentUser.id,
          completedAt: new Date().toISOString(),
          notes: testNotes[stepId] || "",
        },
      }),
    );
  };

  const handleSaveTestPlan = () => {
    dispatch(
      updateChange({ id: change.id, updates: { testPlan: testPlanDraft } }),
    );
  };

  const handleAutoGenerateTests = () => {
    if (!testChecklist) return;
    const newSteps: TestStep[] = testChecklist.items.map((item, idx) => ({
      id: `ts-gen-${Date.now()}-${idx}`,
      description: item,
      expectedOutcome: "Passes successfully",
      result: "pending" as const,
      notes: "",
    }));
    dispatch(
      updateChange({
        id: change.id,
        updates: { testSteps: [...change.testSteps, ...newSteps] },
      }),
    );
    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: change.status,
          actorName: currentUser.name,
          actorId: currentUser.id,
          action: `Auto-generated ${newSteps.length} test steps from ${change.category} checklist`,
          timestamp: new Date().toISOString(),
        },
      }),
    );
  };

  const handleMarkTestingComplete = () => {
    dispatch(
      updateChange({ id: change.id, updates: { status: "Testing Complete" } }),
    );
    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: "Testing Complete",
          actorName: currentUser.name,
          actorId: currentUser.id,
          action: "All tests passed — testing marked complete",
          timestamp: new Date().toISOString(),
        },
      }),
    );
  };

  const handleUploadEvidence = () => {
    const mockFile = {
      id: `ev-${Date.now()}`,
      name: `evidence-${Date.now()}.png`,
      type: "image/png",
      size: Math.floor(Math.random() * 500000) + 50000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id,
    };
    dispatch(addEvidence({ changeId: change.id, evidence: mockFile }));
  };

  const handleDeploy = () => {
    dispatch(
      updateChange({
        id: change.id,
        updates: {
          status: "Deployed",
          deployment: {
            deployedBy: currentUser.name,
            deployedAt: new Date().toISOString(),
            notes: deployNotes,
            verificationStatus: "pending",
          },
        },
      }),
    );
    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: "Deployed",
          actorName: currentUser.name,
          actorId: currentUser.id,
          action: "Deployed to production",
          timestamp: new Date().toISOString(),
          comment: deployNotes || undefined,
        },
      }),
    );
  };

  const handlePostDeployVerification = () => {
    if (!change.deployment) return;
    dispatch(
      updateChange({
        id: change.id,
        updates: {
          deployment: { ...change.deployment, verificationStatus },
          status:
            verificationStatus === "confirmed"
              ? "Post-Deployment Review"
              : "Deployed",
        },
      }),
    );
    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: "Post-Deployment Review",
          actorName: currentUser.name,
          actorId: currentUser.id,
          action:
            verificationStatus === "confirmed"
              ? "Verification Passed"
              : "Verification Failed",
          timestamp: new Date().toISOString(),
        },
      }),
    );
  };

  const handleSignOff = () => {
    if (!change.deployment) return;
    dispatch(
      updateChange({
        id: change.id,
        updates: {
          status: "Closed",
          deployment: {
            ...change.deployment,
            signedOffBy: currentUser.name,
            signedOffAt: new Date().toISOString(),
          },
        },
      }),
    );
    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: "Closed",
          actorName: currentUser.name,
          actorId: currentUser.id,
          action: "Signed off — change closed",
          timestamp: new Date().toISOString(),
        },
      }),
    );
  };

  const handleSaveRollbackPlan = () => {
    dispatch(
      updateChange({
        id: change.id,
        updates: {
          rollbackPlan: {
            steps: rollbackSteps,
            responsiblePerson: rollbackPerson,
            estimatedTime: rollbackTime,
            dependencies: rollbackDeps,
          },
        },
      }),
    );
  };

  const handleExecuteRollback = () => {
    Modal.confirm({
      title: "Execute Rollback",
      content:
        "Are you sure you want to roll back this deployment? This action will change the status to Rolled Back.",
      okText: "Yes, Roll Back",
      okButtonProps: { danger: true },
      onOk: () => {
        dispatch(
          updateChange({ id: change.id, updates: { status: "Rolled Back" } }),
        );
        dispatch(
          addTimelineEvent({
            id: change.id,
            event: {
              stage: "Rolled Back",
              actorName: currentUser.name,
              actorId: currentUser.id,
              action: "Rollback executed",
              timestamp: new Date().toISOString(),
            },
          }),
        );
      },
    });
  };

  const startEditing = () => {
    setEditTitle(change.title);
    setEditDescription(change.description);
    setEditSystemAffected(change.systemAffected);
    setEditCategory(change.category);
    setEditBusinessJustification(change.businessJustification);
    setEditRequestedTimeline(change.requestedTimeline);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (
      !editTitle.trim() ||
      !editDescription.trim() ||
      !editSystemAffected ||
      !editCategory ||
      !editBusinessJustification.trim() ||
      !editRequestedTimeline
    ) {
      message.error("Please fill in all fields before saving.");
      return;
    }

    const categoryChanged = editCategory !== change.category;
    const autoAssignedRisk = categoryChanged
      ? settings.categories.find((c) => c.name === editCategory)
          ?.defaultRisk || change.autoAssignedRisk
      : change.autoAssignedRisk;

    dispatch(
      updateChange({
        id: change.id,
        updates: {
          title: editTitle.trim(),
          description: editDescription.trim(),
          systemAffected: editSystemAffected,
          category: editCategory as ChangeCategory,
          businessJustification: editBusinessJustification.trim(),
          requestedTimeline: editRequestedTimeline,
          autoAssignedRisk,
          riskLevel: change.riskOverridden ? change.riskLevel : autoAssignedRisk,
        },
      }),
    );
    dispatch(
      addTimelineEvent({
        id: change.id,
        event: {
          stage: change.status,
          actorName: currentUser.name,
          actorId: currentUser.id,
          action: "Updated request details",
          timestamp: new Date().toISOString(),
        },
      }),
    );
    setIsEditing(false);
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getEventColor = (action: string) => {
    const a = action.toLowerCase();
    if (
      a.includes("reject") ||
      a.includes("rollback") ||
      a.includes("issues found") ||
      a.includes("fail")
    )
      return "#ef4444"; // red-500
    if (a.includes("request") || a.includes("quer")) return "#f59e0b"; // amber-500
    if (
      a.includes("approved") ||
      a.includes("submitted") ||
      a.includes("created") ||
      a.includes("deployed") ||
      a.includes("signed off") ||
      a.includes("passed") ||
      a.includes("complete") ||
      a.includes("confirmed")
    )
      return "#10b981"; // emerald-500
    return "#94a3b8"; // slate-400
  };

  // -----------------------------------------------------------------------
  // TAB: Overview
  // -----------------------------------------------------------------------

  const rollbackEditable = !isDeployed;

  const allTestsDecided =
    change.testSteps.length > 0 &&
    change.testSteps.every((s) => s.result !== "pending");

  const renderOverview = () => (
    <div className="space-y-6 pt-2">
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Update invoice approval workflow in NetSuite"
              className={FORM.CLASS_NAME}
            />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe the change in detail..."
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>System Affected</Label>
              <Select
                showSearch={{ optionFilterProp: "label" }}
                value={editSystemAffected || undefined}
                onChange={(value) => setEditSystemAffected(value)}
                placeholder="Select system..."
                className={FORM.CLASS_NAME}
                options={settings.systems
                  .filter((s) => s.active)
                  .map((s) => ({ label: s.name, value: s.name }))}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                showSearch={{ optionFilterProp: "label" }}
                value={editCategory || undefined}
                onChange={(value) => setEditCategory(value)}
                placeholder="Select category..."
                className={FORM.CLASS_NAME}
                options={settings.categories
                  .filter((c) => c.active)
                  .map((c) => ({ label: c.name, value: c.name }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Requested Timeline</Label>
              <DatePicker
                value={
                  editRequestedTimeline ? dayjs(editRequestedTimeline) : null
                }
                onChange={(date) =>
                  setEditRequestedTimeline(
                    date ? date.format("YYYY-MM-DD") : "",
                  )
                }
                className={cn(FORM.CLASS_NAME, "w-full!")}
                placeholder="Select target date..."
                format="YYYY-MM-DD"
              />
            </div>
          </div>
          <div>
            <Label>Business Justification</Label>
            <TextArea
              rows={3}
              value={editBusinessJustification}
              onChange={(e) => setEditBusinessJustification(e.target.value)}
              placeholder="Why is this change needed?"
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Details grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryField label="System" value={change.systemAffected} />
            <SummaryField label="Category" value={change.category} />
            <div>
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Risk Level
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <RiskTag level={change.riskLevel} />
                {change.riskOverridden && (
                  <Tooltip
                    title={
                      change.riskOverrideJustification ||
                      "Risk was manually overridden"
                    }
                  >
                    <Tag color="#f59e0b">Overridden</Tag>
                  </Tooltip>
                )}
              </div>
            </div>
            <SummaryField label="Submitter" value={change.submitterName} />
            <SummaryField
              label="Department"
              value={change.submitterDepartment}
            />
            <SummaryField
              label="Requested Timeline"
              value={dayjs(change.requestedTimeline).format("MMM D, YYYY")}
            />
            <SummaryField
              label="Created"
              value={dayjs(change.createdAt).format("MMM D, YYYY h:mm A")}
            />
            <SummaryField
              label="Last Updated"
              value={dayjs(change.updatedAt).format("MMM D, YYYY h:mm A")}
            />
          </div>

          {/* Approval Chain */}
          {(change.approvalPlan?.length || change.selectedApprover) && (
            <div className="border-border-muted space-y-3 border-t pt-3">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Approval Chain
              </span>
              {change.approvalPlan?.length ? (
                <div className="space-y-3">
                  {change.approvalPlan.map((stage, idx) => (
                    <div key={stage.id} className="flex items-center gap-3">
                      <span className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      {stage.type === "role_based" ? (
                        <span className="text-primary-alpha text-sm font-semibold">
                          {stage.role}
                        </span>
                      ) : (
                        <span className="text-primary-alpha text-sm font-semibold">
                          {users.find((u) => u.id === stage.approverId)
                            ?.name ||
                            stage.approverId ||
                            "Requester-selected approver"}
                          <span className="text-fade-2 ml-1.5 text-xs font-medium">
                            (selected by requester)
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-primary-alpha text-sm font-semibold">
                  {users.find((u) => u.id === change.selectedApprover)
                    ?.name || change.selectedApprover}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Description
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium whitespace-pre-wrap">
              {change.description}
            </span>
          </div>

          {/* Business Justification */}
          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Business Justification
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium whitespace-pre-wrap">
              {change.businessJustification}
            </span>
          </div>

          {/* AI Request Data */}
          {change.aiRequest && (
            <div className="border-border-muted space-y-3 border-t pt-4">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                AI Request Data
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryField
                  label="Frequency"
                  value={change.aiRequest.frequency}
                />
                <SummaryField
                  label="Rule Engine"
                  value={change.aiRequest.ruleEngine}
                />
                <SummaryField label="AI/ML" value={change.aiRequest.aiMl} />
                <SummaryField
                  label="Human Review"
                  value={change.aiRequest.human}
                />
                <SummaryField
                  label="Statistical Modeling"
                  value={change.aiRequest.statisticalModeling}
                />
                <SummaryField
                  label="Problem Complexity"
                  value={change.aiRequest.problemComplexity}
                />
                <SummaryField
                  label="Problem Description"
                  value={change.aiRequest.problemDescription}
                  full
                />
                <SummaryField
                  label="Current Solution"
                  value={change.aiRequest.currentSolution}
                  full
                />
                <SummaryField
                  label="Success Metrics"
                  value={change.aiRequest.successMetrics}
                  full
                />
                <SummaryField
                  label="Simpler Alternative"
                  value={change.aiRequest.simplerAlternative}
                />
                <SummaryField
                  label="Global Use"
                  value={change.aiRequest.globalUse}
                />
                <SummaryField
                  label="Requires Staff Data"
                  value={change.aiRequest.requiresStaffData}
                />
                <SummaryField
                  label="Requires Sensitive Data"
                  value={change.aiRequest.requiresSensitiveData}
                />
                <SummaryField
                  label="External Users"
                  value={change.aiRequest.externalUsers}
                />
                <SummaryField
                  label="Internal Only"
                  value={change.aiRequest.internalOnly}
                />
                <SummaryField
                  label="Both Users"
                  value={change.aiRequest.bothUsers}
                />
                <SummaryField
                  label="Duration"
                  value={change.aiRequest.duration}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderTesting = () => (
    <div className="space-y-6 pt-2">
      {/* Test Plan */}
      <div className="space-y-2">
        <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
          Test Plan
        </span>
        <TextArea
          rows={4}
          value={testPlanDraft}
          onChange={(e) => setTestPlanDraft(e.target.value)}
          placeholder="Describe the test plan for this change..."
          disabled={!canTest}
          className={FORM.TEXTAREA_CLASS_NAME}
        />
        {canTest && (
          <div className="mt-3 flex gap-2">
            <Button type="primary" size="small" onClick={handleSaveTestPlan}>
              Save Test Plan
            </Button>
            {testChecklist && change.testSteps.length === 0 && (
              <Button size="small" onClick={handleAutoGenerateTests}>
                Auto-generate Checklist ({testChecklist.items.length} items)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Test Steps */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
          Test Checklist
        </span>
        {change.testSteps.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-fade-2 mb-3 text-sm italic">
              No test steps defined yet.
            </p>
            {canTest && testChecklist && (
              <Button onClick={handleAutoGenerateTests}>
                Generate from {change.category} Template
              </Button>
            )}
          </div>
        ) : (
          <div className="border-border overflow-hidden rounded-2xl border">
            <DataTable
              dataSource={change.testSteps as any}
              columns={testStepColumns as any}
              pagination={false}
              cardClassName="shadow-none! border-none! rounded-none! bg-transparent!"
            />
          </div>
        )}

        {canTest && allTestsDecided && (
          <div className="mt-4">
            <Button type="primary" onClick={handleMarkTestingComplete}>
              <FaCheck className="mr-1.5 h-3 w-3" />
              Mark Testing Complete
            </Button>
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
            Evidence Uploads
          </span>
          {canTest && (
            <Button size="small" onClick={handleUploadEvidence}>
              <FaUpload className="mr-1.5 h-3 w-3" />
              Upload Evidence
            </Button>
          )}
        </div>
        {change.evidence.length === 0 ? (
          <p className="text-fade-2 text-sm italic">
            No evidence files uploaded.
          </p>
        ) : (
          <div className="space-y-2">
            {change.evidence.map((ev) => (
              <div
                key={ev.id}
                className="bg-secondary flex items-center gap-3 rounded-lg border p-3"
              >
                <FaFile className="text-fade-2 h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-primary-alpha truncate text-sm font-medium">
                    {ev.name}
                  </p>
                  <p className="text-fade-2 text-xs">
                    {ev.type} &middot; {formatBytes(ev.size)} &middot; Uploaded{" "}
                    {dayjs(ev.uploadedAt).format("MMM D, YYYY h:mm A")} by{" "}
                    {users.find((u) => u.id === ev.uploadedBy)?.name ||
                      ev.uploadedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDeployment = () => (
    <div className="space-y-6 pt-2">
      {!isDeployed && canDeploy && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryField label="Deployed By" value={currentUser.name} />
            <SummaryField
              label="Date/Time"
              value={dayjs().format("MMM D, YYYY h:mm A")}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
              Deployment Notes
            </span>
            <TextArea
              rows={3}
              value={deployNotes}
              onChange={(e) => setDeployNotes(e.target.value)}
              placeholder="Describe what was deployed and any relevant details..."
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>

          <Button type="primary" onClick={handleDeploy}>
            <FaRocket className="mr-1.5 h-3 w-3" />
            Deploy
          </Button>
        </div>
      )}

      {!isDeployed && !canDeploy && (
        <Empty
          description={`Deployment is not available in the current status (${change.status}).`}
        />
      )}

      {isDeployed && change.deployment && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryField
              label="Deployed By"
              value={change.deployment.deployedBy}
            />
            <SummaryField
              label="Deployed At"
              value={dayjs(change.deployment.deployedAt).format(
                "MMM D, YYYY h:mm A",
              )}
            />
            <SummaryField
              label="Notes"
              value={change.deployment.notes || "No notes"}
              full
            />
            <div>
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Verification
              </span>
              <div className="mt-1">
                {change.deployment.verificationStatus === "pending" && (
                  <Tag value="pending">Pending</Tag>
                )}
                {change.deployment.verificationStatus === "confirmed" && (
                  <Tag value="approved">Confirmed Working</Tag>
                )}
                {change.deployment.verificationStatus === "issues_found" && (
                  <Tag value="rejected">Issues Found</Tag>
                )}
              </div>
            </div>
            {change.deployment.signedOffBy && (
              <SummaryField
                label="Signed Off By"
                value={`${change.deployment.signedOffBy} on ${dayjs(
                  change.deployment.signedOffAt,
                ).format("MMM D, YYYY h:mm A")}`}
              />
            )}
          </div>

          {/* Post-deployment verification */}
          {change.deployment.verificationStatus === "pending" && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
                Post-Deployment Verification
              </span>
              <div>
                <Label>Verification Result</Label>
                <Radio.Group
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  className="flex gap-4 mt-1"
                >
                  <Radio value="confirmed">Confirmed Working</Radio>
                  <Radio value="issues_found">Issues Found</Radio>
                </Radio.Group>
              </div>
              <Button type="primary" onClick={handlePostDeployVerification}>
                Submit Verification
              </Button>
            </div>
          )}

          {/* Sign-off */}
          {change.deployment.verificationStatus === "confirmed" &&
            !change.deployment.signedOffBy && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
                  Sign-Off
                </span>
                <p className="text-fade-2 text-sm">
                  Deployment has been verified as working. Submit your sign-off
                  to close this change request.
                </p>
                <Button type="primary" onClick={handleSignOff}>
                  <FaCheck className="mr-1.5 h-3 w-3" />
                  Sign Off and Close
                </Button>
              </div>
            )}
        </div>
      )}
    </div>
  );

  const renderRollback = () => (
    <div className="space-y-6 pt-2">
      {rollbackEditable ? (
        <div className="space-y-4">
          <div>
            <Label>Rollback Steps</Label>
            <TextArea
              rows={4}
              value={rollbackSteps}
              onChange={(e) => setRollbackSteps(e.target.value)}
              placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Responsible Person</Label>
              <Input
                value={rollbackPerson}
                onChange={(e) => setRollbackPerson(e.target.value)}
                placeholder="Who will execute the rollback?"
                className={FORM.CLASS_NAME}
              />
            </div>
            <div>
              <Label>Estimated Time</Label>
              <Input
                value={rollbackTime}
                onChange={(e) => setRollbackTime(e.target.value)}
                placeholder="e.g. 30 minutes, 2 hours"
                className={FORM.CLASS_NAME}
              />
            </div>
          </div>
          <div>
            <Label>Dependencies</Label>
            <TextArea
              rows={2}
              value={rollbackDeps}
              onChange={(e) => setRollbackDeps(e.target.value)}
              placeholder="Any dependencies for rollback (backups, third-party services, etc.)"
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>
          <Button type="primary" onClick={handleSaveRollbackPlan}>
            Save Rollback Plan
          </Button>
        </div>
      ) : change.rollbackPlan ? (
        <div className="space-y-4">
          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Steps
            </span>
            <span className="text-fade mt-1 block whitespace-pre-wrap leading-relaxed font-medium">
              {change.rollbackPlan.steps}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryField
              label="Responsible Person"
              value={change.rollbackPlan.responsiblePerson}
            />
            <SummaryField
              label="Estimated Time"
              value={change.rollbackPlan.estimatedTime}
            />
          </div>
          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Dependencies
            </span>
            <span className="text-fade mt-1 block whitespace-pre-wrap leading-relaxed font-medium">
              {change.rollbackPlan.dependencies}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-fade-2 text-sm italic">No rollback plan defined.</p>
      )}

      {/* Execute Rollback button */}
      {isDeployed &&
        change.deployment?.verificationStatus === "issues_found" &&
        change.status !== "Rolled Back" && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
              Execute Rollback
            </span>
            <p className="text-fade-2 text-sm mb-3">
              Issues were found during post-deployment verification. You can
              execute the rollback plan to revert the deployment.
            </p>
            <Button danger type="primary" onClick={handleExecuteRollback}>
              <FaRotateLeft className="mr-1.5 h-3 w-3" />
              Execute Rollback
            </Button>
          </div>
        )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="bg-bg/95 border-border/50 sticky top-[-32px] z-30 -mx-8 -mt-8 mb-8 flex flex-col flex-wrap items-start justify-between gap-4 border-b px-8 py-4 backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="border-border hover:bg-bg-muted text-fade bg-bg cursor-pointer rounded-xl border p-2 transition-colors"
          >
            <FaArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h2 text-primary-alpha font-bold tracking-tight">
                {change.id}
              </h2>
              <StatusTag status={change.status} />
              <RiskTag level={change.riskLevel} />
              {change.riskOverridden && (
                <Tooltip
                  title={
                    change.riskOverrideJustification ||
                    "Risk was manually overridden"
                  }
                >
                  <Tag color="#f59e0b">Overridden</Tag>
                </Tooltip>
              )}
            </div>
            <p className="text-body-sm text-fade-2">
              Submitted by{" "}
              <span className="text-fade font-semibold">
                {change.submitterName}
              </span>{" "}
              ({change.submitterDepartment})
            </p>
          </div>
        </div>

        {/* Global actions: Expand/Collapse All + Edit */}
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip title={isAllExpanded ? "Collapse All" : "Expand All"}>
            <Button
              htmlType="button"
              onClick={isAllExpanded ? collapseAll : expandAll}
              icon={
                !isAllExpanded ? (
                  <FaAngleDoubleDown className="h-4 w-5" />
                ) : (
                  <FaAngleDoubleUp className="h-4 w-5" />
                )
              }
              className="text-body-sm border-border text-fade h-11! w-11! rounded-lg! px-5! leading-none! font-semibold!"
            />
          </Tooltip>

          {isEditing && (
            <>
              <Button
                htmlType="button"
                onClick={cancelEditing}
                className="text-body-sm border-border text-fade h-11! rounded-lg! px-5! font-semibold!"
              >
                Cancel Changes
              </Button>
              <Button
                htmlType="button"
                type="primary"
                onClick={saveEditing}
                icon={<FaFloppyDisk className="h-4 w-4" />}
                className="text-body-sm bg-primary hover:bg-primary/90 h-11! rounded-lg! border-none! px-5! leading-none! font-semibold! text-white"
              >
                Save Changes
              </Button>
            </>
          )}

          {canEdit && !isEditing && (
            <Tooltip title="Edit Request">
              <Button
                htmlType="button"
                onClick={startEditing}
                icon={<FaPenToSquare className="h-4 w-4" />}
                className="text-body-sm h-11! w-11! rounded-lg! px-5! font-semibold!"
              />
            </Tooltip>
          )}

          {canApprove && !isEditing && (
            <>
              <Button
                htmlType="button"
                type="primary"
                onClick={() => setApproverAction("approve")}
                className="text-body-sm h-11! rounded-lg! border-none! bg-emerald-600! px-5! font-semibold! text-white hover:bg-emerald-700!"
              >
                Approve
              </Button>
              <Button
                htmlType="button"
                type="primary"
                onClick={() => setApproverAction("query")}
                className="text-body-sm h-11! rounded-lg! border-none! bg-amber-600! px-5! font-semibold! text-white hover:bg-amber-700!"
              >
                Query
              </Button>
              <Button
                htmlType="button"
                type="primary"
                onClick={() => setApproverAction("decline")}
                className="text-body-sm h-11! rounded-lg! border-none! bg-red-600! px-5! font-semibold! text-white hover:bg-red-700!"
              >
                Decline
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details in accordions */}
        <div className="flex flex-col gap-y-6 lg:col-span-2">
          {/* Overview Section */}
          <Collapse
            activeKey={expanded.overview ? ["overview"] : []}
            onChange={(keys) =>
              setExpanded((prev) => ({
                ...prev,
                overview: keys.includes("overview"),
              }))
            }
            items={[
              {
                key: "overview",
                label: (
                  <div className="flex items-center gap-2.5">
                    <FaCircleInfo className="text-primary h-5 w-5" />
                    <span>Change Overview</span>
                  </div>
                ),
                children: renderOverview(),
              },
            ]}
          />

          {/* Testing Section */}
          <Collapse
            activeKey={expanded.testing ? ["testing"] : []}
            onChange={(keys) =>
              setExpanded((prev) => ({
                ...prev,
                testing: keys.includes("testing"),
              }))
            }
            items={[
              {
                key: "testing",
                label: (
                  <div className="flex items-center gap-2.5">
                    <FaFlask className="text-primary h-5 w-5" />
                    <span>Testing Checklist & Evidence</span>
                  </div>
                ),
                children: renderTesting(),
              },
            ]}
          />

          {/* Deployment Section */}
          <Collapse
            activeKey={expanded.deployment ? ["deployment"] : []}
            onChange={(keys) =>
              setExpanded((prev) => ({
                ...prev,
                deployment: keys.includes("deployment"),
              }))
            }
            items={[
              {
                key: "deployment",
                label: (
                  <div className="flex items-center gap-2.5">
                    <FaRocket className="text-primary h-5 w-5" />
                    <span>Deployment Details & Verification</span>
                  </div>
                ),
                children: renderDeployment(),
              },
            ]}
          />

          {/* Rollback Section */}
          <Collapse
            activeKey={expanded.rollback ? ["rollback"] : []}
            onChange={(keys) =>
              setExpanded((prev) => ({
                ...prev,
                rollback: keys.includes("rollback"),
              }))
            }
            items={[
              {
                key: "rollback",
                label: (
                  <div className="flex items-center gap-2.5">
                    <FaRotateLeft className="text-primary h-5 w-5" />
                    <span>Rollback Plan</span>
                  </div>
                ),
                children: renderRollback(),
              },
            ]}
          />
        </div>

        {/* Right Column: Approvals, Audit Trail, Comments */}
        <div className="flex flex-col gap-6">
          {/* Workflow History (approval + audit trail, unified) */}
          <Collapse
            activeKey={expanded.workflow ? ["workflow"] : []}
            onChange={(keys) =>
              setExpanded((prev) => ({
                ...prev,
                workflow: keys.includes("workflow"),
              }))
            }
            items={[
              {
                key: "workflow",
                label: (
                  <div className="flex items-center gap-2.5">
                    <FaClockRotateLeft className="text-primary h-5 w-5" />
                    <span>Workflow History</span>
                  </div>
                ),
                children:
                  change.timeline.length === 0 ? (
                    <p className="text-fade-2 text-sm italic">
                      No events yet.
                    </p>
                  ) : (
                    <div className="border-border-muted relative space-y-6 border-l pl-4">
                      {change.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          <span
                            className="absolute top-1.5 left-[-24px] h-4 w-4 rounded-full border-2 border-white"
                            style={{
                              backgroundColor: getEventColor(event.action),
                            }}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-primary-alpha text-sm font-bold">
                              {event.actorName}
                            </span>
                            <span className="text-fade-2 text-[11px] font-medium">
                              {dayjs(event.timestamp).format(
                                "MMM D, YYYY h:mm A",
                              )}
                            </span>
                          </div>
                          <p className="text-fade-2 mt-0.5 text-xs font-medium">
                            Stage: {event.stage}
                          </p>
                          <div className="mt-1.5">
                            <Tag
                              color={getEventColor(event.action)}
                              format={false}
                            >
                              {event.action}
                            </Tag>
                          </div>
                          <p className="text-fade mt-1.5 text-xs italic">
                            "{event.comment || "No comment provided."}"
                          </p>
                          {(event.handledInHouse !== undefined ||
                            event.costInvolved) && (
                            <div className="text-fade-2 border-border-muted mt-1.5 flex flex-wrap gap-3 border-t pt-1.5 text-[10px] font-medium">
                              {event.handledInHouse !== undefined && (
                                <span>
                                  Handled:{" "}
                                  {event.handledInHouse
                                    ? "In-house"
                                    : "Externally"}
                                </span>
                              )}
                              {event.costInvolved && (
                                <span>
                                  Cost: $
                                  {event.estimatedCost?.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ),
              },
            ]}
          />

        </div>
      </div>

      {/* Approver Action Modal */}
      <Modal
        open={!!approverAction}
        onCancel={() => {
          setApproverAction(null);
          setActionComment("");
          setActionError("");
        }}
        title={
          approverAction === "approve"
            ? "Approve Change Request"
            : approverAction === "query"
              ? "Query Change Request"
              : "Decline Change Request"
        }
        okText={
          approverAction === "approve"
            ? "Approve"
            : approverAction === "query"
              ? "Query"
              : "Decline"
        }
        cancelText="Cancel"
        okButtonProps={{
          className: cn(
            "border-none! text-white! font-semibold",
            approverAction === "approve" &&
              "bg-emerald-600 hover:bg-emerald-700",
            approverAction === "query" && "bg-amber-600 hover:bg-amber-700",
            approverAction === "decline" && "bg-red-600 hover:bg-red-700",
          ),
        }}
        cancelButtonProps={{
          className: "border-border! text-primary-alpha! hover:bg-bg-muted!",
        }}
        onOk={() => {
          if (approverAction) {
            handleSubmitAction(approverAction);
          }
        }}
        width={550}
        centered
      >
        <div className="space-y-4 py-4">
          {actionError && (
            <div className="text-body-xs flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <FaTriangleExclamation className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-fade">
              {approverAction === "approve"
                ? "Comments (Optional)"
                : "Reason / Comments (Mandatory)"}
            </Label>
            <TextArea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder={
                approverAction === "approve"
                  ? "Add any approval notes here..."
                  : "Provide the reason for this action..."
              }
              rows={4}
              required={approverAction !== "approve"}
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>

          {approverAction === "approve" &&
            (isAdmin || currentUser.department === "IT") && (
              <div className="space-y-4 border-t border-border/40 pt-3">
                <div>
                  <Label>Implementation Executor</Label>
                  <Radio.Group
                    value={handledInHouse}
                    onChange={(e) => setHandledInHouse(e.target.value)}
                    className="flex gap-4 mt-1"
                  >
                    <Radio value={true}>In-house</Radio>
                    <Radio value={false}>Externally</Radio>
                  </Radio.Group>
                </div>

                <div className="space-y-2">
                  <Checkbox
                    checked={costInvolved}
                    onChange={(e) => setCostInvolved(e.target.checked)}
                  >
                    Cost involved?
                  </Checkbox>
                  {costInvolved && (
                    <div className="pt-1">
                      <InputNumber
                        min={0}
                        value={estimatedCost}
                        onChange={(val) => setEstimatedCost(val || 0)}
                        prefix="$"
                        placeholder="Estimated cost"
                        className={cn(FORM.CLASS_NAME, "w-full!")}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default ChangeDetail;
