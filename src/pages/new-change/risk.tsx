import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select } from "antd";
import { ShieldAlert } from "lucide-react";
import FormField from "../../components/ui/form-field";
import { FORM } from "../../static";
import { useWizard } from "./new-change-wizard";
import type { RiskLevel } from "../../state/slices/changes-slice";
import { useAppSelector } from "../../state/store";
import { Utils } from "../../utils";
import chroma from "chroma-js";

const riskSchema = z.object({
  riskLevel: z.string().min(1, "Select a risk level"),
  riskJustification: z
    .string()
    .min(1, "Explain why you chose this risk level"),
  businessJustification: z
    .string()
    .min(1, "Business justification is required"),
});

type RiskValues = z.infer<typeof riskSchema>;

const RiskStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId } = useWizard();
  const { riskLevels } = useAppSelector((state) => state.settings);

  const sortedRiskLevels = [...riskLevels].sort(
    (a, b) => a.severity - b.severity,
  );

  const { control, handleSubmit, setValue, watch } = useForm<RiskValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      riskLevel: formData.riskLevel || undefined,
      riskJustification: formData.riskJustification,
      businessJustification: formData.businessJustification,
    },
  });

  const currentRisk = watch("riskLevel") as RiskLevel;
  const riskColor = currentRisk
    ? Utils.resolveRiskColor(riskLevels, currentRisk)
    : "#6b7280";

  const onSubmit = (values: RiskValues) => {
    updateFormData({
      riskLevel: values.riskLevel as RiskLevel,
      riskJustification: values.riskJustification,
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
          Assess the risk level for this change yourself, and explain your
          reasoning. Risk is not auto-assigned — your input here drives the
          approval routing.
        </p>
      </div>

      {/* Risk Level selector */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FormField
          name="riskLevel"
          control={control}
          label="Risk Level"
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

        {currentRisk && (
          <div
            className="card border-border flex items-center gap-3 border border-l-4 p-4"
            style={{ borderLeftColor: riskColor }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: chroma(riskColor).alpha(0.1).css(),
                color: riskColor,
              }}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-body-md font-bold" style={{ color: riskColor }}>
              {currentRisk} Risk
            </span>
          </div>
        )}
      </div>

      <FormField
        name="riskJustification"
        control={control}
        label="Risk Justification"
        required
      >
        <Input.TextArea
          placeholder="Explain why you assessed this change at the chosen risk level..."
          rows={3}
          value={watch("riskJustification")}
          onChange={(e) => setValue("riskJustification", e.target.value)}
          className={FORM.TEXTAREA_CLASS_NAME}
        />
      </FormField>

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
