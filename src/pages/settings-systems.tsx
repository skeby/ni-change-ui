import React, { useState } from "react"
import { Button, Modal, Switch, Popconfirm, type TableProps } from "antd"
import { DataTable } from "../components/ui/data-table"
import { useAppSelector, useAppDispatch } from "../state/store"
import {
  addSystem,
  updateSystem,
  removeSystem,
  type SystemOption,
} from "../state/slices/settings-slice"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import FormField from "../components/ui/form-field"
import { FORM } from "../static"

const systemSchema = z.object({
  name: z.string().min(1, "System name is required"),
  description: z.string().min(1, "Description is required"),
  active: z.boolean(),
})

type SystemFormValues = z.infer<typeof systemSchema>

export const SettingsSystems: React.FC = () => {
  const dispatch = useAppDispatch()
  const { systems } = useAppSelector((state) => state.settings)

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const defaultValues: SystemFormValues = {
    name: "",
    description: "",
    active: true,
  }

  const { handleSubmit, control, reset } = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues,
  })

  const openAddDialog = () => {
    setEditingId(null)
    reset(defaultValues)
    setIsOpen(true)
  }

  const openEditDialog = (system: SystemOption) => {
    setEditingId(system.id)
    reset({
      name: system.name,
      description: system.description,
      active: system.active,
    })
    setIsOpen(true)
  }

  const onSubmit: SubmitHandler<SystemFormValues> = (data) => {
    if (editingId) {
      dispatch(updateSystem({ id: editingId, updates: data }))
    } else {
      const newSystem: SystemOption = {
        id: `sys-${Date.now()}`,
        ...data,
      }
      dispatch(addSystem(newSystem))
    }
    setIsOpen(false)
  }

  const handleToggleActive = (record: SystemOption) => {
    dispatch(updateSystem({ id: record.id, updates: { active: !record.active } }))
  }

  const columns: TableProps<SystemOption>["columns"] = [
    {
      key: "name",
      dataIndex: "name",
      title: "System Name",
      render: (_, record) => (
        <span className="text-primary-alpha font-bold">{record.name}</span>
      ),
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Description",
      render: (_, record) => (
        <span className="text-fade font-medium">{record.description}</span>
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
            title="Are you sure you want to delete this system?"
            onConfirm={() => dispatch(removeSystem(record.id))}
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
        name="systems"
        columns={columns}
        dataSource={systems}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search systems...", position: "left" }}
        right={[
          <Button
            key="add"
            type="primary"
            onClick={openAddDialog}
            className="text-body-xs flex h-11! items-center gap-1.5 rounded-lg! font-bold"
            icon={<Plus className="h-4 w-4" />}
          >
            Add System
          </Button>,
        ]}
      />

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save System"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-system-form",
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
          id="settings-system-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              {editingId ? "Edit System" : "Add New System"}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Configure the system name, description, and availability.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="name"
              label="System Name"
              labelProps={FORM.LABEL_PROPS}
            >
              <input
                type="text"
                placeholder="e.g. NetSuite"
                className="bg-background-light text-primary-alpha text-body-sm w-full rounded-xl border border-transparent px-4 py-3 transition-colors focus:border-primary focus:bg-white focus:outline-none"
              />
            </FormField>

            <FormField
              control={control}
              name="description"
              label="Description"
              labelProps={FORM.LABEL_PROPS}
            >
              <input
                type="text"
                placeholder="e.g. Financial and ERP platform"
                className="bg-background-light text-primary-alpha text-body-sm w-full rounded-xl border border-transparent px-4 py-3 transition-colors focus:border-primary focus:bg-white focus:outline-none"
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

export default SettingsSystems
