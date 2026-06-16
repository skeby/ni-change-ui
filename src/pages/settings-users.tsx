import React from "react"
import { type TableProps } from "antd"
import { DataTable } from "../components/ui/data-table"
import { useAppSelector } from "../state/store"
import { type UserProfile } from "../state/slices/auth-slice"
import { Users } from "lucide-react"
import Tag from "../components/ui/tag"

const roleColorMap: Record<string, string> = {
  Requester: "#3b82f6",
  Approver: "#10b981",
  Tester: "#f59e0b",
  Admin: "#ef4444",
}

export const SettingsUsers: React.FC = () => {
  const { users } = useAppSelector((state) => state.auth)

  const columns: TableProps<UserProfile>["columns"] = [
    {
      key: "name",
      dataIndex: "name",
      title: "Name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="bg-bg-muted text-primary-alpha text-body-xs border-border flex h-8 w-8 items-center justify-center rounded-full border font-bold">
            {record.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-primary-alpha font-bold">{record.name}</span>
            <span className="text-fade-2 text-body-xs">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      dataIndex: "department",
      title: "Department",
      render: (_, record) => (
        <span className="text-fade font-semibold">{record.department}</span>
      ),
    },
    {
      key: "roles",
      dataIndex: "baseRoles",
      title: "Roles",
      render: (_, record) => (
        <div className="flex flex-wrap gap-1.5">
          {record.baseRoles.map((role) => (
            <Tag key={role} color={roleColorMap[role] || "#6b7280"}>
              {role}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      key: "office",
      dataIndex: "officeLocation",
      title: "Office",
      render: (_, record) => (
        <span className="text-fade font-semibold">
          {record.officeLocation || "N/A"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <DataTable
        name="users"
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search users...", position: "left" }}
        right={[
          <div
            key="count"
            className="bg-bg-muted text-fade flex items-center gap-2 rounded-xl px-4 py-2"
          >
            <Users className="h-4 w-4" />
            <span className="text-body-xs font-semibold">
              {users.length} users
            </span>
          </div>,
        ]}
      />
    </div>
  )
}

export default SettingsUsers
