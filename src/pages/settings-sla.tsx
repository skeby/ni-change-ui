import React, { useState } from "react"
import { Button, Modal, InputNumber } from "antd"
import { useAppSelector, useAppDispatch } from "../state/store"
import {
  updateSLAConfig,
  type SLAConfig,
} from "../state/slices/settings-slice"
import { Edit, Clock, AlertTriangle } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import FormField from "../components/ui/form-field"
import { FORM } from "../static"
import Tag from "../components/ui/tag"

const slaSchema = z.object({
  maxHours: z.number().min(1, "Must be at least 1 hour"),
  escalateTo: z.string().min(1, "Escalation target is required"),
})

type SLAFormValues = z.infer<typeof slaSchema>

const riskConfig: Record<string, { color: string; borderColor: string }> = {
  Low: { color: "bg-green-50", borderColor: "border-green-200" },
  Medium: { color: "bg-orange-50", borderColor: "border-orange-200" },
  High: { color: "bg-red-50", borderColor: "border-red-200" },
}

export const SettingsSLA: React.FC = () => {
  const dispatch = useAppDispatch()
  const { slaConfigs } = useAppSelector((state) => state.settings)

  const [isOpen, setIsOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SLAConfig | null>(null)

  const { handleSubmit, control, reset } = useForm<SLAFormValues>({
    resolver: zodResolver(slaSchema),
    defaultValues: { maxHours: 24, escalateTo: "" },
  })

  const openEditDialog = (config: SLAConfig) => {
    setEditingConfig(config)
    reset({
      maxHours: config.maxHours,
      escalateTo: config.escalateTo,
    })
    setIsOpen(true)
  }

  const onSubmit: SubmitHandler<SLAFormValues> = (data) => {
    if (!editingConfig) return
    dispatch(
      updateSLAConfig({
        id: editingConfig.id,
        updates: {
          maxHours: data.maxHours,
          escalateTo: data.escalateTo,
        },
      })
    )
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="card rounded-2xl border p-6">
        <div className="mb-6">
          <h2 className="text-h2 text-primary-alpha font-bold">SLA Configuration</h2>
          <p className="text-body-sm text-fade-2">
            Set the maximum approval time and escalation targets for each risk level.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {slaConfigs.map((config) => {
            const style = riskConfig[config.riskLevel] || riskConfig.Low
            return (
              <div
                key={config.id}
                className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${style.color} ${style.borderColor}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <Tag value={config.riskLevel} className="text-body-xs font-bold">
                    {config.riskLevel} Risk
                  </Tag>
                  <Button
                    type="default"
                    onClick={() => openEditDialog(config)}
                    className="hover:bg-white/60 text-fade border-border bg-white/80 p-1"
                    icon={<Edit className="h-3.5 w-3.5" />}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/80 flex h-10 w-10 items-center justify-center rounded-xl">
                      <Clock className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-body-xs text-fade-2 block font-semibold uppercase tracking-wider">
                        Max Hours
                      </span>
                      <span className="text-h2 text-primary-alpha font-bold">
                        {config.maxHours}h
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white/80 flex h-10 w-10 items-center justify-center rounded-xl">
                      <AlertTriangle className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-body-xs text-fade-2 block font-semibold uppercase tracking-wider">
                        Escalate To
                      </span>
                      <span className="text-body-sm text-primary-alpha font-bold">
                        {config.escalateTo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save SLA"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-sla-form",
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
          id="settings-sla-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              Edit {editingConfig?.riskLevel} Risk SLA
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Configure the escalation timeline and target for this risk level.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="maxHours"
              label="Maximum Hours Before Escalation"
              labelProps={FORM.LABEL_PROPS}
            >
              <InputNumber
                min={1}
                max={720}
                className="bg-background-light! w-full! rounded-xl! h-12!"
                placeholder="e.g. 24"
              />
            </FormField>

            <FormField
              control={control}
              name="escalateTo"
              label="Escalate To"
              labelProps={FORM.LABEL_PROPS}
            >
              <input
                type="text"
                placeholder="e.g. IT Manager"
                className="bg-background-light text-primary-alpha text-body-sm w-full rounded-xl border border-transparent px-4 py-3 transition-colors focus:border-primary focus:bg-white focus:outline-none"
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SettingsSLA
