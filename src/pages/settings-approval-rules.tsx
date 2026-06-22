import React, { useState } from "react";
import {
  Button,
  Modal,
  Select,
  Popconfirm,
  message,
  type TableProps,
} from "antd";
import { DataTable } from "../components/ui/data-table";
import { useAppSelector, useAppDispatch } from "../state/store";
import {
  addApprovalRule,
  updateApprovalRule,
  removeApprovalRule,
  type ApprovalRule,
} from "../state/slices/settings-slice";
import { Edit, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "../components/ui/form-field";
import { FORM, APPROVAL_ROLES } from "../static";
import Tag from "../components/ui/tag";
import { Utils } from "../utils";

const stageSchema = z
  .object({
    id: z.string(),
    type: z.enum(["generic", "role_based"]),
    role: z.string().optional(),
  })
  .refine((s) => s.type !== "role_based" || !!s.role, {
    message: "Select a role",
    path: ["role"],
  });

const ruleSchema = z.object({
  category: z.string().min(1, "Category is required"),
  system: z.string().min(1, "System is required"),
  riskLevel: z.string().min(1, "Risk level is required"),
  approvalStages: z
    .array(stageSchema)
    .min(1, "Add at least one approval stage"),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

const stageSummary = (stage: ApprovalRule["approvalStages"][number]) =>
  stage.type === "generic" ? "Requester picks" : stage.role || "Role";

export const SettingsApprovalRules: React.FC = () => {
  const dispatch = useAppDispatch();
  const { approvalRules, categories, systems, riskLevels } = useAppSelector(
    (state) => state.settings,
  );

  const categoryOptions = [
    { label: "Any category", value: "Any" },
    ...categories.map((c) => ({ label: c.name, value: c.name })),
  ];
  const systemOptions = [
    { label: "Any system", value: "Any" },
    ...systems.map((s) => ({ label: s.name, value: s.name })),
  ];
  const riskOptions = [...riskLevels]
    .sort((a, b) => a.severity - b.severity)
    .map((r) => ({ label: r.name, value: r.name }));

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      category: "Any",
      system: "Any",
      riskLevel: riskLevels[0]?.name ?? "",
      approvalStages: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "approvalStages",
  });

  const watchedStages = useWatch({ control, name: "approvalStages" });

  const openAddDialog = () => {
    setEditingId(null);
    reset({
      category: "Any",
      system: "Any",
      riskLevel: riskLevels[0]?.name ?? "",
      approvalStages: [],
    });
    setIsOpen(true);
  };

  const openEditDialog = (rule: ApprovalRule) => {
    setEditingId(rule.id);
    reset({
      category: rule.category,
      system: rule.system,
      riskLevel: rule.riskLevel,
      approvalStages: rule.approvalStages.map((s) => ({
        id: s.id,
        type: s.type,
        role: s.role,
      })),
    });
    setIsOpen(true);
  };

  const onSubmit: SubmitHandler<RuleFormValues> = (data) => {
    const isDuplicate = approvalRules.some(
      (r) =>
        r.id !== editingId &&
        r.category === data.category &&
        r.system === data.system &&
        r.riskLevel === data.riskLevel,
    );
    if (isDuplicate) {
      message.error(
        "An approval rule for this Category × System × Risk Level combination already exists.",
      );
      return;
    }

    const updates = {
      category: data.category,
      system: data.system,
      riskLevel: data.riskLevel,
      approvalStages: data.approvalStages.map((s) => ({
        id: s.id,
        type: s.type,
        role: s.type === "role_based" ? s.role : undefined,
      })),
    };
    if (editingId) {
      dispatch(updateApprovalRule({ id: editingId, updates }));
    } else {
      dispatch(addApprovalRule({ id: `ar-${Date.now()}`, ...updates }));
    }
    setIsOpen(false);
  };

  const columns: TableProps<ApprovalRule>["columns"] = [
    {
      key: "category",
      dataIndex: "category",
      title: "Category",
      render: (_, record) => (
        <span className="text-primary-alpha font-bold">{record.category}</span>
      ),
    },
    {
      key: "system",
      dataIndex: "system",
      title: "System",
      render: (_, record) => (
        <span className="text-fade font-semibold">{record.system}</span>
      ),
    },
    {
      key: "riskLevel",
      dataIndex: "riskLevel",
      title: "Risk Level",
      render: (_, record) => (
        <Tag color={Utils.resolveRiskColor(riskLevels, record.riskLevel)}>
          {record.riskLevel}
        </Tag>
      ),
    },
    {
      key: "approvalStages",
      title: "Approval Flow",
      render: (_, record) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {record.approvalStages.map((stage, idx) => (
            <React.Fragment key={stage.id}>
              {idx > 0 && <span className="text-fade-2">→</span>}
              <span className="bg-bg-muted text-secondary-alpha rounded-md px-2 py-0.5 text-xs font-semibold">
                {stageSummary(stage)}
              </span>
            </React.Fragment>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-2">
          <Button
            type="default"
            onClick={() => openEditDialog(record)}
            className="hover:bg-bg-muted text-fade border-border bg-white p-1"
            icon={<Edit className="h-3.5 w-3.5" />}
          />
          <Popconfirm
            title="Delete this approval rule?"
            onConfirm={() => dispatch(removeApprovalRule(record.id))}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="default"
              className="border-border bg-white p-1 text-red-500 hover:bg-red-50"
              icon={<Trash2 className="h-3.5 w-3.5" />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        name="approval rules"
        columns={columns}
        dataSource={approvalRules}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search approval rules...", position: "left" }}
        right={[
          <Button
            key="add"
            type="primary"
            onClick={openAddDialog}
            className="text-body-xs flex h-11! items-center gap-1.5 rounded-lg! font-bold"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Approval Rule
          </Button>,
        ]}
      />

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save Rule"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-approval-rule-form",
          className:
            "bg-primary hover:bg-primary/90 text-white border-none! font-semibold",
        }}
        cancelButtonProps={{
          className: "border-border! text-primary-alpha! hover:bg-bg-muted!",
        }}
        bodyProps={{ className: "pb-4!" }}
        width={560}
        destroyOnClose
      >
        <form
          id="settings-approval-rule-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              {editingId ? "Edit Approval Rule" : "Add Approval Rule"}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Define the approval flow for a Category × System × Risk Level
              combination. Use "Any" as a wildcard; the most specific matching
              rule wins.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name="category"
              label="Category"
              labelProps={FORM.LABEL_PROPS}
            >
              <Select
                className={FORM.CLASS_NAME}
                showSearch
                optionFilterProp="label"
                options={categoryOptions}
              />
            </FormField>

            <FormField
              control={control}
              name="system"
              label="System"
              labelProps={FORM.LABEL_PROPS}
            >
              <Select
                className={FORM.CLASS_NAME}
                showSearch
                optionFilterProp="label"
                options={systemOptions}
              />
            </FormField>

            <FormField
              control={control}
              name="riskLevel"
              label="Risk Level"
              labelProps={FORM.LABEL_PROPS}
            >
              <Select
                className={FORM.CLASS_NAME}
                showSearch
                optionFilterProp="label"
                options={riskOptions}
              />
            </FormField>
          </div>

          {/* Approval Flow stage editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={FORM.LABEL_PROPS.className + " font-semibold"}>
                Approval Flow
              </label>
              <Button
                type="text"
                size="small"
                onClick={() =>
                  append({
                    id: `stg-${Date.now()}`,
                    type: "role_based",
                    role: undefined,
                  })
                }
                icon={<Plus className="h-3.5 w-3.5" />}
                className="text-primary! flex! items-center! gap-1! font-semibold!"
              >
                Add Stage
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-body-xs text-fade-2 italic">
                No approval stages yet. Add at least one.
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const stageType = watchedStages?.[index]?.type;
                return (
                  <div
                    key={field.id}
                    className="border-border bg-bg-muted/30 space-y-3 rounded-xl border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body-xs text-fade-2 font-bold tracking-wider uppercase">
                        Stage {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="text"
                          size="small"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          icon={<ArrowUp className="h-3.5 w-3.5" />}
                          className="text-fade-2"
                        />
                        <Button
                          type="text"
                          size="small"
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                          icon={<ArrowDown className="h-3.5 w-3.5" />}
                          className="text-fade-2"
                        />
                        <Button
                          type="text"
                          size="small"
                          onClick={() => remove(index)}
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          className="text-red-500 hover:bg-red-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField
                        control={control}
                        name={`approvalStages.${index}.type`}
                        label="Approval Type"
                        labelProps={FORM.LABEL_PROPS}
                      >
                        <Select
                          className={FORM.CLASS_NAME}
                          options={[
                            {
                              value: "generic",
                              label: "Requester selects approver",
                            },
                            { value: "role_based", label: "Specific role" },
                          ]}
                        />
                      </FormField>

                      {stageType === "role_based" && (
                        <FormField
                          control={control}
                          name={`approvalStages.${index}.role`}
                          label="Role"
                          labelProps={FORM.LABEL_PROPS}
                        >
                          <Select
                            className={FORM.CLASS_NAME}
                            placeholder="Select a role"
                            options={APPROVAL_ROLES.map((r) => ({
                              value: r,
                              label: r,
                            }))}
                          />
                        </FormField>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.approvalStages?.root && (
              <span className="text-error block text-sm">
                {errors.approvalStages.root.message}
              </span>
            )}
            {errors.approvalStages &&
              !errors.approvalStages.root &&
              typeof errors.approvalStages.message === "string" && (
                <span className="text-error block text-sm">
                  {errors.approvalStages.message}
                </span>
              )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsApprovalRules;
