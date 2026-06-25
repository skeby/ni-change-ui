import React, { useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Input, type TableProps, message, Popconfirm } from "antd"
import { AiOutlineSearch } from "react-icons/ai"
import { FileText } from "lucide-react"
import { useAppSelector, useAppDispatch } from "../state/store"
import { deleteChange } from "../state/slices/changes-slice"
import type {
  ChangeRequest,
  ChangeStatus,
} from "../state/slices/changes-slice"
import Tag from "../components/ui/tag"
import { DataTable } from "../components/ui/data-table"
import { TableFilter } from "../components/ui/table-filter"
import { DataViewSwitcher } from "../components/ui/data-view-switcher"
import { ChangeCard } from "../components/ui/change-card"
import { DataTableActions } from "../components/ui/data-table-actions"
import { Utils } from "../utils"

const ALL_STATUSES: ChangeStatus[] = [
  "Draft",
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

const FILTER_KEYS = ["status", "riskLevel", "category", "system"]

export const MyChanges: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { currentUserId } = useAppSelector((state) => state.auth)
  const { changes } = useAppSelector((state) => state.changes)
  const { dataView } = useAppSelector((state) => state.app)
  const { categories, riskLevels } = useAppSelector((state) => state.settings)
  const sortedRiskLevels = [...riskLevels].sort(
    (a, b) => a.severity - b.severity
  )

  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleDeleteDraft = (id: string) => {
    dispatch(deleteChange(id))
    message.success("Draft deleted successfully!")
  }

  // Only current user's changes
  const userChanges = useMemo(
    () => changes.filter((c) => c.submitterId === currentUserId),
    [changes, currentUserId]
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
      new Set(userChanges.map((c) => c.systemAffected).filter(Boolean))
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
        values: sortedRiskLevels.map((r) => ({ label: r.name, value: r.name })),
      },
      {
        label: "Category",
        name: "category",
        values: categories
          .filter((c) => c.active)
          .map((c) => ({ label: c.name, value: c.name })),
      },
      {
        label: "System",
        name: "system",
        values: systems.map((s) => ({ label: s, value: s })),
      },
    ]
  }, [userChanges, categories, sortedRiskLevels])

  const fullyFilteredChanges = useMemo(() => {
    return userChanges.filter((c) => {
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
  }, [userChanges, activeFilters])

  // Card view applies its own search query on top of the filters
  const filteredChangesForCards = useMemo(() => {
    if (!searchQuery) return fullyFilteredChanges
    const q = searchQuery.toLowerCase()
    return fullyFilteredChanges.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.systemAffected.toLowerCase().includes(q)
    )
  }, [fullyFilteredChanges, searchQuery])

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
      title: "System",
      dataIndex: "systemAffected",
      key: "system",
      width: 120,
      render: (system: string) => (
        <span className="text-fade font-medium">{system}</span>
      ),
    },
    {
      title: "Kind",
      key: "kind",
      width: 160,
      render: (_: unknown, record: ChangeRequest) => (
        <span className="text-fade font-medium">
          {Utils.resolveCategoryKindLabel(categories, record.category)}
        </span>
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
      render: (risk: string) => (
        <Tag color={Utils.resolveRiskColor(riskLevels, risk)}>{risk}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_: unknown, record: ChangeRequest) => (
        <div className="flex flex-wrap items-center gap-1">
          <Tag
            value={record.isQueried ? "Queried" : record.status}
            format={false}
          >
            {record.isQueried ? "Queried" : record.status}
          </Tag>
          {record.isEmergency && (
            <Tag color="#ef4444" format={false}>
              Emergency
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
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
      render: (date: string) => (
        <span className="text-fade text-xs font-medium whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    ...(fullyFilteredChanges.some((c) => ["Draft"].includes(c.status))
      ? [
          {
            title: "",
            key: "actions",
            width: 80,
            render: (_: any, record: ChangeRequest) => (
              <Popconfirm
                title="Are you sure you want to delete this change draft?"
                open={deleteConfirmId === record.id}
                onConfirm={(e) => {
                  e?.stopPropagation()
                  handleDeleteDraft(record.id)
                  setDeleteConfirmId(null)
                }}
                onCancel={(e) => {
                  e?.stopPropagation()
                  setDeleteConfirmId(null)
                }}
                okText="Yes"
                cancelText="No"
              >
                <DataTableActions
                  items={
                    record.status === "Draft"
                      ? [
                          {
                            label: "Delete draft",
                            icon: "delete",
                            onClick: () => setDeleteConfirmId(record.id),
                          },
                        ]
                      : []
                  }
                />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      {dataView === "card" ? (
        <>
          {/* Filters Toolbar for Card View */}
          <div className="card flex flex-col justify-between gap-x-4 gap-y-2.5 p-4 px-6 lg:flex-row lg:items-center">
            <div className="text-body-md text-fade font-bold">
              My Changes ({filteredChangesForCards.length})
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Input
                  placeholder="Search by ID, title, system..."
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
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="card-title">No change requests found</h3>
              <p className="card-description mx-auto mt-1 max-w-sm">
                Try adjusting your search filters or create a new change request
                to get started.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredChangesForCards.map((change) => (
                <ChangeCard
                  key={change.id}
                  change={change}
                  detailBasePath="/self/changes"
                  onDeleteDraft={handleDeleteDraft}
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
            placeholder: "Search by ID, title, system...",
            position: "right",
          }}
          filter={{
            fields: filterFields,
            value: activeFilters,
            onChange: handleFilterChange,
          }}
          right={[<DataViewSwitcher key="switcher" />]}
          onRow={(record) => ({
            className: "cursor-pointer",
            onClick: () => {
              if (record.status === "Draft") {
                navigate(`/self/changes/new/${record.draftStep || "general"}?draftId=${record.id}`)
              } else {
                navigate(`/self/changes/${record.id}`)
              }
            },
          })}
        />
      )}
    </div>
  )
}

export default MyChanges
