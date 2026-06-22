import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select, Button } from "antd";
import { Info } from "lucide-react";
import FormField from "../../components/ui/form-field";
import SupportingDocumentsUploader from "../../components/ui/supporting-documents-uploader";
import { FORM } from "../../static";
import { useWizard } from "./new-change-wizard";
import { useAppSelector } from "../../state/store";

const aiRequestSchema = z.object({
  problemComplexity: z.string().min(1, "Required"),
  problemDescription: z.string().min(1, "Problem description is required"),
  currentSolution: z.string().min(1, "Current solution is required"),
  successMetrics: z.string().min(1, "Success metrics are required"),
  simplerAlternative: z.string().min(1, "Required"),
  duration: z.string().min(1, "Duration is required"),
  whoUsesSoftware: z.string().min(1, "Required"),
  requiresStaffPersonalData: z.string().min(1, "Required"),
  requiresSensitiveData: z.string().min(1, "Required"),
  usesProductionData: z.string().min(1, "Required"),
  usesDefaultStack: z.string().min(1, "Required"),
  llmChoices: z.array(z.string()).min(1, "Select at least one LLM"),
  integratesWithSystems: z.array(z.string()),
  postBuildSupport: z.string().min(1, "Required"),
});

type AIRequestValues = z.infer<typeof aiRequestSchema>;

const COMPLEXITY_OPTIONS = ["Simple", "Moderate", "Complex", "Highly Complex"];
const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];
const WHO_USES_OPTIONS = [
  { label: "Internal staff only", value: "Internal" },
  { label: "External users", value: "External" },
  { label: "Both internal & external", value: "Both" },
];
const DURATION_OPTIONS = [
  { label: "Short Term (< 3 months)", value: "Short Term" },
  { label: "Medium Term (3-12 months)", value: "Medium Term" },
  { label: "Long Term (> 12 months)", value: "Long Term" },
];
const LLM_OPTIONS = [
  "Claude (Anthropic)",
  "GPT (OpenAI)",
  "Gemini (Google)",
  "Llama (Meta)",
  "Other",
  "Not sure yet",
].map((o) => ({ label: o, value: o }));
const POST_BUILD_OPTIONS = [
  { label: "Deployment", value: "Deployment" },
  { label: "Code Review", value: "Code Review" },
  { label: "Both", value: "Both" },
  { label: "Neither", value: "Neither" },
];

const AIRequestStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId, categoryKind } = useWizard();
  const { systems } = useAppSelector((state) => state.settings);
  const { currentUserId } = useAppSelector((state) => state.auth);

  const systemOptions = systems
    .filter((s) => s.active)
    .map((s) => ({ label: s.name, value: s.name }));

  const { control, handleSubmit, setValue, watch } = useForm<AIRequestValues>({
    resolver: zodResolver(aiRequestSchema),
    defaultValues: { ...formData.aiRequest },
  });

  // Only applies to "Build with AI" requests
  if (categoryKind !== "ai_build") {
    return (
      <div className="card space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="card-title mb-0.5">AI Request — Not Applicable</h3>
            <p className="card-description">
              This step only applies to "Build with AI" requests.
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

  const onSubmit = (values: AIRequestValues) => {
    updateFormData({ aiRequest: { ...values } });

    const selfCertify =
      !formData.isEmergency &&
      values.whoUsesSoftware === "Internal" &&
      values.requiresStaffPersonalData === "No" &&
      values.requiresSensitiveData === "No";

    if (selfCertify) {
      navigate(`/self/changes/new/ai-policy?draftId=${draftId}`);
    } else {
      navigate(`/self/changes/new/risk?draftId=${draftId}`);
    }
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
          Tell us about the AI solution you want to build — its complexity, who
          uses it, the data and models involved, and what you'll need after
          development.
        </p>
      </div>

      {/* Problem framing */}
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
          rootClassName="col-span-full"
        >
          <Input.TextArea
            placeholder="Have simpler non-AI alternatives been considered?"
            rows={2}
            value={watch("simplerAlternative")}
            onChange={(e) => setValue("simplerAlternative", e.target.value)}
            className={FORM.TEXTAREA_CLASS_NAME}
          />
        </FormField>
      </div>

      {/* Approach assessment */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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

        <FormField
          name="duration"
          control={control}
          label="How long will it be used?"
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

      {/* Usage, data & models */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <FormField
          name="whoUsesSoftware"
          control={control}
          label="Who will use this software?"
          required
        >
          <Select
            value={watch("whoUsesSoftware") || undefined}
            onChange={(v) => setValue("whoUsesSoftware", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={WHO_USES_OPTIONS}
          />
        </FormField>

        <FormField
          name="requiresStaffPersonalData"
          control={control}
          label="Requires staff personal data?"
          required
        >
          <Select
            value={watch("requiresStaffPersonalData") || undefined}
            onChange={(v) => setValue("requiresStaffPersonalData", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="requiresSensitiveData"
          control={control}
          label="Requires company sensitive data?"
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
          name="usesProductionData"
          control={control}
          label="Will it use production data?"
          required
        >
          <Select
            value={watch("usesProductionData") || undefined}
            onChange={(v) => setValue("usesProductionData", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="usesDefaultStack"
          control={control}
          label="Use anything from the default stack?"
          required
        >
          <Select
            value={watch("usesDefaultStack") || undefined}
            onChange={(v) => setValue("usesDefaultStack", v)}
            placeholder="Yes / No"
            className={FORM.CLASS_NAME}
            options={YES_NO_OPTIONS}
          />
        </FormField>

        <FormField
          name="postBuildSupport"
          control={control}
          label="After development, what do you need?"
          required
        >
          <Select
            value={watch("postBuildSupport") || undefined}
            onChange={(v) => setValue("postBuildSupport", v)}
            placeholder="Select..."
            className={FORM.CLASS_NAME}
            options={POST_BUILD_OPTIONS}
          />
        </FormField>

        <FormField
          name="llmChoices"
          control={control}
          label="Which LLMs are you considering?"
          required
          rootClassName="md:col-span-2 lg:col-span-3"
        >
          <Select
            mode="multiple"
            value={watch("llmChoices")}
            onChange={(v) => setValue("llmChoices", v)}
            placeholder="Select one or more..."
            className={FORM.CLASS_NAME}
            options={LLM_OPTIONS}
          />
        </FormField>

        <FormField
          name="integratesWithSystems"
          control={control}
          label="Which systems would it integrate with?"
          rootClassName="md:col-span-2 lg:col-span-3"
        >
          <Select
            mode="multiple"
            allowClear
            value={watch("integratesWithSystems")}
            onChange={(v) => setValue("integratesWithSystems", v)}
            placeholder="Select any systems it needs to integrate with (optional)..."
            className={FORM.CLASS_NAME}
            options={systemOptions}
          />
        </FormField>
      </div>

      {/* Supporting documents (AI-step scoped, shares the request's doc list) */}
      <div className="border-border border-t pt-6">
        <SupportingDocumentsUploader
          value={formData.supportingDocuments}
          onChange={(files) => updateFormData({ supportingDocuments: files })}
          uploadedBy={currentUserId}
          description="Attach any supporting documents for the AI build (architecture, data flows, vendor docs)."
        />
      </div>
    </form>
  );
};

export default AIRequestStep;
