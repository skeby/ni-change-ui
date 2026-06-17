import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../state/store";
import {
  updateChange,
  addTimelineEvent,
  addComment,
  addApproval,
  updateTestStep,
  addEvidence,
  type ChangeStatus,
  type RiskLevel,
  type TestStep,
  type Comment as ChangeComment,
} from "../state/slices/changes-slice";
import {
  Button,
  Input,
  Radio,
  Modal,
  Descriptions,
  Checkbox,
  InputNumber,
  Empty,
  Tooltip,
} from "antd";
import { Collapse } from "../components/ui/collapse";
import Tag from "../components/ui/tag";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { cn } from "../utils/cn";
import {
  FaArrowLeft,
  FaClockRotateLeft,
  FaFlask,
  FaRocket,
  FaRotateLeft,
  FaCircleInfo,
  FaCheck,
  FaXmark,
  FaPaperPlane,
  FaUpload,
  FaFile,
  FaReply,
} from "react-icons/fa6";
import { FaAngleDoubleDown, FaAngleDoubleUp } from "react-icons/fa";
import Label from "../components/ui/label";
import { FORM } from "../static";

dayjs.extend(relativeTime);

const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Status + Risk badge helpers
// ---------------------------------------------------------------------------

const StatusTag: React.FC<{ status: ChangeStatus }> = ({ status }) => (
  <Tag value={status} format={false}>
    {status}
  </Tag>
);

