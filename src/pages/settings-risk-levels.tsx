import React, { useState } from "react";
import {
  Button,
  Modal,
  Select,
  InputNumber,
  Input,
  Popconfirm,
  type TableProps,
} from "antd";
import { DataTable } from "../components/ui/data-table";
import { useAppSelector, useAppDispatch } from "../state/store";
import {
  addRiskLevel,
  updateRiskLevel,
  removeRiskLevel,
  type RiskLevelConfig,
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

const riskLevelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  severity: z
    .number({ message: "Enter a severity rank" })
    .min(1, "Must be at least 1"),
  maxEscalationHours: z
    .number({ message: "Enter the escalation window in hours" })
    .min(1, "Must be at least 1 hour")
    .max(720, "Must be 720 hours or less"),
  escalateTo: z.string().min(1, "Escalation target is required"),
  approvalStages: z
    .array(stageSchema)
    .min(1, "Add at least one approval stage"),
});

type RiskLevelFormValues = z.infer<typeof riskLevelSchema>;

const stageSummary = (stage: RiskLevelConfig["approvalStages"][number]) =>
  stage.type === "generic" ? "Requester picks" : stage.role || "Role";

export const SettingsRiskLevels: React.FC = () => {
  const dispatch = useAppDispatch();
  const { riskLevels } = useAppSelector((state) => state.settings);
  const users = useAppSelector((state) => state.auth.users);

  const userOptions = users.map((u) => ({
    label: `${u.name} (${u.department})`,
    value: u.id,
  }));

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const sortedRiskLevels = [...riskLevels].sort(
    (a, b) => a.severity - b.severity,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RiskLevelFormValues>({
    resolver: zodResolver(riskLevelSchema),
    defaultValues: {
      name: "",
      severity: 1,
      maxEscalationHours: 24,
      escalateTo: "",
      approvalStages: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "approvalStages",
  });

  const watchedStages = useWatch({ control, name: "approvalStages" });

  const openAddDialog = () => {
    const nextSeverity =
      riskLevels.length > 0
        ? Math.max(...riskLevels.map((r) => r.severity)) + 1
        : 1;
    setEditingId(null);
    reset({
      name: "",
      severity: nextSeverity,
      maxEscalationHours: 24,
      escalateTo: "",
      approvalStages: [],
    });
    setIsOpen(true);
  };

  const openEditDialog = (config: RiskLevelConfig) => {
    setEditingId(config.id);
    reset({
      name: config.name,
      severity: config.severity,
      maxEscalationHours: config.maxEscalationHours,
      escalateTo: config.escalateTo,
      approvalStages: config.approvalStages.map((s) => ({
        id: s.id,
        type: s.type,
        role: s.role,
      })),
    });
    setIsOpen(true);
  };

  const onSubmit: SubmitHandler<RiskLevelFormValues> = (data) => {
    const updates = {
      name: data.name,
      severity: data.severity,
      maxEscalationHours: data.maxEscalationHours,
      escalateTo: data.escalateTo,
      approvalStages: data.approvalStages.map((s) => ({
        id: s.id,
        type: s.type,
        role: s.type === "role_based" ? s.role : undefined,
      })),
    };
    if (editingId) {
      dispatch(updateRiskLevel({ id: editingId, updates }));
    } else {
      dispatch(addRiskLevel({ id: `risk-${Date.now()}`, ...updates }));
    }
    setIsOpen(false);
  };

  const columns: TableProps<RiskLevelConfig>["columns"] = [
    {
      key: "name",
      dataIndex: "name",
      title: "Risk Level",
      render: (_, record) => (
        <Tag color={Utils.resolveRiskColor(riskLevels, record.name)}>
          {record.name}
        </Tag>
      ),
    },
    {
      key: "severity",
      dataIndex: "severity",
      title: "Severity",
      render: (_, record) => (
        <span className="text-fade font-semibold">{record.severity}</span>
      ),
    },
    {
      key: "maxEscalationHours",
      dataIndex: "maxEscalationHours",
      title: "Max Escalation",
      render: (_, record) => (
        <span className="text-fade font-semibold">
          {record.maxEscalationHours} hrs
        </span>
      ),
    },
    {
      key: "escalateTo",
      dataIndex: "escalateTo",
      title: "Escalate To",
      render: (_, record) => (
        <span className="text-fade font-semibold">
          {userName(record.escalateTo)}
        </span>
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
            title="Are you sure you want to delete this risk level?"
            description={
              riskLevels.length <= 1
                ? "At least one risk level must remain."
                : undefined
            }
            onConfirm={() => dispatch(removeRiskLevel(record.id))}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ disabled: riskLevels.length <= 1 }}
          >
            <Button
              type="default"
              disabled={riskLevels.length <= 1}
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
        name="risk levels"
        columns={columns}
        dataSource={sortedRiskLevels}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search risk levels...", position: "left" }}
        right={[
          <Button
            key="add"
            type="primary"
            onClick={openAddDialog}
            className="text-body-xs flex h-11! items-center gap-1.5 rounded-lg! font-bold"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Risk Level
          </Button>,
        ]}
      />

      <Modal
        open={isOpen}
        centered
        onCancel={() => setIsOpen(false)}
        okText="Save Risk Level"
        cancelText="Cancel"
        okButtonProps={{
          htmlType: "submit",
          form: "settings-risk-level-form",
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
          id="settings-risk-level-form"
          onSubmit={handleSubmit(onSubmit)}
          className="text-primary-alpha space-y-5"
        >
          <div>
            <h3 className="text-h1 text-primary-alpha font-bold">
              {editingId ? "Edit Risk Level" : "Add Risk Level"}
            </h3>
            <p className="text-body-xs text-fade-2 font-medium">
              Configure the name, severity rank, escalation SLA, and approval
              flow for this risk level. Tag color is assigned automatically
              based on severity relative to other risk levels.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="name"
              label="Name"
              labelProps={FORM.LABEL_PROPS}
            >
              <Input placeholder="e.g. Critical" className={FORM.CLASS_NAME} />
            </FormField>

            <FormField
              control={control}
              name="severity"
              label="Severity Rank"
              labelProps={FORM.LABEL_PROPS}
            >
              <InputNumber
                min={1}
                placeholder="e.g. 2"
                className={FORM.CLASS_NAME}
              />
            </FormField>

            <FormField
              control={control}
              name="maxEscalationHours"
              label="Max Hours Before Escalation"
              labelProps={FORM.LABEL_PROPS}
            >
              <InputNumber
                min={1}
                max={720}
                placeholder="e.g. 48"
                className={FORM.CLASS_NAME}
              />
            </FormField>

            <FormField
              control={control}
              name="escalateTo"
              label="Escalate To"
              labelProps={FORM.LABEL_PROPS}
              rootClassName="sm:col-span-2"
            >
              <Select
                placeholder="Select a user"
                className={FORM.CLASS_NAME}
                showSearch
                optionFilterProp="label"
                options={userOptions}
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
            {/* When stages array itself is too short, message lands on the array */}
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

export default SettingsRiskLevels;
