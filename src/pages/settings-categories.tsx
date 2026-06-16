import React, { useState } from "react"
import { Button, Modal, Select, Switch, Popconfirm, type TableProps } from "antd"
import { DataTable } from "../components/ui/data-table"
import { useAppSelector, useAppDispatch } from "../state/store"
import {
  addCategory,
  updateCategory,
  removeCategory,
  type CategoryOption,
} from "../state/slices/settings-slice"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import FormField from "../components/ui/form-field"
import { FORM } from "../static"
import Tag from "../components/ui/tag"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  defaultRisk: z.enum(["Low", "Medium", "High"]),
  active: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export const SettingsCategories: React.FC = () => {
  const dispatch = useAppDispatch()
  const { categories } = useAppSelector((state) => state.settings)

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const defaultValues: CategoryFormValues = {
    name: "",
    defaultRisk: "Low",
    active: true,
  }

  const { handleSubmit, control, reset } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  })

  const openAddDialog = () => {
    setEditingId(null)
    reset(defaultValues)
    setIsOpen(true)
  }

  const openEditDialog = (category: CategoryOption) => {
    setEditingId(category.id)
    reset({
      name: category.name,
      defaultRisk: category.defaultRisk,
      active: category.active,
    })
    setIsOpen(true)
  }

  const onSubmit: SubmitHandler<CategoryFormValues> = (data) => {
    if (editingId) {
      dispatch(updateCategory({ id: editingId, updates: data }))
    } else {
      const newCategory: CategoryOption = {
        id: `cat-${Date.now()}`,
        ...data,
      }
      dispatch(addCategory(newCategory))
    }
    setIsOpen(false)
  }

  const handleToggleActive = (record: CategoryOption) => {
    dispatch(updateCategory({ id: record.id, updates: { active: !record.active } }))
  }

  const columns: TableProps<CategoryOption>["columns"] = [
    {
      key: "name",
      dataIndex: "name",
      title: "Category Name",
      render: (_, record) => (
        <span className="text-primary-alpha font-bold">{record.name}</span>
      ),
    },
    {
      key: "defaultRisk",
      dataIndex: "defaultRisk",
      title: "Default Risk Level",
      render: (_, record) => (
        <Tag value={record.defaultRisk}>{record.defaultRisk}</Tag>
      ),
    },
    {
      key: "active",
      dataIndex: "active",
      title: "Active",
      render: (_, record) => (
        <Switch
          checked={record.active}
          onChange={() => handleToggleActive(record)}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-2">
          <Button
            type="default"
            onClick={() => openEditDialog(record)}
            className="hover:bg-bg-muted text-fade border-border bg-white p-1"
            icon={<Edit className="h-3.5 w-3.5" />}
          />
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => dispatch(removeCategory(record.id))}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="default"
              className="border-border bg-white p-1 text-red-500 hover:bg-red-50"
              icon={<Trash2 className="h-3.5 w-3.5" />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <DataTable
        name="categories"
        columns={columns}
        dataSource={categories}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search categories...", position: "left" }}
        right={[
          <Button
            key="add"
            type="primary"
            onClick={openAddDialog}
            className="text-body-xs flex h-11! items-center gap-1.5 rounded-lg! font-bold"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Category
          </Button>,
        ]}
      />

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save Category"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-category-form",
          className: "bg-primary hover:bg-primary/90 text-white border-none! font-semibold",
        }}
        cancelButtonProps={{
          className: "border-border! text-primary-alpha! hover:bg-bg-muted!",
        }}
        bodyProps={{ className: "pb-4!" }}
        width={500}
        destroyOnClose
      >
        <form
          id="settings-category-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              {editingId ? "Edit Category" : "Add New Category"}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Configure the category name, default risk level, and active status.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="name"
              label="Category Name"
              labelProps={FORM.LABEL_PROPS}
            >
              <input
                type="text"
                placeholder="e.g. New Feature"
                className="bg-background-light text-primary-alpha text-body-sm w-full rounded-xl border border-transparent px-4 py-3 transition-colors focus:border-primary focus:bg-white focus:outline-none"
              />
            </FormField>

            <FormField
              control={control}
              name="defaultRisk"
              label="Default Risk Level"
              labelProps={FORM.LABEL_PROPS}
            >
              <Select
                options={[
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                ]}
                className={FORM.CLASS_NAME}
                placeholder="Select risk level"
              />
            </FormField>

            <FormField
              control={control}
              name="active"
              label="Active"
              labelProps={FORM.LABEL_PROPS}
              valuePropName="checked"
            >
              <Switch />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SettingsCategories
