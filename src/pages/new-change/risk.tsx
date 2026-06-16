import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input, Select, Switch } from "antd"
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react"
import FormField from "../../components/ui/form-field"
import { FORM } from "../../static"
import { useWizard } from "./new-change-wizard"
import type { RiskLevel } from "../../state/slices/changes-slice"
import { cn } from "../../utils/cn"

const riskSchema = z
  .object({
    riskOverridden: z.boolean(),
    riskLevel: z.string().optional(),
    riskOverrideJustification: z.string().optional(),
    businessJustification: z.string().min(1, "Business justification is required"),
  })
  .superRefine((data, ctx) => {
    if (data.riskOverridden) {
      if (!data.riskLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Override risk level is required",
          path: ["riskLevel"],
        })
      }
      if (!data.riskOverrideJustification || !data.riskOverrideJustification.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Justification is required when overriding risk level",
          path: ["riskOverrideJustification"],
        })
      }
    }
  })

type RiskValues = z.infer<typeof riskSchema>

const RISK_CONFIG: Record<
  RiskLevel,
  { color: string; bg: string; border: string; icon: React.ReactNode; description: string }
> = {
  Low: {
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: <ShieldCheck className="h-5 w-5" />,
    description: "Low risk — minimal impact expected. Single approver workflow.",
  },
  Medium: {
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: <Shield className="h-5 w-5" />,
    description:
      "Medium risk — moderate impact possible. Requires department lead and IT manager approval.",
  },
  High: {
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: <ShieldAlert className="h-5 w-5" />,
    description:
      "High risk — significant potential impact. Requires full approval chain including CTO sign-off.",
  },
}

const RiskStep: React.FC = () => {
  const navigate = useNavigate()
  const { formData, updateFormData } = useWizard()

  const [overrideEnabled, setOverrideEnabled] = useState(formData.riskOverridden)

  const { control, handleSubmit, setValue, watch } = useForm<RiskValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      riskOverridden: formData.riskOverridden,
      riskLevel: formData.riskOverridden ? formData.riskLevel : undefined,
      riskOverrideJustification: formData.riskOverrideJustification,
      businessJustification: formData.businessJustification,
    },
  })

  const currentRisk: RiskLevel = overrideEnabled
    ? ((watch("riskLevel") as RiskLevel) || formData.autoAssignedRisk)
    : formData.autoAssignedRisk

  const riskInfo = RISK_CONFIG[currentRisk]

  const onSubmit = (values: RiskValues) => {
    updateFormData({
      riskOverridden: values.riskOverridden,
      riskLevel: values.riskOverridden
        ? (values.riskLevel as RiskLevel)
        : formData.autoAssignedRisk,
      riskOverrideJustification: values.riskOverrideJustification || "",
      businessJustification: values.businessJustification,
    })
    navigate("/self/changes/new/rollback")
  }

  return (
    <form
      id="step-form"
      onSubmit={handleSubmit(onSubmit)}
      className="card space-y-6 p-6"
    >
      <div>
        <h3 className="card-title mb-1">Risk & Justification</h3>
        <p className="card-description">
          Review the auto-assigned risk level based on your selected category and
          provide business justification.
        </p>
      </div>

      {/* Risk Level Badge */}
      <div
        className={cn(
          "flex items-start gap-4 rounded-2xl border p-5",
          riskInfo.bg,
          riskInfo.border
        )}
      >
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            riskInfo.bg,
            riskInfo.color
          )}
        >
          {riskInfo.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn("text-body-md font-bold", riskInfo.color)}
            >
              {currentRisk} Risk
            </span>
            {!overrideEnabled && (
              <span className="text-fade text-body-xs font-medium">
                (auto-assigned from "{formData.category || "no category"}")
              </span>
            )}
            {overrideEnabled && (
              <span className="text-fade text-body-xs font-medium">
                (manually overridden)
              </span>
            )}
          </div>
          <p className={cn("text-body-sm mt-0.5", riskInfo.color)}>
            {riskInfo.description}
          </p>
        </div>
      </div>

      {/* Override Toggle */}
      <div className="border-border rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-body-sm text-primary-alpha font-bold">
              Override Risk Level
            </span>
            <p className="text-body-xs text-fade mt-0.5">
              Toggle to manually set a different risk level with justification.
            </p>
          </div>
          <Switch
            checked={overrideEnabled}
            onChange={(checked) => {
              setOverrideEnabled(checked)
              setValue("riskOverridden", checked)
              if (!checked) {
                setValue("riskLevel", undefined)
                setValue("riskOverrideJustification", "")
              }
            }}
          />
        </div>

        {overrideEnabled && (
          <div className="animate-fade-in mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <FormField
              name="riskLevel"
              control={control}
              label="Override Risk Level"
              required
            >
              <Select
                value={watch("riskLevel") || undefined}
                onChange={(v) => setValue("riskLevel", v)}
                placeholder="Select risk level..."
                className={FORM.CLASS_NAME}
                options={[
                  { label: "Low", value: "Low" },
                  { label: "Medium", value: "Medium" },
                  { label: "High", value: "High" },
                ]}
              />
            </FormField>

            <FormField
              name="riskOverrideJustification"
              control={control}
              label="Override Justification"
              required
            >
              <Input.TextArea
                placeholder="Explain why the risk level should be different..."
                rows={3}
                value={watch("riskOverrideJustification")}
                onChange={(e) =>
                  setValue("riskOverrideJustification", e.target.value)
                }
                className="bg-background-light! border-border! focus:border-primary! text-primary-alpha w-full resize-none! rounded-xl! border px-4 py-3! text-sm! transition-colors focus:bg-white focus:outline-none"
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Business Justification */}
      <FormField
        name="businessJustification"
        control={control}
        label="Business Justification"
        required
      >
        <Input.TextArea
          placeholder="Explain the business need and expected impact of this change..."
          rows={5}
          value={watch("businessJustification")}
          onChange={(e) => setValue("businessJustification", e.target.value)}
          className="bg-background-light! border-border! focus:border-primary! text-primary-alpha w-full resize-none! rounded-xl! border px-4 py-3! text-sm! transition-colors focus:bg-white focus:outline-none"
        />
      </FormField>
    </form>
  )
}

export default RiskStep
