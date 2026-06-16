import React, { useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Input, type TableProps, message } from "antd"
import { AiOutlineSearch } from "react-icons/ai"
import { FolderOpen } from "lucide-react"
import { useAppSelector } from "../state/store"
import type {
  ChangeRequest,
  ChangeStatus,
  ChangeCategory,
  RiskLevel,
} from "../state/slices/changes-slice"
import Tag from "../components/ui/tag"
import { DataTable } from "../components/ui/data-table"
import { TableFilter } from "../components/ui/table-filter"
import { DataViewSwitcher } from "../components/ui/data-view-switcher"
import { ChangeCard } from "../components/ui/change-card"

const ALL_STATUSES: ChangeStatus[] = [
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
  "In Testing",
  "Testing Complete",
  "Awaiting Deployment",
  "Deployed",
  "Post-Deployment Review",
  "Closed",
  "Rolled Back",
]

const ALL_RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High"]

const ALL_CATEGORIES: ChangeCategory[] = [
  "New Feature",
  "Bug Fix",
  "Configuration Change",
  "Integration",
  "Security Patch",
  "AI",
]

const FILTER_KEYS = ["status", "riskLevel", "category", "system"]

export const Changes: React.FC = () => {
  const navigate = useNavigate()
  const { changes } = useAppSelector((state) => state.changes)
  const { dataView } = useAppSelector((state) => state.app)

  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")

  // All non-draft changes across the org
  const orgChanges = useMemo(
    () => changes.filter((c) => c.status !== "Draft"),
    [changes]
  )

  const activeFilters = useMemo(() => {
    const filters: Record<string, (string | number)[]> = {}
    FILTER_KEYS.forEach((key) => {
      const val = searchParams.get(key)
      if (val) filters[key] = val.split(",").filter(Boolean)
    })
    return filters
  }, [searchParams])

  const handleFilterChange = (
    newFilters: Record<string, (string | number)[]>
  ) => {
    const newParams = new URLSearchParams(searchParams)
    const hasAnySelection = FILTER_KEYS.some(
      (key) => newFilters[key] && newFilters[key].length > 0
    )
    FILTER_KEYS.forEach((key) => {
      const values = newFilters[key]
      if (values && values.length > 0) {
        newParams.set(key, values.join(","))
      } else {
        newParams.delete(key)
      }
    })
    newParams.delete("page")
    setSearchParams(newParams)
    message.success(
      hasAnySelection ? "Filters applied successfully" : "Filters cleared successfully"
    )
  }

  const filterFields = useMemo(() => {
    const systems = Array.from(
      new Set(orgChanges.map((c) => c.systemAffected).filter(Boolean))
    )
    return [
      {
        label: "Status",
        name: "status",
        values: ALL_STATUSES.map((s) => ({ label: s, value: s })),
      },
      {
        label: "Risk Level",
        name: "riskLevel",
        values: ALL_RISK_LEVELS.map((r) => ({ label: r, value: r })),
      },
      {
        label: "Category",
        name: "category",
        values: ALL_CATEGORIES.map((c) => ({ label: c, value: c })),
      },
      {
        label: "System",
        name: "system",
        values: systems.map((s) => ({ label: s, value: s })),
      },
    ]
  }, [orgChanges])

  const fullyFilteredChanges = useMemo(() => {
    return orgChanges.filter((c) => {
      if (activeFilters.status?.length > 0 && !activeFilters.status.includes(c.status))
        return false
      if (
        activeFilters.riskLevel?.length > 0 &&
        !activeFilters.riskLevel.includes(c.riskLevel)
      )
        return false
      if (
        activeFilters.category?.length > 0 &&
        !activeFilters.category.includes(c.category)
      )
        return false
      if (
        activeFilters.system?.length > 0 &&
        !activeFilters.system.includes(c.systemAffected)
      )
        return false
      return true
    })
  }, [orgChanges, activeFilters])

  const filteredChangesForCards = useMemo(() => {
    if (!searchQuery) return fullyFilteredChanges
    const q = searchQuery.toLowerCase()
    return fullyFilteredChanges.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.submitterName.toLowerCase().includes(q) ||
        c.systemAffected.toLowerCase().includes(q)
    )
  }, [fullyFilteredChanges, searchQuery])

  const columns: TableProps<ChangeRequest>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 140,
      sorter: (a, b) => a.id.localeCompare(b.id),
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
      sorter: (a, b) => a.submitterName.localeCompare(b.submitterName),
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
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (category: string) => (
        <span className="text-fade font-medium">{category}</span>
      ),
    },
    {
      title: "Risk",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 90,
      sorter: (a, b) => {
        const order = { Low: 1, Medium: 2, High: 3 }
        return (order[a.riskLevel] || 0) - (order[b.riskLevel] || 0)
      },
      render: (risk: string) => <Tag value={risk}>{risk}</Tag>,
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_: unknown, record: ChangeRequest) => (
        <Tag value={record.isQueried ? "Queried" : record.status} format={false}>
          {record.isQueried ? "Queried" : record.status}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => (
        <span className="text-fade text-xs font-medium whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 110,
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => (
        <span className="text-fade text-xs font-medium whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {dataView === "card" ? (
        <>
          {/* Filters Toolbar for Card View */}
          <div className="card flex flex-col justify-between gap-x-4 gap-y-2.5 p-4 px-6 lg:flex-row lg:items-center">
            <div className="text-body-md text-fade font-bold">
              All Changes ({filteredChangesForCards.length})
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Input
                  placeholder="Search by ID, title, submitter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  prefix={<AiOutlineSearch className="size-5! text-[#D0D0D2]" />}
                  className="h-11! w-full! rounded-lg! placeholder:text-sm! placeholder:tracking-tight! placeholder:text-[#D0D0D2]!"
                  allowClear
                />
              </div>

              <TableFilter
                fields={filterFields}
                value={activeFilters}
                onChange={handleFilterChange}
              />

              <DataViewSwitcher />
            </div>
          </div>

          {/* Cards Grid */}
          {filteredChangesForCards.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="bg-bg-muted border-border-muted text-fade-2 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h3 className="card-title">No change requests found</h3>
              <p className="card-description mx-auto mt-1 max-w-sm">
                Try adjusting your search filters to find what you're looking
                for.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredChangesForCards.map((change) => (
                <ChangeCard
                  key={change.id}
                  change={change}
                  showSubmitterDetails
                  detailBasePath="/changes"
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <DataTable
          name="changes"
          rowKey="id"
          columns={columns}
          dataSource={fullyFilteredChanges}
          search={{
            placeholder: "Search by ID, title, submitter...",
            position: "right",
          }}
          filter={{
            fields: filterFields,
            value: activeFilters,
            onChange: handleFilterChange,
          }}
          right={[<DataViewSwitcher key="switcher" />]}
          exportTable={{ fileNamePrefix: "all_changes" }}
          onRow={(record) => ({
            className: "cursor-pointer",
            onClick: () => navigate(`/changes/${record.id}`),
          })}
        />
      )}
    </div>
  )
}

export default Changes
