import React, { useState } from "react"
import { Button, Modal, Input } from "antd"
import { useAppSelector, useAppDispatch } from "../state/store"
import {
  updateApprovalRoute,
  type ApprovalRoute,
} from "../state/slices/settings-slice"
import { Edit, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import FormField from "../components/ui/form-field"
import { FORM } from "../static"
import Tag from "../components/ui/tag"

const approvalRouteSchema = z.object({
  description: z.string().min(1, "Description is required"),
  approvers: z.string().min(1, "At least one approver is required"),
})

type ApprovalRouteFormValues = z.infer<typeof approvalRouteSchema>

const riskConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Low: {
    color: "border-green-200 bg-green-50",
    icon: <ShieldOff className="h-6 w-6 text-green-600" />,
  },
  Medium: {
    color: "border-orange-200 bg-orange-50",
    icon: <ShieldCheck className="h-6 w-6 text-orange-600" />,
  },
  High: {
    color: "border-red-200 bg-red-50",
    icon: <ShieldAlert className="h-6 w-6 text-red-600" />,
  },
}

export const SettingsApprovalRouting: React.FC = () => {
  const dispatch = useAppDispatch()
  const { approvalRoutes } = useAppSelector((state) => state.settings)

  const [isOpen, setIsOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<ApprovalRoute | null>(null)

  const { handleSubmit, control, reset } = useForm<ApprovalRouteFormValues>({
    resolver: zodResolver(approvalRouteSchema),
    defaultValues: { description: "", approvers: "" },
  })

  const openEditDialog = (route: ApprovalRoute) => {
    setEditingRoute(route)
    reset({
      description: route.description,
      approvers: route.approvers.join(", "),
    })
    setIsOpen(true)
  }

  const onSubmit: SubmitHandler<ApprovalRouteFormValues> = (data) => {
    if (!editingRoute) return
    const approversArray = data.approvers
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    dispatch(
      updateApprovalRoute({
        id: editingRoute.id,
        updates: {
          description: data.description,
          approvers: approversArray,
        },
      })
    )
    setIsOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="card rounded-2xl border p-6">
        <div className="mb-6">
          <h2 className="text-h2 text-primary-alpha font-bold">Approval Routing</h2>
          <p className="text-body-sm text-fade-2">
            Configure the approval chain for each risk level. Higher risk changes require more approvers.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {approvalRoutes.map((route) => {
            const config = riskConfig[route.riskLevel] || riskConfig.Low
            return (
              <div
                key={route.id}
                className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${config.color}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {config.icon}
                    <Tag value={route.riskLevel} className="text-body-xs font-bold">
                      {route.riskLevel} Risk
                    </Tag>
                  </div>
                  <Button
                    type="default"
                    onClick={() => openEditDialog(route)}
                    className="hover:bg-white/60 text-fade border-border bg-white/80 p-1"
                    icon={<Edit className="h-3.5 w-3.5" />}
                  />
                </div>

                <div className="mb-3">
                  <span className="text-body-xs text-fade-2 font-semibold uppercase tracking-wider">
                    Description
                  </span>
                  <p className="text-body-sm text-primary-alpha mt-1 font-medium">
                    {route.description}
                  </p>
                </div>

                <div>
                  <span className="text-body-xs text-fade-2 font-semibold uppercase tracking-wider">
                    Approval Chain
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {route.approvers.map((approver, idx) => (
                      <div
                        key={idx}
                        className="text-body-sm text-primary-alpha flex items-center gap-2 font-medium"
                      >
                        <span className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
                          {idx + 1}
                        </span>
                        {approver}
                      </div>
                    ))}
                  </div>
                </div>

                {route.riskLevel === "Low" && (
                  <div className="mt-3 rounded-lg bg-green-100/60 px-3 py-2">
                    <p className="text-body-xs font-medium text-green-700">
                      Note: Requester selects their own approver for low-risk changes.
                    </p>
                  </div>
                )}

                {route.riskLevel === "High" && (
                  <div className="mt-3 rounded-lg bg-red-100/60 px-3 py-2">
                    <p className="text-body-xs font-medium text-red-700">
                      Requires department lead approval followed by IT Manager or CAB review.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save Route"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-approval-route-form",
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
          id="settings-approval-route-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              Edit {editingRoute?.riskLevel} Risk Approval Route
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Update the approval chain and description for this risk level.
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="description"
              label="Description"
              labelProps={FORM.LABEL_PROPS}
            >
              <input
                type="text"
                placeholder="e.g. Department lead approval"
                className="bg-background-light text-primary-alpha text-body-sm w-full rounded-xl border border-transparent px-4 py-3 transition-colors focus:border-primary focus:bg-white focus:outline-none"
              />
            </FormField>

            <FormField
              control={control}
              name="approvers"
              label="Approvers (comma-separated)"
              labelProps={FORM.LABEL_PROPS}
            >
              <Input.TextArea
                rows={3}
                placeholder="e.g. Department Lead, IT Manager / CAB"
                className="bg-background-light! border-transparent! focus:border-primary! text-body-sm! text-primary-alpha! w-full resize-none! rounded-xl! px-4! py-3! transition-colors! focus:bg-white! focus:outline-none!"
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SettingsApprovalRouting
