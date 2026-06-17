import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import { useAppSelector } from "../../state/store";
import FormField from "../../components/ui/form-field";
import { FORM } from "../../static";
import { useWizard } from "./new-change-wizard";
import type { ChangeCategory } from "../../state/slices/changes-slice";

const generalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  systemAffected: z.string().min(1, "System affected is required"),
  category: z.string().min(1, "Category is required"),
  requestedTimeline: z.string().min(1, "Requested timeline is required"),
});

type GeneralValues = z.infer<typeof generalSchema>;

const SYSTEM_OPTIONS = [
  "NetSuite",
  "Salesforce",
  "ERP",
  "HRIS",
  "CRM",
  "SharePoint",
  "Power BI",
  "Custom Application",
  "Other",
];

const CATEGORY_OPTIONS: ChangeCategory[] = [
  "New Feature",
  "Bug Fix",
  "Configuration Change",
  "Integration",
  "Security Patch",
  "AI",
];

const GeneralStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId } = useWizard();
  const { currentUserId, users } = useAppSelector((state) => state.auth);
  const currentUser = users.find((u) => u.id === currentUserId);

  const { control, handleSubmit, setValue, watch } = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      title: formData.title,
      description: formData.description,
      systemAffected: formData.systemAffected,
      category: formData.category,
      requestedTimeline: formData.requestedTimeline,
    },
  });

  // Auto-fill submitter info
  useEffect(() => {
    if (currentUser) {
      updateFormData({
        submitterName: currentUser.name,
        submitterDepartment: currentUser.department,
      });
    }
  }, [currentUser]);

  const onSubmit = (values: GeneralValues) => {
    updateFormData({
      title: values.title,
      description: values.description,
      systemAffected: values.systemAffected,
      category: values.category as ChangeCategory,
      requestedTimeline: values.requestedTimeline,
    });

    // If category is AI, go to AI request step; otherwise skip to risk
    if (values.category === "AI") {
      navigate(`/self/changes/new/ai-request?draftId=${draftId}`);
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
        <h3 className="card-title mb-1">General Information</h3>
        <p className="card-description">
          Provide the basic details of the change request including the affected
          system and category.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Title */}
        <FormField
          name="title"
          control={control}
          label="Change Request Title"
          required
          rootClassName="col-span-full"
        >
          <Input
            placeholder="e.g. Update invoice approval workflow in NetSuite"
            className={FORM.CLASS_NAME}
          />
        </FormField>

        {/* Description */}
        <FormField
          name="description"
          control={control}
          label="Description"
          required
          rootClassName="col-span-full"
        >
          <Input.TextArea
            placeholder="Describe the change in detail..."
            rows={4}
            value={watch("description")}
            onChange={(e) => setValue("description", e.target.value)}
            className={FORM.TEXTAREA_CLASS_NAME}
          />
        </FormField>

        {/* System Affected */}
        <FormField
          name="systemAffected"
          control={control}
          label="System Affected"
          required
        >
          <Select
            value={watch("systemAffected") || undefined}
            onChange={(value) => setValue("systemAffected", value)}
            placeholder="Select system..."
            className={FORM.CLASS_NAME}
            options={SYSTEM_OPTIONS.map((s) => ({ label: s, value: s }))}
          />
        </FormField>

        {/* Category */}
        <FormField name="category" control={control} label="Category" required>
          <Select
            value={watch("category") || undefined}
            onChange={(value) => setValue("category", value)}
            placeholder="Select category..."
            className={FORM.CLASS_NAME}
            options={CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
          />
        </FormField>

        {/* Submitter Name (auto-filled, read-only) */}
        <div className="flex flex-col">
          <label className="text-body-sm text-primary-alpha mb-1.5 block font-bold">
            Submitter Name
          </label>
          <Input
            value={currentUser?.name || ""}
            disabled
            className={FORM.CLASS_NAME}
          />
        </div>

        {/* Department (auto-filled, read-only) */}
        <div className="flex flex-col">
          <label className="text-body-sm text-primary-alpha mb-1.5 block font-bold">
            Department
          </label>
          <Input
            value={currentUser?.department || ""}
            disabled
            className={FORM.CLASS_NAME}
          />
        </div>

        {/* Requested Timeline */}
        <FormField
          name="requestedTimeline"
          control={control}
          label="Requested Timeline"
          required
          render={({ field }) => (
            <DatePicker
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) =>
                field.onChange(date ? date.format("YYYY-MM-DD") : "")
              }
              className={FORM.CLASS_NAME}
              placeholder="Select target date..."
              format="YYYY-MM-DD"
            />
          )}
        />
      </div>
    </form>
  );
};

export default GeneralStep;
