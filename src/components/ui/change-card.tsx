import React from "react"
import { useNavigate } from "react-router-dom"
import { Button, Popconfirm } from "antd"
import { FaUser, FaChevronRight, FaServer, FaTrash } from "react-icons/fa6"
import Tag from "./tag"
import { Utils } from "../../utils"
import { colorMap } from "../../static"
import type { ChangeRequest } from "../../state/slices/changes-slice"

export interface ChangeCardProps {
  change: ChangeRequest
  showSubmitterDetails?: boolean
  detailBasePath?: string
  onDeleteDraft?: (id: string) => void
}

export const ChangeCard: React.FC<ChangeCardProps> = ({
  change,
  showSubmitterDetails = false,
  detailBasePath = "/self/changes",
  onDeleteDraft,
}) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (change.status === "Draft") {
      navigate(`/self/changes/new/${change.draftStep || "general"}?draftId=${change.id}`)
    } else {
      navigate(`${detailBasePath}/${change.id}`)
    }
  }

  const borderColor =
    colorMap[change.isQueried ? "queried" : change.status.toLowerCase()] ||
    "#6b7280"

  const timelineDate = change.requestedTimeline
    ? new Date(change.requestedTimeline).toLocaleDateString()
    : new Date(change.createdAt).toLocaleDateString()

  return (
    <div
      onClick={handleCardClick}
      className={Utils.cn(
        "card hover:border-border-active flex min-h-[220px] cursor-pointer flex-col justify-between p-6 hover:shadow-md",
        "border-l-4"
      )}
      style={{ borderColor }}
    >
      <div className="space-y-4">
        {/* Top line: id + status */}
        <div className="flex items-center justify-between">
          <span className="text-fade-2 text-[10px] font-bold tracking-wider uppercase">
            {change.id}
          </span>
          <Tag value={change.isQueried ? "Queried" : change.status} format={false}>
            {change.isQueried ? "Queried" : change.status}
          </Tag>
        </div>

        {/* Submitter Details (if enabled) */}
        {showSubmitterDetails && (
          <div className="border-border/60 bg-bg-muted/60 flex items-center gap-3 rounded-xl border p-3">
            <div className="bg-primary-alpha/5 dark:bg-primary-alpha/10 text-primary-alpha flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <FaUser className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-primary-alpha truncate text-xs font-bold">
                {change.submitterName}
              </div>
              <span className="text-fade-2 mt-0.5 block text-[10px] font-medium">
                {change.submitterDepartment}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="text-primary-alpha line-clamp-2 leading-snug font-bold">
            {change.title || "Untitled change request"}
          </h3>
          {/* System + Category */}
          <div className="text-fade-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <FaServer className="h-3 w-3" />
              {change.systemAffected || "—"}
            </span>
            <span className="text-border">|</span>
            <span>{change.category}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-body-sm text-fade line-clamp-2 font-light italic">
          "{change.description || "No description entered yet."}"
        </p>
      </div>

      {/* Footer */}
      <div className="border-border-muted mt-4 flex items-center justify-between border-t pt-4">
        <div className="flex gap-x-6">
          <div className="text-body-sm text-left">
            <div className="text-fade-2 mb-1 text-[10px] leading-none font-semibold tracking-wider uppercase">
              Target Date
            </div>
            <span className="text-fade leading-none font-bold">
              {timelineDate}
            </span>
          </div>
          <div className="text-body-sm text-left">
            <div className="text-fade-2 mb-1 text-[10px] leading-none font-semibold tracking-wider uppercase">
              Risk Level
            </div>
            <Tag value={change.riskLevel} className="px-2! py-0.5! text-[10px]!">
              {change.riskLevel}
            </Tag>
          </div>
        </div>

        <div className="flex gap-2">
          {change.status === "Draft" && onDeleteDraft && (
            <Popconfirm
              title="Are you sure you want to delete this change draft?"
              onConfirm={(e) => {
                e?.stopPropagation()
                onDeleteDraft(change.id)
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Yes"
              cancelText="No"
            >
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className="text-fade-2 flex h-8 w-8 items-center justify-center rounded-xl border border-transparent bg-transparent p-1 shadow-none transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                title="Delete Draft"
                icon={<FaTrash className="h-3 w-3" />}
              />
            </Popconfirm>
          )}
          <Button
            className="hover:bg-bg-muted text-fade-2 hover:text-primary-alpha border-border-muted flex h-8 w-8 items-center justify-center rounded-xl border bg-transparent p-1 shadow-none transition-colors"
            icon={<FaChevronRight className="h-3 w-3" />}
          />
        </div>
      </div>
    </div>
  )
}

export default ChangeCard
