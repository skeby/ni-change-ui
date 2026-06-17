import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select, Button } from "antd";
import { Info } from "lucide-react";
import FormField from "../../components/ui/form-field";
import { FORM } from "../../static";
import { useWizard } from "./new-change-wizard";

const aiRequestSchema = z.object({
  frequency: z.string().min(1, "Frequency is required"),
  ruleEngine: z.string().min(1, "Rule engine assessment is required"),
  aiMl: z.string().min(1, "AI & ML assessment is required"),
  human: z.string().min(1, "Human/manual assessment is required"),
  statisticalModeling: z.string().min(1, "Statistical modeling is required"),
  problemComplexity: z.string().min(1, "Problem complexity is required"),
  problemDescription: z.string().min(1, "Problem description is required"),
  currentSolution: z.string().min(1, "Current solution is required"),
  successMetrics: z.string().min(1, "Success metrics are required"),
  simplerAlternative: z.string().min(1, "Simpler alternative is required"),
  globalUse: z.string().min(1, "Required"),
  requiresStaffData: z.string().min(1, "Required"),
  requiresSensitiveData: z.string().min(1, "Required"),
  externalUsers: z.string().min(1, "Required"),
  internalOnly: z.string().min(1, "Required"),
  bothUsers: z.string().min(1, "Required"),
  duration: z.string().min(1, "Duration is required"),
});

type AIRequestValues = z.infer<typeof aiRequestSchema>;

const FREQUENCY_OPTIONS = [
  "Real-time",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
  "On-demand",
];

const ASSESSMENT_OPTIONS = [
  "Not Applicable",
  "Low",
  "Medium",
  "High",
  "Critical",
];

const COMPLEXITY_OPTIONS = ["Simple", "Moderate", "Complex", "Highly Complex"];

const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const DURATION_OPTIONS = [
  { label: "Short Term (< 3 months)", value: "Short Term" },
  { label: "Medium Term (3-12 months)", value: "Medium Term" },
  { label: "Long Term (> 12 months)", value: "Long Term" },
];

const AIRequestStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId } = useWizard();

  // If category is not AI, show skip message
  if (formData.category !== "AI") {
    return (
      <div className="card space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="card-title mb-0.5">AI Request — Not Applicable</h3>
            <p className="card-description">
              This step only applies to change requests with the{" "}
              <span className="font-semibold">AI</span> category. Your current
              category is{" "}
              <span className="font-semibold">
                {formData.category || "not set"}
              </span>
              .
            </p>
          </div>
        </div>
        <form
          id="step-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/self/changes/new/risk?draftId=${draftId}`);
          }}
        >
          <Button
            htmlType="submit"
            type="primary"
            className="bg-primary! h-10! cursor-pointer rounded-lg! px-6! leading-5! font-semibold! text-white! shadow-none!"
          >
            Skip to Risk & Justification
          </Button>
        </form>
      </div>
    );
  }

  const { control, handleSubmit, setValue, watch } = useForm<AIRequestValues>({
    resolver: zodResolver(aiRequestSchema),
    defaultValues: {
      frequency: formData.aiRequest.frequency,
      ruleEngine: formData.aiRequest.ruleEngine,
      aiMl: formData.aiRequest.aiMl,
      human: formData.aiRequest.human,
      statisticalModeling: formData.aiRequest.statisticalModeling,
      problemComplexity: formData.aiRequest.problemComplexity,
      problemDescription: formData.aiRequest.problemDescription,
      currentSolution: formData.aiRequest.currentSolution,
      successMetrics: formData.aiRequest.successMetrics,
      simplerAlternative: formData.aiRequest.simplerAlternative,
      globalUse: formData.aiRequest.globalUse,
      requiresStaffData: formData.aiRequest.requiresStaffData,
      requiresSensitiveData: formData.aiRequest.requiresSensitiveData,
      externalUsers: formData.aiRequest.externalUsers,
      internalOnly: formData.aiRequest.internalOnly,
      bothUsers: formData.aiRequest.bothUsers,
      duration: formData.aiRequest.duration,
    },
  });

  const onSubmit = (values: AIRequestValues) => {
    updateFormData({
      aiRequest: { ...values },
    });
    navigate(`/self/changes/new/risk?draftId=${draftId}`);
  };

  return (
    <form
      id="step-form"
      onSubmit={handleSubmit(onSubmit)}
      className="card space-y-6 p-6"
    >
      <div>
        <h3 className="card-title mb-1">AI Request Details</h3>
        <p className="card-description">
          Provide details about the AI/ML solution, its complexity, data
          requirements, and expected usage.
        </p>
      </div>

      {/* Assessment Selects */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FormField
          name="frequency"
          control={control}
          label="Frequency"
          required
        >
          <Select
            value={watch("frequency") || undefined}
            onChange={(v) => setValue("frequency", v)}
            placeholder="Select frequency..."
            className={FORM.CLASS_NAME}
            options={FREQUENCY_OPTIONS.map((o) => ({ label: o, value: o }))}
          />
        </FormField>

        <FormField
          name="ruleEngine"
          control={control}
          label="Rule Engine"
          required
        >
          <Select
            value={watch("ruleEngine") || undefined}
            onChange={(v) => setValue("ruleEngine", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={ASSESSMENT_OPTIONS.map((o) => ({ label: o, value: o }))}
          />
        </FormField>

        <FormField name="aiMl" control={control} label="AI & ML" required>
          <Select
            value={watch("aiMl") || undefined}
            onChange={(v) => setValue("aiMl", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={ASSESSMENT_OPTIONS.map((o) => ({ label: o, value: o }))}
          />
        </FormField>

        <FormField
          name="human"
          control={control}
          label="Human / Manual"
          required
        >
          <Select
            value={watch("human") || undefined}
            onChange={(v) => setValue("human", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={ASSESSMENT_OPTIONS.map((o) => ({ label: o, value: o }))}
          />
        </FormField>

        <FormField
          name="statisticalModeling"
          control={control}
          label="Statistical Modeling"
          required
        >
          <Select
            value={watch("statisticalModeling") || undefined}
            onChange={(v) => setValue("statisticalModeling", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={ASSESSMENT_OPTIONS.map((o) => ({ label: o, value: o }))}
          />
        </FormField>

        <FormField
          name="problemComplexity"
          control={control}
          label="Problem Complexity"
          required
        >
          <Select
            value={watch("problemComplexity") || undefined}
            onChange={(v) => setValue("problemComplexity", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={COMPLEXITY_OPTIONS.map((o) => ({ label: o, value: o }))}
          />
        </FormField>
      </div>

      {/* Text Fields */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FormField
          name="problemDescription"
          control={control}
          label="Problem Description"
          required
          rootClassName="col-span-full"
        >
          <Input.TextArea
            placeholder="Describe the problem this AI solution aims to solve..."
            rows={3}
            value={watch("problemDescription")}
            onChange={(e) => setValue("problemDescription", e.target.value)}
            className={FORM.TEXTAREA_CLASS_NAME}
          />
        </FormField>

        <FormField
          name="currentSolution"
          control={control}
          label="Current Solution"
          required
        >
          <Input.TextArea
            placeholder="Describe the current approach..."
            rows={3}
            value={watch("currentSolution")}
            onChange={(e) => setValue("currentSolution", e.target.value)}
            className={FORM.TEXTAREA_CLASS_NAME}
          />
        </FormField>

        <FormField
          name="successMetrics"
          control={control}
          label="Success Metrics"
          required
        >
          <Input.TextArea
            placeholder="How will success be measured?"
            rows={3}
            value={watch("successMetrics")}
            onChange={(e) => setValue("successMetrics", e.target.value)}
            className={FORM.TEXTAREA_CLASS_NAME}
          />
        </FormField>

        <FormField
          name="simplerAlternative"
          control={control}
          label="Simpler Alternative Considered"
          required
        >
          <Input.TextArea
            placeholder="Have simpler non-AI alternatives been considered?"
            rows={3}
            value={watch("simplerAlternative")}
            onChange={(e) => setValue("simplerAlternative", e.target.value)}
            className={FORM.TEXTAREA_CLASS_NAME}
          />
        </FormField>
      </div>

      {/* Yes/No and Duration Selects */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FormField
          name="globalUse"
          control={control}
          label="Global Use"
          required
        >
          <Select
            value={watch("globalUse") || undefined}
            onChange={(v) => setValue("globalUse", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="requiresStaffData"
          control={control}
          label="Requires Staff Data"
          required
        >
          <Select
            value={watch("requiresStaffData") || undefined}
            onChange={(v) => setValue("requiresStaffData", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="requiresSensitiveData"
          control={control}
          label="Requires Sensitive Data"
          required
        >
          <Select
            value={watch("requiresSensitiveData") || undefined}
            onChange={(v) => setValue("requiresSensitiveData", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="externalUsers"
          control={control}
          label="External Users"
          required
        >
          <Select
            value={watch("externalUsers") || undefined}
            onChange={(v) => setValue("externalUsers", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="internalOnly"
          control={control}
          label="Internal Only"
          required
        >
          <Select
            value={watch("internalOnly") || undefined}
            onChange={(v) => setValue("internalOnly", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="bothUsers"
          control={control}
          label="Both Internal & External"
          required
        >
          <Select
            value={watch("bothUsers") || undefined}
            onChange={(v) => setValue("bothUsers", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="duration"
          control={control}
          label="Expected Duration"
          required
        >
          <Select
            value={watch("duration") || undefined}
            onChange={(v) => setValue("duration", v)}
            placeholder="Select duration..."
            className={FORM.CLASS_NAME}
            options={DURATION_OPTIONS}
          />
        </FormField>
      </div>
    </form>
  );
};

export default AIRequestStep;
