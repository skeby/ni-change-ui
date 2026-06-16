import React, { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "../state/store"
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
} from "../state/slices/changes-slice"
import {
  Button,
  Input,
  Radio,
  Modal,
  Descriptions,
  Checkbox,
  InputNumber,
  Segmented,
  Empty,
  Tooltip,
} from "antd"
import Tag from "../components/ui/tag"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { cn } from "../utils/cn"
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
  FaShieldHalved,
} from "react-icons/fa6"
import Label from "../components/ui/label"

dayjs.extend(relativeTime)

const { TextArea } = Input

// ---------------------------------------------------------------------------
// Status + Risk badge helpers
// ---------------------------------------------------------------------------

const StatusTag: React.FC<{ status: ChangeStatus }> = ({ status }) => (
  <Tag value={status} format={false}>
    {status}
  </Tag>
)

const RiskTag: React.FC<{ level: RiskLevel }> = ({ level }) => (
  <Tag value={level}>{level} Risk</Tag>
)

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

const Section: React.FC<{
  title: string
  icon?: React.ReactNode
  extra?: React.ReactNode
  children: React.ReactNode
  className?: string
}> = ({ title, icon, extra, children, className }) => (
  <div className={cn("card-glass rounded-xl p-5", className)}>
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-primary-alpha flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </h3>
      {extra}
    </div>
    {children}
  </div>
)

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = "overview" | "testing" | "deployment" | "rollback" | "timeline"

const TAB_OPTIONS: { label: string; value: TabKey; icon: React.ReactNode }[] = [
  { label: "Overview", value: "overview", icon: <FaCircleInfo className="h-3.5 w-3.5" /> },
  { label: "Testing", value: "testing", icon: <FaFlask className="h-3.5 w-3.5" /> },
  { label: "Deployment", value: "deployment", icon: <FaRocket className="h-3.5 w-3.5" /> },
  { label: "Rollback", value: "rollback", icon: <FaRotateLeft className="h-3.5 w-3.5" /> },
  { label: "Timeline", value: "timeline", icon: <FaClockRotateLeft className="h-3.5 w-3.5" /> },
]

// =========================================================================
// Main component
// =========================================================================

