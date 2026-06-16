import { Button, Checkbox, Input, Popover } from "antd"
import React, { useEffect, useState } from "react"
import { AiOutlineSearch } from "react-icons/ai"
import { LuSlidersVertical } from "react-icons/lu"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2"
import { MdCancel } from "react-icons/md"

export type FilterField = {
  label: string
  name: string
  values: { label: string; value: string | number }[]
}

interface TableFilterProps {
  fields: FilterField[]
  value: Record<string, (string | number)[]>
  onChange: (value: Record<string, (string | number)[]>) => void
  loading?: boolean
}

export const TableFilter: React.FC<TableFilterProps> = ({
  fields,
  value,
  onChange,
  loading,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [draftFilterValues, setDraftFilterValues] = useState<
    Record<string, (string | number)[]>
  >(() => value ?? {})
  const [activeFilterField, setActiveFilterField] =
    useState<FilterField | null>(null)
  const [filterSearchQuery, setFilterSearchQuery] = useState("")

  const handleFilterPopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open)

    if (open) {
      setDraftFilterValues(value ?? {})
      return
    }

    setActiveFilterField(null)
    setFilterSearchQuery("")
    setDraftFilterValues(value ?? {})
  }

  // Sync draft filter values when value prop changes externally (e.g. cleared)
  useEffect(() => {
    setDraftFilterValues(value ?? {})
  }, [value])

  const renderFilterContent = () => {
    if (activeFilterField) {
      const visibleValues = activeFilterField.values.filter((v) =>
        v.label.toLowerCase().includes(filterSearchQuery.toLowerCase())
      )

      return (
        <div className="text-primary-alpha flex w-80 flex-col">
          <div className="border-border/60 flex items-center justify-between border-b p-4">
            <div
              className="text-primary flex cursor-pointer items-center gap-x-2 transition-opacity hover:opacity-80"
              onClick={() => {
                setActiveFilterField(null)
                setFilterSearchQuery("")
              }}
            >
              <HiChevronLeft className="size-5" />
              <span className="text-base font-semibold">
                Filter by {activeFilterField.label.toLowerCase()}
              </span>
            </div>
            <MdCancel
              className="hover:text-primary-alpha size-5 cursor-pointer text-[#9BA1AC] transition-colors"
              onClick={() => handleFilterPopoverOpenChange(false)}
            />
          </div>
          <div className="flex flex-col gap-y-3 p-4">
            <Input
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              placeholder="Search"
              prefix={<AiOutlineSearch className="size-5! text-[#D0D0D2]" />}
              className="rounded-lg! placeholder:text-sm! placeholder:tracking-tight! placeholder:text-[#D0D0D2]!"
            />
            <div className="no-scrollbar flex max-h-60 flex-col gap-y-2 overflow-y-auto pt-2">
              {visibleValues.map((val) => {
                const isChecked = draftFilterValues[
                  activeFilterField.name
                ]?.includes(val.value)
                return (
                  <div
                    key={val.value}
                    className="bg-bg-muted hover:bg-bg-muted/80 flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-colors"
                    onClick={() => {
                      setDraftFilterValues((prev) => {
                        const existing = prev[activeFilterField.name] || []
                        if (existing.includes(val.value)) {
                          return {
                            ...prev,
                            [activeFilterField.name]: existing.filter(
                              (v) => v !== val.value
                            ),
                          }
                        } else {
                          return {
                            ...prev,
                            [activeFilterField.name]: [...existing, val.value],
                          }
                        }
                      })
                    }}
                  >
                    <span className="text-primary-alpha text-sm font-medium">
                      {val.label}
                    </span>
                    <Checkbox checked={isChecked} className="size-5!" />
                  </div>
                )
              })}
              {visibleValues.length === 0 && (
                <p className="text-fade py-4 text-center text-sm">
                  No options found
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-x-2 p-4 pt-1">
            <Button
              type="primary"
              className="bg-primary-tint! text-primary! h-11! w-full! rounded-lg! font-medium! shadow-none!"
              onClick={() => {
                const allValues = activeFilterField.values.map((v) => v.value)
                const currentSelection =
                  draftFilterValues[activeFilterField.name] || []
                const isAllSelected = allValues.every((val) =>
                  currentSelection.includes(val)
                )

                setDraftFilterValues((prev) => ({
                  ...prev,
                  [activeFilterField.name]: isAllSelected ? [] : allValues,
                }))
              }}
            >
              {activeFilterField.values.every((v) =>
                (draftFilterValues[activeFilterField.name] || []).includes(
                  v.value
                )
              )
                ? "Unselect All"
                : "Select All"}
            </Button>
            <Button
              type="primary"
              className="bg-primary! h-11! w-full! rounded-lg! font-medium! shadow-none!"
              onClick={() => {
                setActiveFilterField(null)
                setFilterSearchQuery("")
              }}
            >
              Add Filter
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="text-primary-alpha flex w-80 flex-col">
        <div className="border-border/60 flex items-center justify-between border-b p-4">
          <span className="text-primary text-base font-semibold">
            Filter by
          </span>
          <MdCancel
            className="hover:text-primary-alpha size-5 cursor-pointer text-[#9BA1AC] transition-colors"
            onClick={() => handleFilterPopoverOpenChange(false)}
          />
        </div>
        <div className="no-scrollbar flex max-h-80 flex-col gap-y-2 overflow-y-auto p-4">
          {fields.map((field) => {
            const hasSelection = draftFilterValues[field.name]?.length > 0
            return (
              <div
                key={field.name}
                className="bg-bg-muted hover:bg-bg-muted/80 flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-colors"
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).closest(
                      ".ant-checkbox-wrapper"
                    ) &&
                    hasSelection
                  ) {
                    setDraftFilterValues((prev) => ({
                      ...prev,
                      [field.name]: [],
                    }))
                  } else {
                    setActiveFilterField(field)
                  }
                }}
              >
                <div className="pointer-events-none flex items-center gap-x-3">
                  <div className="pointer-events-auto">
                    <Checkbox
                      checked={hasSelection}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          setDraftFilterValues((prev) => ({
                            ...prev,
                            [field.name]: [],
                          }))
                        } else {
                          setActiveFilterField(field)
                        }
                      }}
                    />
                  </div>
                  <span className="text-primary-alpha text-sm font-medium">
                    {field.label} {hasSelection && `(${draftFilterValues[field.name].length})`}
                  </span>
                </div>
                <HiChevronRight className="text-fade size-4" />
              </div>
            )
          })}
        </div>
        <div className="flex gap-x-2 p-4 pt-1">
          {Object.keys(draftFilterValues).some(
            (k) => draftFilterValues[k]?.length > 0
          ) && (
            <Button
              type="primary"
              className="bg-primary-tint! text-primary! h-11! w-full! rounded-lg! font-medium! shadow-none!"
              onClick={() => {
                onChange({})
                setDraftFilterValues({})
              }}
            >
              Clear Filter
            </Button>
          )}
          {(Object.keys(draftFilterValues).some((k) => draftFilterValues[k]?.length > 0) ||
            Object.keys(value).some((k) => value[k]?.length > 0)) && (
            <Button
              type="primary"
              className="bg-primary! h-11! w-full! rounded-lg! font-medium! shadow-none!"
              onClick={() => {
                onChange(draftFilterValues)
                setPopoverOpen(false)
              }}
            >
              Apply Filter
            </Button>
          )}
        </div>
      </div>
    )
  }

  const activeCount = Object.values(value).reduce(
    (acc, val) => acc + (val?.length || 0),
    0
  )

  return (
    <Popover
      content={renderFilterContent()}
      trigger="click"
      placement="bottomRight"
      open={popoverOpen}
      onOpenChange={handleFilterPopoverOpenChange}
      arrow={false}
      showArrow={false}
      styles={{
        container: {
          padding: 0,
          borderRadius: "12px",
          overflow: "hidden",
        },
      }}
    >
      <Button
        loading={loading}
        type="primary"
        icon={<LuSlidersVertical className="size-4! shrink-0!" />}
        className="h-11! rounded-lg! leading-none! tracking-tight shadow-none!"
      >
        <span className="hidden sm:inline">
          Filter {activeCount > 0 && `(${activeCount})`}
        </span>
      </Button>
    </Popover>
  )
}
