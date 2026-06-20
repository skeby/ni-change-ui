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
  FaPlus,
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
  const [editTestSteps, setEditTestSteps] = useState<TestStep[]>([]);

  // ---- Query response state ----
  const [showQueryResponseModal, setShowQueryResponseModal] = useState(false);
  const [queryResponseText, setQueryResponseText] = useState("");
  const [queryResponseError, setQueryResponseError] = useState("");

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
  const canRespondQuery = isSubmitter && change?.isQueried;

  // Test checklist from settings
  const testChecklist = useMemo(() => {
    if (!change) return null;
    return settings.testChecklists.find(
      (tc) => tc.category === change.category,
    );
  }, [change, settings.testChecklists]);

  const handleEditStep = (
    stepId: string,
    field: keyof TestStep,
    value: string,
  ) => {
    setEditTestSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s)),
    );
  };

  const handleDeleteStep = (stepId: string) => {
    setEditTestSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const handleAddStep = () => {
    setEditTestSteps((prev) => [
      ...prev,
      {
        id: `ts-custom-${Date.now()}`,
        description: "",
        expectedOutcome: "",
        result: "pending",
        notes: "",
      },
    ]);
  };

  const handleAutoGenerateEditSteps = () => {
    if (!testChecklist) return;
    const newSteps: TestStep[] = testChecklist.items.map((item, idx) => ({
      id: `ts-gen-${Date.now()}-${idx}`,
      description: item,
      expectedOutcome: "Passes successfully",
      result: "pending" as const,
      notes: "",
    }));
    setEditTestSteps((prev) => [...prev, ...newSteps]);
  };

  const editTestStepColumns = useMemo<TableProps<TestStep>["columns"]>(
    () => [
      {
        title: "Test Step / Description",
        key: "description",
        render: (_, record) => (
          <Input
            value={record.description}
            onChange={(e) =>
              handleEditStep(record.id, "description", e.target.value)
            }
            placeholder="e.g. Verify Opportunity page displays custom fields"
            className="bg-background-light! w-full! rounded-xl!"
          />
        ),
      },
      {
        title: "Expected Outcome",
        key: "expectedOutcome",
        render: (_, record) => (
          <Input
            value={record.expectedOutcome}
            onChange={(e) =>
              handleEditStep(record.id, "expectedOutcome", e.target.value)
            }
            placeholder="e.g. Fields render correctly without error"
            className="bg-background-light! w-full! rounded-xl!"
          />
        ),
      },
      {
        title: "Action",
        key: "delete",
        width: 80,
        render: (_, record) => (
          <Button
            type="text"
            danger
            icon={<FaXmark className="h-4 w-4" />}
            onClick={() => handleDeleteStep(record.id)}
            className="flex items-center justify-center"
          />
        ),
      },
    ],
    [editTestSteps], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const testStepColumns = useMemo<TableProps<TestStep>["columns"]>(() => {
    const cols: TableProps<TestStep>["columns"] = [
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
                    on {dayjs(record.completedAt).format("MMM D, YYYY h:mm A")}
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
        width: 100,
        render: (val: string) => (
          <Tag value={val} format={true}>
            {val}
          </Tag>
        ),
      },
    ];

    if (canTest) {
      cols.push({
        title: "Action",
        key: "action",
        width: 150,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Button
              size="small"
              type={record.result === "pass" ? "primary" : "text"}
              className={
                record.result === "pass"
                  ? "!bg-emerald-600! !border-emerald-600! text-white! font-semibold flex items-center"
                  : "text-fade hover:text-emerald-600! hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center"
              }
              onClick={() => handleTestStepToggle(record.id, "pass")}
            >
              <FaCheck className="mr-1.5 h-3 w-3" />
              Pass
            </Button>
            <Button
              size="small"
              type={record.result === "fail" ? "primary" : "text"}
              danger={record.result === "fail"}
              className={
                record.result === "fail"
                  ? "!bg-red-600! !border-red-600! text-white! font-semibold flex items-center"
                  : "text-fade hover:text-red-600! hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center"
              }
              onClick={() => handleTestStepToggle(record.id, "fail")}
            >
              <FaXmark className="mr-1.5 h-3 w-3" />
              Fail
            </Button>
          </div>
        ),
      });
    }

    cols.push({
      title: "Notes",
      key: "notes",
      width: canTest ? 220 : 180,
      render: (_, record) => {
        if (canTest) {
          return (
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
                  }),
                );
              }}
              className="w-full"
            />
          );
        }
        return record.notes ? (
          <span className="text-fade text-xs italic">"{record.notes}"</span>
        ) : (
          <span className="text-fade-2 text-xs italic">No notes</span>
        );
      },
    });

    return cols;
  }, [canTest, testNotes, change?.id, users, dispatch]);

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

  const handleDeleteEvidence = (evidenceId: string) => {
    Modal.confirm({
      title: "Delete Evidence",
      content: "Are you sure you want to delete this evidence file?",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      onOk: () => {
        dispatch(
          updateChange({
            id: change.id,
            updates: {
              evidence: change.evidence.filter((ev) => ev.id !== evidenceId),
            },
          }),
        );
        message.success("Evidence deleted successfully");
      },
    });
  };

  const handleQueryResponseSubmit = () => {
    setQueryResponseError("");
    if (!queryResponseText.trim()) {
      setQueryResponseError(
        "Please provide some information in response to the query.",
      );
      return;
    }

    dispatch(
      updateChange({
        id: change.id,
        updates: {
          isQueried: false,
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
          action: "Responded to query",
          comment: queryResponseText.trim(),
          timestamp: new Date().toISOString(),
        },
      }),
    );

    setQueryResponseText("");
    setShowQueryResponseModal(false);
    message.success("Response submitted successfully");
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

    // Rollback plan states
    setRollbackSteps(change.rollbackPlan?.steps || "");
    setRollbackPerson(change.rollbackPlan?.responsiblePerson || "");
    setRollbackTime(change.rollbackPlan?.estimatedTime || "");
    setRollbackDeps(change.rollbackPlan?.dependencies || "");

    // Test plan & checklist states
    setTestPlanDraft(change.testPlan || "");
    setEditTestSteps([...change.testSteps]);

    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    // Reset rollback states
    setRollbackSteps(change.rollbackPlan?.steps || "");
    setRollbackPerson(change.rollbackPlan?.responsiblePerson || "");
    setRollbackTime(change.rollbackPlan?.estimatedTime || "");
    setRollbackDeps(change.rollbackPlan?.dependencies || "");

    // Reset test plan & checklist states
    setTestPlanDraft(change.testPlan || "");
    setEditTestSteps([]);
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
          rollbackPlan: {
            steps: rollbackSteps,
            responsiblePerson: rollbackPerson,
            estimatedTime: rollbackTime,
            dependencies: rollbackDeps,
          },
          testPlan: testPlanDraft,
          testSteps: editTestSteps,
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
                {change.isEmergency && <Tag color="#ef4444">Emergency</Tag>}
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
                          {users.find((u) => u.id === stage.approverId)?.name ||
                            stage.approverId ||
                            stage.role}
                          {stage.approverId && (
                            <span className="text-fade-2 ml-1.5 text-xs font-medium">
                              ({stage.role})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-primary-alpha text-sm font-semibold">
                          {users.find((u) => u.id === stage.approverId)?.name ||
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
                  {users.find((u) => u.id === change.selectedApprover)?.name ||
                    change.selectedApprover}
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

          {/* Risk Justification */}
          {change.riskJustification && (
            <div className="border-border-muted border-t pt-3">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Risk Justification
              </span>
              <span className="text-fade mt-1 block leading-relaxed font-medium whitespace-pre-wrap">
                {change.riskJustification}
              </span>
            </div>
          )}

          {/* Business Justification */}
          <div className="border-border-muted border-t pt-3">
            <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
              Business Justification
            </span>
            <span className="text-fade mt-1 block leading-relaxed font-medium whitespace-pre-wrap">
              {change.businessJustification}
            </span>
          </div>

          {/* Emergency action record */}
          {change.isEmergency && (
            <div className="border-border-muted border-t pt-3">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                Emergency Action Taken
                {change.emergencyActionTakenAt && (
                  <span className="text-fade ml-2 normal-case">
                    ({dayjs(change.emergencyActionTakenAt).format(
                      "MMM D, YYYY h:mm A",
                    )})
                  </span>
                )}
              </span>
              <span className="text-fade mt-1 block leading-relaxed font-medium whitespace-pre-wrap">
                {change.emergencyActionTaken}
              </span>
            </div>
          )}

          {/* AI Request Data */}
          {change.aiRequest && (
            <div className="border-border-muted space-y-3 border-t pt-4">
              <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                AI Request Data
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryField
                  label="Who Uses It"
                  value={change.aiRequest.whoUsesSoftware}
                />
                <SummaryField
                  label="Duration"
                  value={change.aiRequest.duration}
                />
                <SummaryField
                  label="Problem Complexity"
                  value={change.aiRequest.problemComplexity}
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
                  label="Requires Staff Personal Data"
                  value={change.aiRequest.requiresStaffPersonalData}
                />
                <SummaryField
                  label="Requires Sensitive Data"
                  value={change.aiRequest.requiresSensitiveData}
                />
                <SummaryField
                  label="Uses Production Data"
                  value={change.aiRequest.usesProductionData}
                />
                <SummaryField
                  label="Uses Default Stack"
                  value={change.aiRequest.usesDefaultStack}
                />
                <SummaryField
                  label="Post-build Support"
                  value={change.aiRequest.postBuildSupport}
                />
                <SummaryField
                  label="LLMs Considered"
                  value={change.aiRequest.llmChoices.join(", ")}
                  full
                />
                <SummaryField
                  label="Integrates With"
                  value={
                    change.aiRequest.integratesWithSystems.length
                      ? change.aiRequest.integratesWithSystems.join(", ")
                      : "None"
                  }
                  full
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
                  full
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderTesting = () => {
    const hasSteps = isEditing
      ? editTestSteps.length > 0
      : change.testSteps.length > 0;

    return (
      <div className="space-y-6 pt-2">
        {/* Test Plan */}
        <div className="space-y-2">
          <Label>Test Plan</Label>
          {isEditing ? (
            <TextArea
              rows={4}
              value={testPlanDraft}
              onChange={(e) => setTestPlanDraft(e.target.value)}
              placeholder="Describe the test plan for this change..."
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          ) : change.testPlan ? (
            <div className="bg-bg-muted border border-border-muted rounded-2xl p-4 leading-relaxed font-medium">
              <p className="text-primary-alpha text-sm leading-relaxed whitespace-pre-wrap">
                {change.testPlan}
              </p>
            </div>
          ) : (
            <p className="text-fade-2 text-sm italic mt-1">
              No test plan defined.
            </p>
          )}
        </div>

        {/* Test Checklist */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label>Test Checklist</Label>
            {isEditing && (
              <div className="flex gap-2">
                {testChecklist && editTestSteps.length === 0 && (
                  <Button
                    type="text"
                    size="small"
                    onClick={handleAutoGenerateEditSteps}
                    className="text-primary! flex! items-center! gap-1! font-semibold!"
                  >
                    Auto-generate Checklist ({testChecklist.items.length} items)
                  </Button>
                )}
                <Button
                  type="text"
                  size="small"
                  onClick={handleAddStep}
                  className="text-primary! flex! items-center! gap-1! font-semibold!"
                >
                  <FaPlus className="mr-1 h-3.5 w-3.5" />
                  Add Custom Step
                </Button>
              </div>
            )}
          </div>

          {!hasSteps ? (
            <div className="text-center py-6 border border-dashed border-border-muted rounded-2xl bg-bg-muted/30">
              <p className="text-fade-2 mb-3 text-sm italic">
                No test steps defined yet.
              </p>
              {!isEditing && canTest && testChecklist && (
                <Button
                  type="text"
                  size="small"
                  onClick={handleAutoGenerateTests}
                  className="text-primary! flex! items-center! gap-1! font-semibold! mx-auto!"
                >
                  Generate from {change.category} Template
                </Button>
              )}
            </div>
          ) : (
            <div className="border-border overflow-hidden rounded-2xl border">
              <DataTable
                dataSource={
                  isEditing ? (editTestSteps as any) : (change.testSteps as any)
                }
                columns={
                  isEditing
                    ? (editTestStepColumns as any)
                    : (testStepColumns as any)
                }
                pagination={false}
                cardClassName="shadow-none! border-none! rounded-none! bg-transparent!"
              />
            </div>
          )}

          {!isEditing && canTest && allTestsDecided && (
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
            <Label>Evidence Uploads</Label>
            {canTest && (
              <Button
                type="text"
                size="small"
                onClick={handleUploadEvidence}
                className="text-primary! flex! items-center! gap-1! font-semibold!"
              >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {change.evidence.map((ev) => {
                const canDelete = isAdmin || ev.uploadedBy === currentUserId;
                return (
                  <div
                    key={ev.id}
                    className="bg-bg-muted border border-border-muted flex items-center gap-3 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="bg-primary-light dark:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <FaFile className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-alpha truncate text-sm font-bold">
                        {ev.name}
                      </p>
                      <p className="text-fade-2 text-xs font-medium mt-0.5">
                        {ev.type} &middot; {formatBytes(ev.size)}
                      </p>
                      <p className="text-fade-2 text-[10px] mt-1">
                        Uploaded by{" "}
                        <span className="font-semibold text-fade">
                          {users.find((u) => u.id === ev.uploadedBy)?.name ||
                            ev.uploadedBy}
                        </span>{" "}
                        on {dayjs(ev.uploadedAt).format("MMM D, YYYY h:mm A")}
                      </p>
                    </div>
                    {canDelete && (
                      <Button
                        type="text"
                        danger
                        icon={<FaXmark className="h-4 w-4" />}
                        onClick={() => handleDeleteEvidence(ev.id)}
                        className="shrink-0 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

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
            <Label>Deployment Notes</Label>
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
              <Label>Post-Deployment Verification</Label>
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
                <Label>Sign-Off</Label>
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
      {isEditing ? (
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
            <Label>Execute Rollback</Label>
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
              {change.isQueried ? (
                <Tag color="#f59e0b">Queried</Tag>
              ) : (
                <StatusTag status={change.status} />
              )}
              <RiskTag level={change.riskLevel} />
              {change.isEmergency && <Tag color="#ef4444">Emergency</Tag>}
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

          {canRespondQuery && !isEditing && (
            <Button
              htmlType="button"
              type="primary"
              onClick={() => setShowQueryResponseModal(true)}
              className="text-body-sm h-11! rounded-lg! border-none! bg-amber-600! px-5! font-semibold! text-white! hover:bg-amber-700!"
            >
              Respond to Query
            </Button>
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

      {/* Query Message Banner */}
      {change.isQueried && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <FaCircleInfo className="text-amber-500 mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-primary-alpha text-sm font-bold">
                Information Requested
              </p>
              <p className="text-fade-2 text-xs font-semibold mt-1">
                "{change.queryComment || "No comment provided."}"
              </p>
            </div>
          </div>
          {canRespondQuery && (
            <Button
              type="primary"
              onClick={() => setShowQueryResponseModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white border-none! font-semibold shrink-0"
            >
              Respond to Query
            </Button>
          )}
        </div>
      )}

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
                    <p className="text-fade-2 text-sm italic">No events yet.</p>
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
                          {event.comment && (
                            <p className="text-fade mt-1.5 text-xs italic">
                              "{event.comment || "No comment provided."}"
                            </p>
                          )}
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
                                  Cost: ${event.estimatedCost?.toLocaleString()}
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

      {/* Query Response Modal */}
      <Modal
        open={showQueryResponseModal}
        onCancel={() => {
          setShowQueryResponseModal(false);
          setQueryResponseText("");
          setQueryResponseError("");
        }}
        title="Respond to Query"
        okText="Submit Response"
        cancelText="Cancel"
        okButtonProps={{
          className:
            "bg-primary hover:bg-primary/90 text-white border-none! font-semibold",
        }}
        cancelButtonProps={{
          className: "border-border! text-primary-alpha! hover:bg-bg-muted!",
        }}
        onOk={handleQueryResponseSubmit}
        width={550}
        centered
      >
        <div className="space-y-4 py-4 text-primary-alpha">
          {queryResponseError && (
            <div className="text-body-xs flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <FaTriangleExclamation className="h-4 w-4 shrink-0" />
              <span>{queryResponseError}</span>
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="block text-[10px] font-bold tracking-wider uppercase">
              Query Message
            </span>
            <p className="text-body-xs leading-relaxed font-semibold">
              "{change.queryComment || "No comment provided."}"
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-fade">Your Response (Mandatory)</Label>
            <TextArea
              value={queryResponseText}
              onChange={(e) => setQueryResponseText(e.target.value)}
              placeholder="Provide information in response to the query..."
              rows={4}
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChangeDetail;