export const ChangeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { changes } = useAppSelector((state) => state.changes)
  const { currentUserId, users, activeRoles } = useAppSelector((state) => state.auth)
  const settings = useAppSelector((state) => state.settings)

  const currentUser = users.find((u) => u.id === currentUserId) || users[0]
  const change = useMemo(() => changes.find((c) => c.id === id), [changes, id])

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  // ---- Approval form state ----
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected" | "info_requested">("approved")
  const [approvalComment, setApprovalComment] = useState("")
  const [handledInHouse, setHandledInHouse] = useState(true)
  const [costInvolved, setCostInvolved] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)

  // ---- Testing state ----
  const [testPlanDraft, setTestPlanDraft] = useState("")
  const [testNotes, setTestNotes] = useState<Record<string, string>>({})

  // ---- Deployment state ----
  const [deployNotes, setDeployNotes] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"confirmed" | "issues_found">("confirmed")

  // ---- Rollback state ----
  const [rollbackSteps, setRollbackSteps] = useState("")
  const [rollbackPerson, setRollbackPerson] = useState("")
  const [rollbackTime, setRollbackTime] = useState("")
  const [rollbackDeps, setRollbackDeps] = useState("")

  // ---- Comment state ----
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Sync local state when change loads
  React.useEffect(() => {
    if (change) {
      setTestPlanDraft(change.testPlan || "")
      if (change.rollbackPlan) {
        setRollbackSteps(change.rollbackPlan.steps)
        setRollbackPerson(change.rollbackPlan.responsiblePerson)
        setRollbackTime(change.rollbackPlan.estimatedTime)
        setRollbackDeps(change.rollbackPlan.dependencies)
      }
    }
  }, [change?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derived permissions
  const isApprover = activeRoles.includes("Approver") || activeRoles.includes("Admin")
  const isTester = activeRoles.includes("Tester")
  const isAdmin = activeRoles.includes("Admin")
  const canApprove = isApprover && change && ["Under Review", "Submitted"].includes(change.status)
  const canTest = isTester && change?.status === "In Testing"
  const canDeploy = change && ["Testing Complete", "Awaiting Deployment"].includes(change.status)
  const isDeployed = !!change?.deployment

  // Test checklist from settings
  const testChecklist = useMemo(() => {
    if (!change) return null
    return settings.testChecklists.find((tc) => tc.category === change.category)
  }, [change, settings.testChecklists])

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
    )
  }

  // -----------------------------------------------------------------------
  // Action handlers
  // -----------------------------------------------------------------------

  const handleApprovalSubmit = () => {
    if (!approvalComment.trim() && approvalAction !== "approved") return

    const approval = {
      approverId: currentUser.id,
      approverName: currentUser.name,
      action: approvalAction,
      timestamp: new Date().toISOString(),
      comment: approvalComment || undefined,
      handledInHouse: isAdmin ? handledInHouse : undefined,
      costInvolved: isAdmin ? costInvolved : undefined,
      estimatedCost: isAdmin && costInvolved ? estimatedCost : undefined,
    }

    dispatch(addApproval({ id: change.id, approval }))

    const newStatus: ChangeStatus =
      approvalAction === "approved"
        ? "Approved"
        : approvalAction === "rejected"
          ? "Rejected"
          : change.status

    if (approvalAction !== "info_requested") {
      dispatch(updateChange({ id: change.id, updates: { status: newStatus } }))
    } else {
      dispatch(updateChange({ id: change.id, updates: { isQueried: true, queryComment: approvalComment } }))
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
      })
    )

    setApprovalComment("")
    setApprovalAction("approved")
    setCostInvolved(false)
    setEstimatedCost(0)
  }

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
      })
    )
  }

  const handleSaveTestPlan = () => {
    dispatch(updateChange({ id: change.id, updates: { testPlan: testPlanDraft } }))
  }

  const handleAutoGenerateTests = () => {
    if (!testChecklist) return
    const newSteps: TestStep[] = testChecklist.items.map((item, idx) => ({
      id: `ts-gen-${Date.now()}-${idx}`,
      description: item,
      expectedOutcome: "Passes successfully",
      result: "pending" as const,
      notes: "",
    }))
    dispatch(updateChange({ id: change.id, updates: { testSteps: [...change.testSteps, ...newSteps] } }))
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
      })
    )
  }

  const handleMarkTestingComplete = () => {
    dispatch(updateChange({ id: change.id, updates: { status: "Testing Complete" } }))
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
      })
    )
  }

  const handleUploadEvidence = () => {
    const mockFile = {
      id: `ev-${Date.now()}`,
      name: `evidence-${Date.now()}.png`,
      type: "image/png",
      size: Math.floor(Math.random() * 500000) + 50000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id,
    }
    dispatch(addEvidence({ changeId: change.id, evidence: mockFile }))
  }

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
      })
    )
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
      })
    )
  }

  const handlePostDeployVerification = () => {
    if (!change.deployment) return
    dispatch(
      updateChange({
        id: change.id,
        updates: {
          deployment: { ...change.deployment, verificationStatus },
          status: verificationStatus === "confirmed" ? "Post-Deployment Review" : "Deployed",
        },
      })
    )
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
      })
    )
  }

  const handleSignOff = () => {
    if (!change.deployment) return
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
      })
    )
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
      })
    )
  }

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
      })
    )
  }

  const handleExecuteRollback = () => {
    Modal.confirm({
      title: "Execute Rollback",
      content: "Are you sure you want to roll back this deployment? This action will change the status to Rolled Back.",
      okText: "Yes, Roll Back",
      okButtonProps: { danger: true },
      onOk: () => {
        dispatch(updateChange({ id: change.id, updates: { status: "Rolled Back" } }))
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
          })
        )
      },
    })
  }

  const handleAddComment = (parentId?: string) => {
    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    const comment: ChangeComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      parentId,
    }

    dispatch(addComment({ id: change.id, comment }))

    if (parentId) {
      setReplyingTo(null)
      setReplyContent("")
    } else {
      setNewComment("")
    }
  }

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const approvalActionLabel = (action: string) => {
    switch (action) {
      case "approved":
        return <Tag value="approved">Approved</Tag>
      case "rejected":
        return <Tag value="rejected">Rejected</Tag>
      case "info_requested":
        return <Tag value="info_requested">Info Requested</Tag>
      default:
        return <Tag>{action}</Tag>
    }
  }

  // -----------------------------------------------------------------------
  // TAB: Overview
  // -----------------------------------------------------------------------

  const renderOverview = () => (
    <div className="space-y-5">
      {/* Details grid */}
      <Section title="Change Details" icon={<FaCircleInfo className="text-blue-500" />}>
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
          labelStyle={{ fontWeight: 600, fontSize: 12 }}
          contentStyle={{ fontSize: 13 }}
        >
          <Descriptions.Item label="System">{change.systemAffected}</Descriptions.Item>
          <Descriptions.Item label="Category">
            <Tag>{change.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Risk Level">
            <RiskTag level={change.riskLevel} />
            {change.riskOverridden && (
              <Tooltip title={change.riskOverrideJustification || "Risk was manually overridden"}>
                <Tag color="#f59e0b" className="ml-1">Overridden</Tag>
              </Tooltip>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Submitter">{change.submitterName}</Descriptions.Item>
          <Descriptions.Item label="Department">{change.submitterDepartment}</Descriptions.Item>
          <Descriptions.Item label="Requested Timeline">{dayjs(change.requestedTimeline).format("MMM D, YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Created">{dayjs(change.createdAt).format("MMM D, YYYY h:mm A")}</Descriptions.Item>
          <Descriptions.Item label="Last Updated">{dayjs(change.updatedAt).format("MMM D, YYYY h:mm A")}</Descriptions.Item>
          {change.selectedApprover && (
            <Descriptions.Item label="Assigned Approver">
              {users.find((u) => u.id === change.selectedApprover)?.name || change.selectedApprover}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Section>

      {/* Description */}
      <Section title="Description">
        <p className="text-primary-alpha whitespace-pre-wrap text-sm leading-relaxed">{change.description}</p>
      </Section>

      {/* Business Justification */}
      <Section title="Business Justification">
        <p className="text-primary-alpha whitespace-pre-wrap text-sm leading-relaxed">{change.businessJustification}</p>
      </Section>

      {/* AI Request Data */}
      {change.aiRequest && (
        <Section title="AI Request Data" icon={<FaShieldHalved className="text-purple-500" />}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
            contentStyle={{ fontSize: 13 }}
          >
            <Descriptions.Item label="Frequency">{change.aiRequest.frequency}</Descriptions.Item>
            <Descriptions.Item label="Rule Engine">{change.aiRequest.ruleEngine}</Descriptions.Item>
            <Descriptions.Item label="AI/ML">{change.aiRequest.aiMl}</Descriptions.Item>
            <Descriptions.Item label="Human Review">{change.aiRequest.human}</Descriptions.Item>
            <Descriptions.Item label="Statistical Modeling">{change.aiRequest.statisticalModeling}</Descriptions.Item>
            <Descriptions.Item label="Problem Complexity">{change.aiRequest.problemComplexity}</Descriptions.Item>
            <Descriptions.Item label="Problem Description" span={2}>{change.aiRequest.problemDescription}</Descriptions.Item>
            <Descriptions.Item label="Current Solution" span={2}>{change.aiRequest.currentSolution}</Descriptions.Item>
            <Descriptions.Item label="Success Metrics" span={2}>{change.aiRequest.successMetrics}</Descriptions.Item>
            <Descriptions.Item label="Simpler Alternative">{change.aiRequest.simplerAlternative}</Descriptions.Item>
            <Descriptions.Item label="Global Use">{change.aiRequest.globalUse}</Descriptions.Item>
            <Descriptions.Item label="Requires Staff Data">{change.aiRequest.requiresStaffData}</Descriptions.Item>
            <Descriptions.Item label="Requires Sensitive Data">{change.aiRequest.requiresSensitiveData}</Descriptions.Item>
            <Descriptions.Item label="External Users">{change.aiRequest.externalUsers}</Descriptions.Item>
            <Descriptions.Item label="Internal Only">{change.aiRequest.internalOnly}</Descriptions.Item>
            <Descriptions.Item label="Both Users">{change.aiRequest.bothUsers}</Descriptions.Item>
            <Descriptions.Item label="Duration">{change.aiRequest.duration}</Descriptions.Item>
          </Descriptions>
        </Section>
      )}

      {/* Approval History */}
      <Section title="Approval History">
        {change.approvals.length === 0 ? (
          <p className="text-fade-2 text-sm italic">No approvals yet.</p>
        ) : (
          <div className="space-y-3">
            {change.approvals.map((a, i) => (
              <div
                key={i}
                className="bg-secondary flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary-alpha text-sm font-semibold">{a.approverName}</span>
                    {approvalActionLabel(a.action)}
                  </div>
                  {a.comment && (
                    <p className="text-fade-2 mt-1 text-sm">{a.comment}</p>
                  )}
                  <div className="text-fade-2 mt-1 flex flex-wrap gap-3 text-xs">
                    <span>{dayjs(a.timestamp).format("MMM D, YYYY h:mm A")}</span>
                    {a.handledInHouse !== undefined && (
                      <span>Handled: {a.handledInHouse ? "In-house" : "Externally"}</span>
                    )}
                    {a.costInvolved && (
                      <span>Cost: ${a.estimatedCost?.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Approval Action (if permitted) */}
      {canApprove && (
        <Section title="Submit Decision" icon={<FaCheck className="text-green-500" />}>
          <div className="space-y-4">
            <div>
              <Label>Decision</Label>
              <Radio.Group
                value={approvalAction}
                onChange={(e) => setApprovalAction(e.target.value)}
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
              />
            </div>

            {(isAdmin || currentUser.department === "IT") && (
              <>
                <div>
                  <Label>Handled in-house or externally?</Label>
                  <Radio.Group
                    value={handledInHouse}
                    onChange={(e) => setHandledInHouse(e.target.value)}
                  >
                    <Radio value={true}>In-house</Radio>
                    <Radio value={false}>Externally</Radio>
                  </Radio.Group>
                </div>

                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={costInvolved}
                    onChange={(e) => setCostInvolved(e.target.checked)}
                  >
                    Cost involved?
                  </Checkbox>
                  {costInvolved && (
                    <InputNumber
                      min={0}
                      value={estimatedCost}
                      onChange={(val) => setEstimatedCost(val || 0)}
                      prefix="$"
                      placeholder="Estimated cost"
                      className="w-40"
                    />
                  )}
                </div>
              </>
            )}

            <Button type="primary" onClick={handleApprovalSubmit}>
              <FaPaperPlane className="mr-1.5 h-3 w-3" />
              Submit Decision
            </Button>
          </div>
        </Section>
      )}
    </div>
  )

  // -----------------------------------------------------------------------
  // TAB: Testing
  // -----------------------------------------------------------------------

  const allTestsDecided = change.testSteps.length > 0 && change.testSteps.every((s) => s.result !== "pending")

  const renderTesting = () => (
    <div className="space-y-5">
      {/* Test Plan */}
      <Section title="Test Plan" icon={<FaFlask className="text-purple-500" />}>
        <TextArea
          rows={4}
          value={testPlanDraft}
          onChange={(e) => setTestPlanDraft(e.target.value)}
          placeholder="Describe the test plan for this change..."
          disabled={!canTest}
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
      </Section>

      {/* Test Steps */}
      <Section title="Test Checklist">
        {change.testSteps.length === 0 ? (
          <div className="text-center">
            <p className="text-fade-2 mb-3 text-sm italic">No test steps defined yet.</p>
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
                  step.result === "pass" && "border-green-200 bg-green-50/30 dark:border-green-900/40 dark:bg-green-950/10",
                  step.result === "fail" && "border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/10",
                  step.result === "pending" && "bg-secondary"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-primary-alpha text-sm font-medium">{step.description}</p>
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
                      className={step.result === "pass" ? "!bg-green-600 !border-green-600" : ""}
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
                        setTestNotes((prev) => ({ ...prev, [step.id]: e.target.value }))
                      }
                      className="ml-2 flex-1"
                    />
                  </div>
                )}

                {step.completedBy && (
                  <p className="text-fade-2 mt-2 text-xs">
                    Completed by {users.find((u) => u.id === step.completedBy)?.name || step.completedBy}
                    {step.completedAt && <> on {dayjs(step.completedAt).format("MMM D, YYYY h:mm A")}</>}
                    {step.notes && <> &mdash; {step.notes}</>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {canTest && allTestsDecided && (
          <div className="mt-4 border-t pt-4">
            <Button type="primary" onClick={handleMarkTestingComplete}>
              <FaCheck className="mr-1.5 h-3 w-3" />
              Mark Testing Complete
            </Button>
          </div>
        )}
      </Section>

      {/* Evidence */}
      <Section
        title="Evidence"
        icon={<FaFile className="text-cyan-500" />}
        extra={
          canTest ? (
            <Button size="small" onClick={handleUploadEvidence}>
              <FaUpload className="mr-1.5 h-3 w-3" />
              Upload Evidence
            </Button>
          ) : undefined
        }
      >
        {change.evidence.length === 0 ? (
          <p className="text-fade-2 text-sm italic">No evidence files uploaded.</p>
        ) : (
          <div className="space-y-2">
            {change.evidence.map((ev) => (
              <div
                key={ev.id}
                className="bg-secondary flex items-center gap-3 rounded-lg border p-3"
              >
                <FaFile className="text-fade-2 h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-primary-alpha truncate text-sm font-medium">{ev.name}</p>
                  <p className="text-fade-2 text-xs">
                    {ev.type} &middot; {formatBytes(ev.size)} &middot; Uploaded{" "}
                    {dayjs(ev.uploadedAt).format("MMM D, YYYY h:mm A")} by{" "}
                    {users.find((u) => u.id === ev.uploadedBy)?.name || ev.uploadedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )

  // -----------------------------------------------------------------------
  // TAB: Deployment
  // -----------------------------------------------------------------------

  const renderDeployment = () => (
    <div className="space-y-5">
      {!isDeployed && canDeploy && (
        <Section title="Deploy to Production" icon={<FaRocket className="text-cyan-500" />}>
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1} labelStyle={{ fontWeight: 600, fontSize: 12 }}>
              <Descriptions.Item label="Deployed By">{currentUser.name}</Descriptions.Item>
              <Descriptions.Item label="Date/Time">{dayjs().format("MMM D, YYYY h:mm A")}</Descriptions.Item>
            </Descriptions>

            <div>
              <Label>Deployment Notes</Label>
              <TextArea
                rows={3}
                value={deployNotes}
                onChange={(e) => setDeployNotes(e.target.value)}
                placeholder="Describe what was deployed and any relevant details..."
              />
            </div>

            <Button type="primary" onClick={handleDeploy}>
              <FaRocket className="mr-1.5 h-3 w-3" />
              Deploy
            </Button>
          </div>
        </Section>
      )}

      {!isDeployed && !canDeploy && (
        <Section title="Deployment">
          <Empty description={`Deployment is not available in the current status (${change.status}).`} />
        </Section>
      )}

      {isDeployed && change.deployment && (
        <>
          <Section title="Deployment Details" icon={<FaRocket className="text-green-500" />}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} labelStyle={{ fontWeight: 600, fontSize: 12 }}>
              <Descriptions.Item label="Deployed By">{change.deployment.deployedBy}</Descriptions.Item>
              <Descriptions.Item label="Deployed At">{dayjs(change.deployment.deployedAt).format("MMM D, YYYY h:mm A")}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{change.deployment.notes || "No notes"}</Descriptions.Item>
              <Descriptions.Item label="Verification">
                {change.deployment.verificationStatus === "pending" && <Tag value="pending">Pending</Tag>}
                {change.deployment.verificationStatus === "confirmed" && <Tag value="approved">Confirmed Working</Tag>}
                {change.deployment.verificationStatus === "issues_found" && <Tag value="rejected">Issues Found</Tag>}
              </Descriptions.Item>
              {change.deployment.signedOffBy && (
                <Descriptions.Item label="Signed Off By">
                  {change.deployment.signedOffBy} on {dayjs(change.deployment.signedOffAt).format("MMM D, YYYY h:mm A")}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Section>

          {/* Post-deployment verification */}
          {change.deployment.verificationStatus === "pending" && (
            <Section title="Post-Deployment Verification">
              <div className="space-y-4">
                <div>
                  <Label>Verification Result</Label>
                  <Radio.Group
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value)}
                  >
                    <Radio value="confirmed">Confirmed Working</Radio>
                    <Radio value="issues_found">Issues Found</Radio>
                  </Radio.Group>
                </div>
                <Button type="primary" onClick={handlePostDeployVerification}>
                  Submit Verification
                </Button>
              </div>
            </Section>
          )}

          {/* Sign-off */}
          {change.deployment.verificationStatus === "confirmed" && !change.deployment.signedOffBy && (
            <Section title="Sign-Off">
              <p className="text-fade-2 mb-3 text-sm">
                Deployment has been verified as working. Submit your sign-off to close this change request.
              </p>
              <Button type="primary" onClick={handleSignOff}>
                <FaCheck className="mr-1.5 h-3 w-3" />
                Sign Off and Close
              </Button>
            </Section>
          )}
        </>
      )}
    </div>
  )

  // -----------------------------------------------------------------------
  // TAB: Rollback
  // -----------------------------------------------------------------------

  const rollbackEditable = !isDeployed

  const renderRollback = () => (
    <div className="space-y-5">
      <Section title="Rollback Plan" icon={<FaRotateLeft className="text-orange-500" />}>
        {rollbackEditable ? (
          <div className="space-y-4">
            <div>
              <Label>Rollback Steps</Label>
              <TextArea
                rows={4}
                value={rollbackSteps}
                onChange={(e) => setRollbackSteps(e.target.value)}
                placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Responsible Person</Label>
                <Input
                  value={rollbackPerson}
                  onChange={(e) => setRollbackPerson(e.target.value)}
                  placeholder="Who will execute the rollback?"
                />
              </div>
              <div>
                <Label>Estimated Time</Label>
                <Input
                  value={rollbackTime}
                  onChange={(e) => setRollbackTime(e.target.value)}
                  placeholder="e.g. 30 minutes, 2 hours"
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
              />
            </div>
            <Button type="primary" onClick={handleSaveRollbackPlan}>
              Save Rollback Plan
            </Button>
          </div>
        ) : change.rollbackPlan ? (
          <Descriptions bordered size="small" column={1} labelStyle={{ fontWeight: 600, fontSize: 12 }}>
            <Descriptions.Item label="Steps">
              <p className="whitespace-pre-wrap">{change.rollbackPlan.steps}</p>
            </Descriptions.Item>
            <Descriptions.Item label="Responsible Person">{change.rollbackPlan.responsiblePerson}</Descriptions.Item>
            <Descriptions.Item label="Estimated Time">{change.rollbackPlan.estimatedTime}</Descriptions.Item>
            <Descriptions.Item label="Dependencies">{change.rollbackPlan.dependencies}</Descriptions.Item>
          </Descriptions>
        ) : (
          <p className="text-fade-2 text-sm italic">No rollback plan defined.</p>
        )}
      </Section>

      {/* Execute Rollback button */}
      {isDeployed && change.deployment?.verificationStatus === "issues_found" && change.status !== "Rolled Back" && (
        <Section title="Execute Rollback">
          <p className="text-fade-2 mb-3 text-sm">
            Issues were found during post-deployment verification. You can execute the rollback plan to revert the deployment.
          </p>
          <Button danger type="primary" onClick={handleExecuteRollback}>
            <FaRotateLeft className="mr-1.5 h-3 w-3" />
            Execute Rollback
          </Button>
        </Section>
      )}
    </div>
  )

  // -----------------------------------------------------------------------
  // TAB: Timeline + Comments
  // -----------------------------------------------------------------------

  const topLevelComments = change.comments.filter((c) => !c.parentId)
  const repliesMap = useMemo(() => {
    const map: Record<string, ChangeComment[]> = {}
    change.comments.forEach((c) => {
      if (c.parentId) {
        if (!map[c.parentId]) map[c.parentId] = []
        map[c.parentId].push(c)
      }
    })
    return map
  }, [change.comments])

  const renderComment = (comment: ChangeComment, depth: number = 0) => (
    <div key={comment.id} className={cn("space-y-2", depth > 0 && "ml-8 border-l-2 border-blue-200 pl-4 dark:border-blue-800")}>
      <div className="bg-secondary rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="text-primary-alpha text-sm font-semibold">{comment.authorName}</span>
          <span className="text-fade-2 text-xs">{dayjs(comment.timestamp).fromNow()}</span>
        </div>
        <p className="text-primary-alpha mt-1 text-sm">{comment.content}</p>
        <Button
          type="link"
          size="small"
          className="mt-1 !p-0 text-xs"
          onClick={() => {
            setReplyingTo(replyingTo === comment.id ? null : comment.id)
            setReplyContent("")
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
              className="flex-1"
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
      {(repliesMap[comment.id] || []).map((reply) => renderComment(reply, depth + 1))}
    </div>
  )

  const renderTimeline = () => (
    <div className="space-y-5">
      {/* Audit Trail */}
      <Section title="Audit Trail" icon={<FaClockRotateLeft className="text-blue-500" />}>
        {change.timeline.length === 0 ? (
          <p className="text-fade-2 text-sm italic">No events yet.</p>
        ) : (
          <div className="relative space-y-0">
            {change.timeline.map((event, idx) => (
              <div key={idx} className="relative flex gap-4 pb-5">
                {/* Line */}
                {idx < change.timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                {/* Dot */}
                <div className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950" />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-primary-alpha text-sm font-semibold">{event.actorName}</span>
                    <Tag value={event.stage} format={false}>
                      {event.stage}
                    </Tag>
                  </div>
                  <p className="text-primary-alpha mt-0.5 text-sm">{event.action}</p>
                  {event.comment && (
                    <p className="text-fade-2 mt-0.5 text-xs italic">"{event.comment}"</p>
                  )}
                  <p className="text-fade-2 mt-0.5 text-xs">
                    {dayjs(event.timestamp).format("MMM D, YYYY h:mm A")} ({dayjs(event.timestamp).fromNow()})
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Comments */}
      <Section title="Comments">
        <div className="space-y-3">
          {topLevelComments.length === 0 && (
            <p className="text-fade-2 text-sm italic">No comments yet.</p>
          )}
          {topLevelComments.map((c) => renderComment(c))}
        </div>

        {/* Add comment form */}
        <div className="mt-4 border-t pt-4">
          <Label>Add Comment</Label>
          <div className="flex gap-2">
            <TextArea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button
              type="primary"
              onClick={() => handleAddComment()}
              className="self-end"
              disabled={!newComment.trim()}
            >
              <FaPaperPlane className="mr-1.5 h-3 w-3" />
              Send
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )

  // -----------------------------------------------------------------------
  // Tab content switch
  // -----------------------------------------------------------------------

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview()
      case "testing":
        return renderTesting()
      case "deployment":
        return renderDeployment()
      case "rollback":
        return renderRollback()
      case "timeline":
        return renderTimeline()
      default:
        return null
    }
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button type="text" onClick={() => navigate(-1)} className="!px-2">
            <FaArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-primary-alpha text-lg font-bold">{change.id}</h1>
              <StatusTag status={change.status} />
              <RiskTag level={change.riskLevel} />
            </div>
            <h2 className="text-primary-alpha mt-0.5 text-base font-medium">{change.title}</h2>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <Segmented
        options={TAB_OPTIONS.map((t) => ({
          label: (
            <div className="flex items-center gap-1.5 px-1">
              {t.icon}
              <span>{t.label}</span>
            </div>
          ),
          value: t.value,
        }))}
        value={activeTab}
        onChange={(val) => setActiveTab(val as TabKey)}
        block
        className="premium-segmented"
      />

      {/* Active tab content */}
      <div>{renderActiveTab()}</div>
    </div>
  )
}

export default ChangeDetail
