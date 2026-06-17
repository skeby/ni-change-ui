import React, { useState } from "react"
import { Button, Modal, Input, type TableProps } from "antd"
import { FORM } from "../static"
import { DataTable } from "../components/ui/data-table"
import { useAppSelector, useAppDispatch } from "../state/store"
import {
  updateTestChecklist,
  type TestChecklistTemplate,
} from "../state/slices/settings-slice"
import { Edit, Plus, Trash2, GripVertical } from "lucide-react"

export const SettingsTestChecklists: React.FC = () => {
  const dispatch = useAppDispatch()
  const { testChecklists } = useAppSelector((state) => state.settings)

  const [isOpen, setIsOpen] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<TestChecklistTemplate | null>(null)
  const [editItems, setEditItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState("")

  const openEditDialog = (checklist: TestChecklistTemplate) => {
    setEditingChecklist(checklist)
    setEditItems([...checklist.items])
    setNewItem("")
    setIsOpen(true)
  }

  const handleAddItem = () => {
    const trimmed = newItem.trim()
    if (trimmed && !editItems.includes(trimmed)) {
      setEditItems([...editItems, trimmed])
      setNewItem("")
    }
  }

  const handleRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...editItems]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setEditItems(newItems)
  }

  const handleSave = () => {
    if (!editingChecklist) return
    dispatch(updateTestChecklist({ id: editingChecklist.id, items: editItems }))
    setIsOpen(false)
  }

  const columns: TableProps<TestChecklistTemplate>["columns"] = [
    {
      key: "category",
      dataIndex: "category",
      title: "Category",
      render: (_, record) => (
        <span className="text-primary-alpha font-bold">{record.category}</span>
      ),
    },
    {
      key: "itemCount",
      title: "Checklist Items",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <span className="bg-primary flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white">
            {record.items.length}
          </span>
          <span className="text-fade text-body-sm font-medium">items</span>
        </div>
      ),
    },
    {
      key: "preview",
      title: "Preview",
      render: (_, record) => (
        <span className="text-fade-2 text-body-xs font-medium">
          {record.items.slice(0, 2).join(", ")}
          {record.items.length > 2 && `, +${record.items.length - 2} more`}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end">
          <Button
            type="default"
            onClick={() => openEditDialog(record)}
            className="hover:bg-bg-muted text-fade border-border bg-white p-1"
            icon={<Edit className="h-3.5 w-3.5" />}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <DataTable
        name="checklist templates"
        columns={columns}
        dataSource={testChecklists}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search categories...", position: "left" }}
      />

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        onOk={handleSave}
        okText="Save Checklist"
        cancelText="Cancel"
        okButtonProps={{
          className: "bg-primary hover:bg-primary/90 text-white border-none! font-semibold",
        }}
        cancelButtonProps={{
          className: "border-border! text-primary-alpha! hover:bg-bg-muted!",
        }}
        bodyProps={{ className: "pb-4!" }}
        width={600}
        destroyOnClose
      >
        <div className="text-primary-alpha space-y-5">
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              Edit Checklist: {editingChecklist?.category}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Add, remove, or reorder the default test checklist items for this category.
            </p>
          </div>

          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault()
                handleAddItem()
              }}
              placeholder="Type a new checklist item..."
              className={FORM.CLASS_NAME}
            />
            <Button
              type="primary"
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="bg-primary hover:bg-primary/90 flex h-auto items-center gap-1 rounded-xl border-none px-4 font-semibold text-white"
              icon={<Plus className="h-4 w-4" />}
            >
              Add
            </Button>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {editItems.length === 0 && (
              <div className="text-fade-2 text-body-sm rounded-xl bg-gray-50 py-6 text-center font-medium">
                No checklist items yet. Add one above.
              </div>
            )}
            {editItems.map((item, index) => (
              <div
                key={index}
                className="border-border bg-bg-muted flex items-center gap-3 rounded-xl border px-3 py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveItem(index, "up")}
                    disabled={index === 0}
                    className="text-fade hover:text-primary-alpha disabled:opacity-30"
                  >
                    <GripVertical className="h-3 w-3 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(index, "down")}
                    disabled={index === editItems.length - 1}
                    className="text-fade hover:text-primary-alpha disabled:opacity-30"
                  >
                    <GripVertical className="h-3 w-3" />
                  </button>
                </div>

                <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold">
                  {index + 1}
                </span>
                <span className="text-body-sm text-primary-alpha flex-1 font-medium">
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-fade hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SettingsTestChecklists
