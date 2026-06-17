import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Select } from "antd";
import { RotateCcw } from "lucide-react";
import FormField from "../../components/ui/form-field";
import { FORM } from "../../static";
import { useWizard } from "./new-change-wizard";
import { useAppSelector } from "../../state/store";

const rollbackSchema = z.object({
  steps: z.string().min(1, "Rollback steps are required"),
  responsiblePerson: z.string().min(1, "Responsible person is required"),
  estimatedTime: z.string().min(1, "Estimated rollback time is required"),
  dependencies: z.string().optional(),
});

type RollbackValues = z.infer<typeof rollbackSchema>;

const RollbackStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId } = useWizard();
  const users = useAppSelector((state) => state.auth.users);

  const { control, handleSubmit, setValue, watch } = useForm<RollbackValues>({
    resolver: zodResolver(rollbackSchema),
    defaultValues: {
      steps: formData.rollbackPlan.steps,
      responsiblePerson: formData.rollbackPlan.responsiblePerson,
      estimatedTime: formData.rollbackPlan.estimatedTime,
      dependencies: formData.rollbackPlan.dependencies,
    },
  });

  const onSubmit = (values: RollbackValues) => {
    updateFormData({
      rollbackPlan: {
        steps: values.steps,
        responsiblePerson: values.responsiblePerson,
        estimatedTime: values.estimatedTime,
        dependencies: values.dependencies || "",
      },
    });
    navigate(`/self/changes/new/review?draftId=${draftId}`);
  };

  const handleSkip = () => {
    navigate(`/self/changes/new/review?draftId=${draftId}`);
  };

  return (
    <div className="space-y-4">
      <form
        id="step-form"
        onSubmit={handleSubmit(onSubmit)}
        className="card space-y-6 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="card-title mb-1">Rollback Plan</h3>
              <p className="card-description">
                Define the steps to revert this change if something goes wrong.
                This step is optional but recommended for medium and high risk
                changes.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSkip}
            className="border-border! text-fade! h-9! shrink-0 cursor-pointer rounded-lg! bg-transparent px-4! text-sm! leading-5! font-medium! shadow-none!"
          >
            Skip this step
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Rollback Steps */}
          <FormField
            name="steps"
            control={control}
            label="Rollback Steps"
            required
            rootClassName="col-span-full"
          >
            <Input.TextArea
              placeholder="1. Revert database migration&#10;2. Restore previous configuration&#10;3. Verify system functionality&#10;4. Notify stakeholders"
              rows={5}
              value={watch("steps")}
              onChange={(e) => setValue("steps", e.target.value)}
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </FormField>

          {/* Responsible Person */}
          <FormField
            name="responsiblePerson"
            control={control}
            label="Responsible Person"
            required
          >
            <Select
              showSearch={{ optionFilterProp: "label" }}
              placeholder="Select responsible person..."
              className={FORM.CLASS_NAME}
              options={[
                ...users.map((u) => ({
                  label: `${u.name} (${u.department})`,
                  value: u.name,
                })),
              ]}
            />
          </FormField>

          {/* Estimated Rollback Time */}
          <FormField
            name="estimatedTime"
            control={control}
            label="Estimated Rollback Time"
            required
          >
            <Input
              placeholder="e.g. 30 minutes, 2 hours"
              className={FORM.CLASS_NAME}
            />
          </FormField>

          {/* Dependencies / Risks */}
          <FormField
            name="dependencies"
            control={control}
            label="Dependencies & Risks"
            rootClassName="col-span-full"
          >
            <Input.TextArea
              placeholder="List any dependencies or risks that could affect the rollback process..."
              rows={3}
              value={watch("dependencies")}
              onChange={(e) => setValue("dependencies", e.target.value)}
              className={FORM.TEXTAREA_CLASS_NAME}
            />
          </FormField>
        </div>
      </form>
    </div>
  );
};

export default RollbackStep;
