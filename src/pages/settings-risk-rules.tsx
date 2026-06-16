import React, { useState } from "react"
import { Button, Modal, Select, Popconfirm, type TableProps } from "antd"
import { DataTable } from "../components/ui/data-table"
import { useAppSelector, useAppDispatch } from "../state/store"
import {
  addRiskRule,
  updateRiskRule,
  removeRiskRule,
  type RiskRule,
} from "../state/slices/settings-slice"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import FormField from "../components/ui/form-field"
import { FORM } from "../static"
import Tag from "../components/ui/tag"

const riskRuleSchema = z.object({
  category: z.string().min(1, "Category is required"),
  condition: z.string().min(1, "Condition description is required"),
  assignedRisk: z.enum(["Low", "Medium", "High"]),
})

type RiskRuleFormValues = z.infer<typeof riskRuleSchema>

export const SettingsRiskRules: React.FC = () => {
  const dispatch = useAppDispatch()
  const { riskRules, categories } = useAppSelector((state) => state.settings)

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const defaultValues: RiskRuleFormValues = {
    category: "",
    condition: "",
    assignedRisk: "Low",
  }

  const { handleSubmit, control, reset } = useForm<RiskRuleFormValues>({
    resolver: zodResolver(riskRuleSchema),
    defaultValues,
  })

  const openAddDialog = () => {
    setEditingId(null)
    reset(defaultValues)
    setIsOpen(true)
  }

  const openEditDialog = (rule: RiskRule) => {
    setEditingId(rule.id)
    reset({
      category: rule.category,
      condition: rule.condition,
      assignedRisk: rule.assignedRisk,
    })
    setIsOpen(true)
  }

  const onSubmit: SubmitHandler<RiskRuleFormValues> = (data) => {
    if (editingId) {
      dispatch(updateRiskRule({ id: editingId, updates: data }))
    } else {
      const newRule: RiskRule = {
        id: `rr-${Date.now()}`,
        ...data,
      }
      dispatch(addRiskRule(newRule))
    }
    setIsOpen(false)
  }

  const columns: TableProps<RiskRule>["columns"] = [
    {
      key: "category",
      dataIndex: "category",
      title: "Category",
      render: (_, record) => (
        <span className="text-primary-alpha font-bold">{record.category}</span>
      ),
    },
    {
      key: "condition",
      dataIndex: "condition",
      title: "Condition",
      render: (_, record) => (
        <span className="text-fade font-medium">{record.condition}</span>
      ),
    },
    {
      key: "assignedRisk",
      dataIndex: "assignedRisk",
      title: "Assigned Risk",
      render: (_, record) => (
        <Tag value={record.assignedRisk}>{record.assignedRisk}</Tag>
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
            title="Are you sure you want to delete this risk rule?"
            onConfirm={() => dispatch(removeRiskRule(record.id))}
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
        name="risk rules"
        columns={columns}
        dataSource={riskRules}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search risk rules...", position: "left" }}
        right={[
          <Button
            key="add"
            type="primary"
            onClick={openAddDialog}
            className="text-body-xs flex h-11! items-center gap-1.5 rounded-lg! font-bold"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Risk Rule
          </Button>,
        ]}
      />

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save Rule"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-risk-rule-form",
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
          id="settings-risk-rule-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              {editingId ? "Edit Risk Rule" : "Add New Risk Rule"}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Map a category condition to an automatic risk assignment.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="category"
              label="Category"
              labelProps={FORM.LABEL_PROPS}
            >
              <Select
                options={categories
                  .filter((c) => c.active)
                  .map((c) => ({ value: c.name, label: c.name }))}
                className={FORM.CLASS_NAME}
                placeholder="Select category"
              />
            </FormField>

            <FormField
              control={control}
              name="condition"
              label="Condition Description"
              labelProps={FORM.LABEL_PROPS}
            >
              <input
                type="text"
                placeholder="e.g. UI-only changes"
                className="bg-background-light text-primary-alpha text-body-sm w-full rounded-xl border border-transparent px-4 py-3 transition-colors focus:border-primary focus:bg-white focus:outline-none"
              />
            </FormField>

            <FormField
              control={control}
              name="assignedRisk"
              label="Assigned Risk Level"
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
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SettingsRiskRules
