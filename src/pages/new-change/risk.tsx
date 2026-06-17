import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select, Switch } from "antd";
import { ShieldAlert } from "lucide-react";
import FormField from "../../components/ui/form-field";
import { FORM } from "../../static";
import { useWizard } from "./new-change-wizard";
import type { RiskLevel } from "../../state/slices/changes-slice";
import { useAppSelector } from "../../state/store";
import { Utils } from "../../utils";
import chroma from "chroma-js";

const riskSchema = z
  .object({
    riskOverridden: z.boolean(),
    riskLevel: z.string().optional(),
    riskOverrideJustification: z.string().optional(),
    businessJustification: z
      .string()
      .min(1, "Business justification is required"),
  })
  .superRefine((data, ctx) => {
    if (data.riskOverridden) {
      if (!data.riskLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Override risk level is required",
          path: ["riskLevel"],
        });
      }
      if (
        !data.riskOverrideJustification ||
        !data.riskOverrideJustification.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Justification is required when overriding risk level",
          path: ["riskOverrideJustification"],
        });
      }
    }
  });

type RiskValues = z.infer<typeof riskSchema>;

const RiskStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId } = useWizard();
  const { riskLevels } = useAppSelector((state) => state.settings);
  const { users } = useAppSelector((state) => state.auth);

  const sortedRiskLevels = [...riskLevels].sort(
    (a, b) => a.severity - b.severity,
  );

  const [overrideEnabled, setOverrideEnabled] = useState(
    formData.riskOverridden,
  );

  const { control, handleSubmit, setValue, watch } = useForm<RiskValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      riskOverridden: formData.riskOverridden,
      riskLevel: formData.riskOverridden ? formData.riskLevel : undefined,
      riskOverrideJustification: formData.riskOverrideJustification,
      businessJustification: formData.businessJustification,
    },
  });

  const currentRisk: RiskLevel = overrideEnabled
    ? (watch("riskLevel") as RiskLevel) || formData.autoAssignedRisk
    : formData.autoAssignedRisk;

  const matchedLevel = riskLevels.find((r) => r.name === currentRisk);
  const riskColor = Utils.resolveRiskColor(riskLevels, currentRisk);
  const escalateToName = matchedLevel
    ? users.find((u) => u.id === matchedLevel.escalateTo)?.name ||
      matchedLevel.escalateTo
    : "";
  const riskDescription = matchedLevel
    ? `${matchedLevel.approvalStages.length} approval stage${matchedLevel.approvalStages.length === 1 ? "" : "s"} configured. Escalates after ${matchedLevel.maxEscalationHours}h to ${escalateToName}.`
    : "Risk level configuration not found.";

  const onSubmit = (values: RiskValues) => {
    updateFormData({
      riskOverridden: values.riskOverridden,
      riskLevel: values.riskOverridden
        ? (values.riskLevel as RiskLevel)
        : formData.autoAssignedRisk,
      riskOverrideJustification: values.riskOverrideJustification || "",
      businessJustification: values.businessJustification,
    });
    navigate(`/self/changes/new/rollback?draftId=${draftId}`);
  };

  return (
    <form
      id="step-form"
      onSubmit={handleSubmit(onSubmit)}
      className="card space-y-6 p-6"
    >
      <div>
        <h3 className="card-title mb-1">Risk & Justification</h3>
        <p className="card-description">
          Review the auto-assigned risk level based on your selected category
          and provide business justification.
        </p>
      </div>

      {/* Risk Level Banner */}
      <div
        className="card border-border flex items-start gap-4 border border-l-4 p-5"
        style={{ borderLeftColor: riskColor }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: chroma(riskColor).alpha(0.1).css(),
            color: riskColor,
          }}
        >
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-body-md font-bold"
              style={{ color: riskColor }}
            >
              {currentRisk} Risk
            </span>
            {!overrideEnabled ? (
              <span className="bg-bg-muted text-fade-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                Auto-assigned from "{formData.category || "no category"}"
              </span>
            ) : (
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: chroma("#f59e0b").alpha(0.1).css(),
                  color: "#f59e0b",
                }}
              >
                Manually Overridden
              </span>
            )}
          </div>
          <p className="text-body-sm text-fade mt-1">{riskDescription}</p>
        </div>
      </div>

      {/* Override Toggle (Directly integrated in container) */}
      <div className="border-t border-border pt-6">
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
              setOverrideEnabled(checked);
              setValue("riskOverridden", checked);
              if (!checked) {
                setValue("riskLevel", undefined);
                setValue("riskOverrideJustification", "");
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
                showSearch={{ optionFilterProp: "label" }}
                value={watch("riskLevel") || undefined}
                onChange={(v) => setValue("riskLevel", v)}
                placeholder="Select risk level..."
                className={FORM.CLASS_NAME}
                options={sortedRiskLevels.map((r) => ({
                  label: r.name,
                  value: r.name,
                }))}
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
                className={FORM.TEXTAREA_CLASS_NAME}
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
          className={FORM.TEXTAREA_CLASS_NAME}
        />
      </FormField>
    </form>
  );
};

export default RiskStep;
