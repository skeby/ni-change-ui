import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Select, DatePicker, Switch, message } from "antd";
import { Siren } from "lucide-react";
import dayjs from "dayjs";
import { useAppSelector } from "../../state/store";
import FormField from "../../components/ui/form-field";
import SupportingDocumentsUploader from "../../components/ui/supporting-documents-uploader";
import { FORM } from "../../static";
import { useWizard, getCategoryKind } from "./new-change-wizard";
import {
  CATEGORY_KIND_LABELS,
  type ChangeCategoryKind,
} from "../../state/slices/settings-slice";

const generalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  systemAffected: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  requestedTimeline: z.string().min(1, "Requested timeline is required"),
});

type GeneralValues = z.infer<typeof generalSchema>;

const KIND_ORDER: ChangeCategoryKind[] = [
  "ai_license",
  "ai_build",
  "update_existing",
  "new_system",
];

const aiLicenseTemplate = (categoryName: string) => ({
  title: `AI Tool License Request — ${categoryName}`,
  description:
    "Requesting a license for an existing AI tool. Please specify the tool name, the intended business use, the number of seats/users required, and the expected start date.",
});

const GeneralStep: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, draftId } = useWizard();
  const { currentUserId, users, activeRoles } = useAppSelector(
    (state) => state.auth,
  );
  const { systems, categories } = useAppSelector((state) => state.settings);
  const currentUser = users.find((u) => u.id === currentUserId);
  const isAdmin = activeRoles.includes("Admin");

  const systemOptions = systems
    .filter((s) => s.active)
    .map((s) => ({ label: s.name, value: s.name }));

  // Categories grouped by behavioral kind
  const groupedCategoryOptions = KIND_ORDER.map((kind) => ({
    label: CATEGORY_KIND_LABELS[kind],
    title: CATEGORY_KIND_LABELS[kind],
    options: categories
      .filter((c) => c.active && c.kind === kind)
      .map((c) => ({ label: c.name, value: c.name })),
  })).filter((g) => g.options.length > 0);

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

  const watchedCategory = watch("category");
  const watchedKind = getCategoryKind(watchedCategory || "", categories);
  const systemRequired = watchedKind !== "new_system";

  // Auto-fill submitter info (captured silently — not shown on the form)
  useEffect(() => {
    if (currentUser) {
      updateFormData({
        submitterName: currentUser.name,
        submitterDepartment: currentUser.department,
      });
    }
  }, [currentUser]);

  const handleCategoryChange = (value: string) => {
    setValue("category", value);
    const kind = getCategoryKind(value, categories);
    // Auto-fill title/description for AI license requests, but never clobber
    // anything the user has already typed.
    if (kind === "ai_license" && !watch("title") && !watch("description")) {
      const tmpl = aiLicenseTemplate(value);
      setValue("title", tmpl.title);
      setValue("description", tmpl.description);
    }
    // New-system requests have no "system affected" — clear any stale value.
    if (kind === "new_system") {
      setValue("systemAffected", "");
    }
  };

  const onSubmit = (values: GeneralValues) => {
    if (systemRequired && !values.systemAffected) {
      message.error("System affected is required for this category.");
      return;
    }
    if (formData.isEmergency && isAdmin) {
      if (!formData.emergencyActionTaken.trim()) {
        message.error("Describe the emergency action that was taken.");
        return;
      }
      if (!formData.emergencyActionTakenAt) {
        message.error("Specify when the emergency action was taken.");
        return;
      }
    }

    updateFormData({
      title: values.title,
      description: values.description,
      systemAffected: systemRequired ? values.systemAffected || "" : "",
      category: values.category,
      requestedTimeline: values.requestedTimeline,
    });

    if (watchedKind === "ai_build") {
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
          Start by choosing the type of request. The form adapts to the category
          you select.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Category — first, since it drives the rest of the form */}
        <FormField
          name="category"
          control={control}
          label="What type of request is this?"
          required
          rootClassName="col-span-full"
        >
          <Select
            showSearch={{ optionFilterProp: "label" }}
            value={watchedCategory || undefined}
            onChange={handleCategoryChange}
            placeholder="Select a category..."
            className={FORM.CLASS_NAME}
            options={groupedCategoryOptions}
          />
        </FormField>

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

        {/* System Affected — hidden for brand-new systems */}
        {systemRequired && (
          <FormField
            name="systemAffected"
            control={control}
            label="System Affected"
            required
          >
            <Select
              showSearch={{ optionFilterProp: "label" }}
              value={watch("systemAffected") || undefined}
              onChange={(value) => setValue("systemAffected", value)}
              placeholder="Select system..."
              className={FORM.CLASS_NAME}
              options={systemOptions}
            />
          </FormField>
        )}

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

      {/* Supporting Documents */}
      <div className="border-border border-t pt-6">
        <SupportingDocumentsUploader
          value={formData.supportingDocuments}
          onChange={(files) => updateFormData({ supportingDocuments: files })}
          uploadedBy={currentUserId}
        />
      </div>

      {/* Emergency Change — admin only */}
      {isAdmin && (
        <div className="border-border border-t pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <span className="text-body-sm text-primary-alpha font-bold">
                  Emergency Change
                </span>
                <p className="text-body-xs text-fade mt-0.5 max-w-md">
                  Record an urgent action that has already been taken, for
                  retroactive review.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.isEmergency}
              onChange={(checked) => updateFormData({ isEmergency: checked })}
            />
          </div>

          {formData.isEmergency && (
            <div className="animate-fade-in mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col lg:col-span-2">
                <span className="text-sm text-secondary-alpha mb-1 leading-5">
                  What action was taken?{" "}
                  <span className="text-error font-bold">*</span>
                </span>
                <Input.TextArea
                  placeholder="Describe the urgent action already taken and why it could not wait for approval..."
                  rows={3}
                  value={formData.emergencyActionTaken}
                  onChange={(e) =>
                    updateFormData({ emergencyActionTaken: e.target.value })
                  }
                  className={FORM.TEXTAREA_CLASS_NAME}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-secondary-alpha mb-1 leading-5">
                  When was it taken?{" "}
                  <span className="text-error font-bold">*</span>
                </span>
                <DatePicker
                  showTime
                  value={
                    formData.emergencyActionTakenAt
                      ? dayjs(formData.emergencyActionTakenAt)
                      : null
                  }
                  onChange={(date) =>
                    updateFormData({
                      emergencyActionTakenAt: date ? date.toISOString() : "",
                    })
                  }
                  className={FORM.CLASS_NAME}
                  placeholder="Select date & time..."
                />
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
};

export default GeneralStep;
