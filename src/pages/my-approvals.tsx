import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type TableProps } from "antd";
import { ClipboardCheck, History } from "lucide-react";
import { useAppSelector } from "../state/store";
import type { ChangeRequest } from "../state/slices/changes-slice";
import Tag from "../components/ui/tag";
import { DataTable } from "../components/ui/data-table";

export const MyApprovals: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserId, activeRoles } = useAppSelector((state) => state.auth);
  const { changes } = useAppSelector((state) => state.changes);

  // Filter to changes awaiting current user's approval action
  const pendingApprovals = useMemo(() => {
    return changes.filter((c) => {
      // Must be submitted or under review
      if (c.status !== "Submitted" && c.status !== "Under Review") return false;

      // Don't show user's own requests (can't approve your own)
      if (c.submitterId === currentUserId) return false;

      // User must have Approver or Admin role
      if (!activeRoles.includes("Approver") && !activeRoles.includes("Admin")) {
        return false;
      }

      // Check if user already approved/rejected this change
      const alreadyActioned = c.approvals.some(
        (a) => a.approverId === currentUserId,
      );
      if (alreadyActioned) return false;

      return true;
    });
  }, [changes, currentUserId, activeRoles]);

  // Also include queried changes where user is the submitter (needs their response)
  const queriedForMe = useMemo(() => {
    return changes.filter(
      (c) => c.isQueried && c.submitterId === currentUserId,
    );
  }, [changes, currentUserId]);

  const allActionable = useMemo(
    () => [...pendingApprovals, ...queriedForMe],
    [pendingApprovals, queriedForMe],
  );

  // Approval history: changes where the current user has already taken action
  const approvalHistory = useMemo(() => {
    return changes.filter((c) =>
      c.approvals.some((a) => a.approverId === currentUserId),
    );
  }, [changes, currentUserId]);

  const columns: TableProps<ChangeRequest>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id: string) => (
        <span className="text-primary-alpha truncate font-bold">{id}</span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string) => (
        <span className="text-primary-alpha font-medium">{title}</span>
      ),
    },
    {
      title: "Submitter",
      key: "submitter",
      width: 180,
      render: (_: unknown, record: ChangeRequest) => (
        <div className="leading-tight">
          <div className="text-primary-alpha font-bold">
            {record.submitterName}
          </div>
          <span className="text-body-xs text-fade-2 font-medium">
            {record.submitterDepartment}
          </span>
        </div>
      ),
    },
    {
      title: "System",
      dataIndex: "systemAffected",
      key: "system",
      width: 120,
      render: (system: string) => (
        <span className="text-fade font-medium">{system}</span>
      ),
    },
    {
      title: "Risk",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 90,
      render: (risk: string) => <Tag value={risk}>{risk}</Tag>,
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_: unknown, record: ChangeRequest) => (
        <Tag
          value={record.isQueried ? "Queried" : record.status}
          format={false}
        >
          {record.isQueried ? "Queried" : record.status}
        </Tag>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (date: string) => (
        <span className="text-fade text-xs font-medium whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      {/* <div className="card flex items-center justify-between p-4 px-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-body-md text-primary-alpha font-bold">
              Approval Queue
            </h2>
            <p className="text-body-xs text-fade-2 font-medium">
              {allActionable.length} request{allActionable.length !== 1 ? "s" : ""}{" "}
              awaiting your action
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-fade text-xs font-medium">
              Pending: {pendingApprovals.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-fade text-xs font-medium">
              Queried: {queriedForMe.length}
            </span>
          </div>
        </div>
      </div> */}

      {/* Pending Approvals Table */}
      {allActionable.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="bg-bg-muted border-border-muted text-fade-2 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <h3 className="card-title">No pending approvals</h3>
          <p className="card-description mx-auto mt-1 max-w-sm">
            You have no change requests awaiting your review or approval at this
            time.
          </p>
        </div>
      ) : (
        <DataTable
          name="pending approvals"
          rowKey="id"
          columns={columns}
          dataSource={allActionable}
          left={[
            <span key="title" className="text-body-md text-fade font-bold">
              Pending Approvals ({allActionable.length})
            </span>,
          ]}
          search={{
            placeholder: "Search approvals...",
            position: "right",
          }}
          onRow={(record) => ({
            className: "cursor-pointer",
            onClick: () => navigate(`/self/changes/${record.id}`),
          })}
        />
      )}

      {/* Approval History Table */}
      {approvalHistory.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="bg-bg-muted border-border-muted text-fade-2 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
            <History className="h-6 w-6" />
          </div>
          <h3 className="card-title">No approval history</h3>
          <p className="card-description mx-auto mt-1 max-w-sm">
            Your past approval actions will appear here.
          </p>
        </div>
      ) : (
        <DataTable
          name="approval history"
          rowKey="id"
          columns={columns}
          dataSource={approvalHistory}
          left={[
            <span key="title" className="text-body-md text-fade font-bold">
              Approval History ({approvalHistory.length})
            </span>,
          ]}
          search={{
            placeholder: "Search history...",
            position: "right",
          }}
          onRow={(record) => ({
            className: "cursor-pointer",
            onClick: () => navigate(`/self/changes/${record.id}`),
          })}
        />
      )}
    </div>
  );
};

export default MyApprovals;