const RiskTag: React.FC<{ level: RiskLevel }> = ({ level }) => (
  <Tag value={level}>{level} Risk</Tag>
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

  // ---- Collapsible sections state (all collapsed initially) ----
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    overview: false,
    testing: false,
    deployment: false,
    rollback: false,
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
    });
  };

  const collapseAll = () => {
    setExpanded({
      overview: false,
      testing: false,
      deployment: false,
      rollback: false,
    });
  };

  // ---- Approval form state ----
  const [approvalAction, setApprovalAction] = useState<
    "approved" | "rejected" | "info_requested"
  >("approved");
  const [approvalComment, setApprovalComment] = useState("");
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

  // ---- Comment state ----
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

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

  // Test checklist from settings
  const testChecklist = useMemo(() => {
    if (!change) return null;
    return settings.testChecklists.find(
      (tc) => tc.category === change.category,
    );
  }, [change, settings.testChecklists]);

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

  const handleApprovalSubmit = () => {
    if (!approvalComment.trim() && approvalAction !== "approved") return;

    const approval = {
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: approvalAction,
      timestamp: new Date().toISOString(),
      comment: approvalComment || undefined,
      handledInHouse: isAdmin ? handledInHouse : undefined,
      costInvolved: isAdmin ? costInvolved : undefined,
      estimatedCost: isAdmin && costInvolved ? estimatedCost : undefined,
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
          updates: { isQueried: true, queryComment: approvalComment },
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
          comment: approvalComment || undefined,
        },
      }),
    );

    setApprovalComment("");
    setApprovalAction("approved");
    setCostInvolved(false);
    setEstimatedCost(0);
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
              ? "Post-deployment verification: Confirmed working"
              : "Post-deployment verification: Issues found",
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

  const handleAddComment = (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    const comment: ChangeComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      parentId,
    };

    dispatch(addComment({ id: change.id, comment }));

    if (parentId) {
      setReplyingTo(null);
      setReplyContent("");
    } else {
      setNewComment("");
    }
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const approvalActionLabel = (action: string) => {
    switch (action) {
      case "approved":
        return <Tag value="approved">Approved</Tag>;
      case "rejected":
        return <Tag value="rejected">Rejected</Tag>;
      case "info_requested":
        return <Tag value="info_requested">Info Requested</Tag>;
      default:
        return <Tag>{action}</Tag>;
    }
  };

  // -----------------------------------------------------------------------
  // TAB: Overview
  // -----------------------------------------------------------------------

  const rollbackEditable = !isDeployed;

  const allTestsDecided =
    change.testSteps.length > 0 &&
    change.testSteps.every((s) => s.result !== "pending");

  const topLevelComments = change.comments.filter((c) => !c.parentId);

  const repliesMap = useMemo(() => {
    const map: Record<string, ChangeComment[]> = {};
    change.comments.forEach((c) => {
      if (c.parentId) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    return map;
  }, [change.comments]);

  const renderComment = (comment: ChangeComment, depth: number = 0) => (
    <div
      key={comment.id}
      className={cn(
        "space-y-2",
        depth > 0 &&
          "ml-8 border-l-2 border-blue-200 pl-4 dark:border-blue-800",
      )}
    >
      <div className="bg-secondary rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="text-primary-alpha text-sm font-semibold">
            {comment.authorName}
          </span>
          <span className="text-fade-2 text-xs">
            {dayjs(comment.timestamp).fromNow()}
          </span>
        </div>
        <p className="text-primary-alpha mt-1 text-sm">{comment.content}</p>
        <Button
          type="link"
          size="small"
          className="mt-1 !p-0 text-xs"
          onClick={() => {
            setReplyingTo(replyingTo === comment.id ? null : comment.id);
            setReplyContent("");
          }}
        >
          <FaReply className="mr-1 h-3 w-3" />
          Reply
        </Button>

        {replyingTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <TextArea
              rows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className={cn(FORM.TEXTAREA_CLASS_NAME, "flex-1")}
            />
            <Button
              type="primary"
              size="small"
              onClick={() => handleAddComment(comment.id)}
              className="self-end"
            >
              Reply
            </Button>
          </div>
        )}
      </div>
      {/* Nested replies */}
      {(repliesMap[comment.id] || []).map((reply) =>
        renderComment(reply, depth + 1),
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 pt-2">
      {/* Details grid */}
      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2, lg: 3 }}
        labelStyle={{ fontWeight: 600, fontSize: 12 }}
        contentStyle={{ fontSize: 13 }}
      >
        <Descriptions.Item label="System">
          {change.systemAffected}
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <Tag>{change.category}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Risk Level">
          <RiskTag level={change.riskLevel} />
          {change.riskOverridden && (
            <Tooltip
              title={
                change.riskOverrideJustification ||
                "Risk was manually overridden"
              }
            >
              <Tag color="#f59e0b" className="ml-1">
                Overridden
              </Tag>
            </Tooltip>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Submitter">
          {change.submitterName}
        </Descriptions.Item>
        <Descriptions.Item label="Department">
          {change.submitterDepartment}
        </Descriptions.Item>
        <Descriptions.Item label="Requested Timeline">
          {dayjs(change.requestedTimeline).format("MMM D, YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {dayjs(change.createdAt).format("MMM D, YYYY h:mm A")}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {dayjs(change.updatedAt).format("MMM D, YYYY h:mm A")}
        </Descriptions.Item>
      </Descriptions>

      {/* Approval Chain */}
      {(change.approvalPlan?.length || change.selectedApprover) && (
        <div className="space-y-3 pt-3 border-t border-border/50">
          <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
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
      <div className="space-y-1.5">
        <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
          Description
        </span>
        <p className="text-primary-alpha whitespace-pre-wrap text-sm leading-relaxed">
          {change.description}
        </p>
      </div>

      {/* Business Justification */}
      <div className="space-y-1.5">
        <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
          Business Justification
        </span>
        <p className="text-primary-alpha whitespace-pre-wrap text-sm leading-relaxed">
          {change.businessJustification}
        </p>
      </div>

      {/* AI Request Data */}
      {change.aiRequest && (
        <div className="space-y-3 pt-4 border-t border-border/50">
          <span className="text-fade-2 text-xs font-semibold tracking-wider uppercase">
            AI Request Data
          </span>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
            contentStyle={{ fontSize: 13 }}
          >
            <Descriptions.Item label="Frequency">
              {change.aiRequest.frequency}
            </Descriptions.Item>
            <Descriptions.Item label="Rule Engine">
              {change.aiRequest.ruleEngine}
            </Descriptions.Item>
            <Descriptions.Item label="AI/ML">
              {change.aiRequest.aiMl}
            </Descriptions.Item>
            <Descriptions.Item label="Human Review">
              {change.aiRequest.human}
            </Descriptions.Item>
            <Descriptions.Item label="Statistical Modeling">
              {change.aiRequest.statisticalModeling}
            </Descriptions.Item>
            <Descriptions.Item label="Problem Complexity">
              {change.aiRequest.problemComplexity}
            </Descriptions.Item>
            <Descriptions.Item label="Problem Description" span={2}>
              {change.aiRequest.problemDescription}
            </Descriptions.Item>
            <Descriptions.Item label="Current Solution" span={2}>
              {change.aiRequest.currentSolution}
            </Descriptions.Item>
            <Descriptions.Item label="Success Metrics" span={2}>
              {change.aiRequest.successMetrics}
            </Descriptions.Item>
            <Descriptions.Item label="Simpler Alternative">
              {change.aiRequest.simplerAlternative}
            </Descriptions.Item>
            <Descriptions.Item label="Global Use">
              {change.aiRequest.globalUse}
            </Descriptions.Item>
            <Descriptions.Item label="Requires Staff Data">
              {change.aiRequest.requiresStaffData}
            </Descriptions.Item>
            <Descriptions.Item label="Requires Sensitive Data">
              {change.aiRequest.requiresSensitiveData}
            </Descriptions.Item>
            <Descriptions.Item label="External Users">
              {change.aiRequest.externalUsers}
            </Descriptions.Item>
            <Descriptions.Item label="Internal Only">
              {change.aiRequest.internalOnly}
            </Descriptions.Item>
            <Descriptions.Item label="Both Users">
              {change.aiRequest.bothUsers}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {change.aiRequest.duration}
            </Descriptions.Item>
          </Descriptions>
        </div>
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
          <div className="space-y-3">
            {change.testSteps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "rounded-lg border p-3",
                  step.result === "pass" &&
                    "border-green-200 bg-green-50/30 dark:border-green-900/40 dark:bg-green-950/10",
                  step.result === "fail" &&
                    "border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/10",
                  step.result === "pending" && "bg-secondary",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-primary-alpha text-sm font-medium">
                      {step.description}
                    </p>
                    <p className="text-fade-2 mt-0.5 text-xs">
                      Expected: {step.expectedOutcome}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {step.result === "pending" ? (
                      <Tag value="pending">Pending</Tag>
                    ) : step.result === "pass" ? (
                      <Tag value="pass">Pass</Tag>
                    ) : (
                      <Tag value="fail">Fail</Tag>
                    )}
                  </div>
                </div>

                {canTest && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <Button
                      size="small"
                      type={step.result === "pass" ? "primary" : "default"}
                      className={
                        step.result === "pass"
                          ? "!bg-green-600 !border-green-600"
                          : ""
                      }
                      onClick={() => handleTestStepToggle(step.id, "pass")}
                    >
                      <FaCheck className="mr-1 h-3 w-3" />
                      Pass
                    </Button>
                    <Button
                      size="small"
                      danger
                      type={step.result === "fail" ? "primary" : "default"}
                      onClick={() => handleTestStepToggle(step.id, "fail")}
                    >
                      <FaXmark className="mr-1 h-3 w-3" />
                      Fail
                    </Button>
                    <Input
                      size="small"
                      placeholder="Notes..."
                      value={testNotes[step.id] ?? step.notes}
                      onChange={(e) =>
                        setTestNotes((prev) => ({
                          ...prev,
                          [step.id]: e.target.value,
                        }))
                      }
                      className="ml-2 flex-1"
                    />
                  </div>
                )}

                {step.completedBy && (
                  <p className="text-fade-2 mt-2 text-xs">
                    Completed by{" "}
                    {users.find((u) => u.id === step.completedBy)?.name ||
                      step.completedBy}
                    {step.completedAt && (
                      <>
                        {" "}
                        on{" "}
                        {dayjs(step.completedAt).format("MMM D, YYYY h:mm A")}
                      </>
                    )}
                    {step.notes && <> &mdash; {step.notes}</>}
                  </p>
                )}
              </div>
            ))}
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
          <Descriptions
            bordered
            size="small"
            column={1}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
          >
            <Descriptions.Item label="Deployed By">
              {currentUser.name}
            </Descriptions.Item>
            <Descriptions.Item label="Date/Time">
              {dayjs().format("MMM D, YYYY h:mm A")}
            </Descriptions.Item>
          </Descriptions>

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
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
          >
            <Descriptions.Item label="Deployed By">
              {change.deployment.deployedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Deployed At">
              {dayjs(change.deployment.deployedAt).format("MMM D, YYYY h:mm A")}
            </Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>
              {change.deployment.notes || "No notes"}
            </Descriptions.Item>
            <Descriptions.Item label="Verification">
              {change.deployment.verificationStatus === "pending" && (
                <Tag value="pending">Pending</Tag>
              )}
              {change.deployment.verificationStatus === "confirmed" && (
                <Tag value="approved">Confirmed Working</Tag>
              )}
              {change.deployment.verificationStatus === "issues_found" && (
                <Tag value="rejected">Issues Found</Tag>
              )}
            </Descriptions.Item>
            {change.deployment.signedOffBy && (
              <Descriptions.Item label="Signed Off By">
                {change.deployment.signedOffBy} on{" "}
                {dayjs(change.deployment.signedOffAt).format(
                  "MMM D, YYYY h:mm A",
                )}
              </Descriptions.Item>
            )}
          </Descriptions>

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
        <Descriptions
          bordered
          size="small"
          column={1}
          labelStyle={{ fontWeight: 600, fontSize: 12 }}
        >
          <Descriptions.Item label="Steps">
            <p className="whitespace-pre-wrap">{change.rollbackPlan.steps}</p>
          </Descriptions.Item>
          <Descriptions.Item label="Responsible Person">
            {change.rollbackPlan.responsiblePerson}
          </Descriptions.Item>
          <Descriptions.Item label="Estimated Time">
            {change.rollbackPlan.estimatedTime}
          </Descriptions.Item>
          <Descriptions.Item label="Dependencies">
            {change.rollbackPlan.dependencies}
          </Descriptions.Item>
        </Descriptions>
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

        {/* Global actions: Expand/Collapse All */}
        <div className="flex items-center gap-2">
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
          {/* Submit Decision (if active) */}
          {canApprove && (
            <div className="card space-y-4 p-5">
              <div className="border-b pb-3">
                <h3 className="text-primary-alpha flex items-center gap-2 text-sm font-bold">
                  <FaCheck className="text-green-500 h-4 w-4" />
                  Submit Decision
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Decision</Label>
                  <Radio.Group
                    value={approvalAction}
                    onChange={(e) => setApprovalAction(e.target.value)}
                    className="flex flex-col gap-2 mt-1"
                  >
                    <Radio value="approved">Approve</Radio>
                    <Radio value="rejected">Reject</Radio>
                    <Radio value="info_requested">Request More Info</Radio>
                  </Radio.Group>
                </div>

                <div>
                  <Label>Comment</Label>
                  <TextArea
                    rows={3}
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Add a comment for the requester..."
                    className={FORM.TEXTAREA_CLASS_NAME}
                  />
                </div>

                {(isAdmin || currentUser.department === "IT") && (
                  <div className="space-y-4 border-t pt-3 border-border/40">
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

                <Button
                  type="primary"
                  onClick={handleApprovalSubmit}
                  className="w-full"
                >
                  <FaPaperPlane className="mr-1.5 h-3 w-3" />
                  Submit Decision
                </Button>
              </div>
            </div>
          )}

          {/* Approval History */}
          <div className="card space-y-4 p-5">
            <div className="border-b pb-3">
              <h3 className="text-primary-alpha text-sm font-bold">
                Approval History
              </h3>
            </div>
            {change.approvals.length === 0 ? (
              <p className="text-fade-2 text-xs italic">No approvals yet.</p>
            ) : (
              <div className="space-y-3">
                {change.approvals.map((a, i) => (
                  <div
                    key={i}
                    className="bg-secondary flex items-start gap-3 rounded-lg border p-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary-alpha font-semibold truncate">
                          {a.approverName}
                        </span>
                        {approvalActionLabel(a.action)}
                      </div>
                      {a.comment && (
                        <p className="text-fade mt-1.5 italic">"{a.comment}"</p>
                      )}
                      <div className="text-fade-2 mt-2 flex flex-col gap-1 text-[10px] border-t border-border/40 pt-1.5">
                        <span>
                          {dayjs(a.timestamp).format("MMM D, YYYY h:mm A")}
                        </span>
                        {a.handledInHouse !== undefined && (
                          <span>
                            Handled:{" "}
                            {a.handledInHouse ? "In-house" : "Externally"}
                          </span>
                        )}
                        {a.costInvolved && (
                          <span>
                            Cost: ${a.estimatedCost?.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline & Audit Trail */}
          <div className="card space-y-4 p-5">
            <div className="border-b pb-3">
              <h3 className="text-primary-alpha flex items-center gap-2 text-sm font-bold">
                <FaClockRotateLeft className="text-primary h-4.5 w-4.5" />
                Audit Trail
              </h3>
            </div>
            {change.timeline.length === 0 ? (
              <p className="text-fade-2 text-xs italic">No events yet.</p>
            ) : (
              <div className="relative space-y-0 text-xs max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {change.timeline.map((event, idx) => (
                  <div key={idx} className="relative flex gap-3 pb-5">
                    {/* Line */}
                    {idx < change.timeline.length - 1 && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950" />
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-primary-alpha font-semibold truncate">
                          {event.actorName}
                        </span>
                        <span className="text-fade-2 text-[10px]">
                          {dayjs(event.timestamp).fromNow()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-fade-2 font-medium">
                          {event.action}
                        </span>
                        <Tag
                          value={event.stage}
                          format={false}
                          className="px-1! py-0.5! text-[9px]! leading-none!"
                        >
                          {event.stage}
                        </Tag>
                      </div>
                      {event.comment && (
                        <p className="text-fade-2 mt-1 italic text-[11px]">
                          "{event.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Discussion */}
          <div className="card space-y-4 p-5">
            <div className="border-b pb-3">
              <h3 className="text-primary-alpha text-sm font-bold">Comments</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {topLevelComments.length === 0 && (
                <p className="text-fade-2 text-xs italic">No comments yet.</p>
              )}
              {topLevelComments.map((c) => renderComment(c))}
            </div>

            {/* Add comment form */}
            <div className="mt-3 border-t pt-3">
              <Label className="text-xs">Add Comment</Label>
              <div className="flex flex-col gap-2 mt-1">
                <TextArea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className={cn(FORM.TEXTAREA_CLASS_NAME, "w-full")}
                />
                <Button
                  type="primary"
                  onClick={() => handleAddComment()}
                  className="w-full flex items-center justify-center gap-1.5"
                  disabled={!newComment.trim()}
                >
                  <FaPaperPlane className="h-3 w-3" />
                  Send Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeDetail;
