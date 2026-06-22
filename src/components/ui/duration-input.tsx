import React from "react";
import { InputNumber, Select, Space } from "antd";

export type DurationUnit = "Minutes" | "Hours";

interface DurationInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  min?: number;
}

const UNIT_OPTIONS: { label: string; value: DurationUnit }[] = [
  { label: "Minutes", value: "Minutes" },
  { label: "Hours", value: "Hours" },
];

const parseDuration = (
  value?: string,
): { amount: number | null; unit: DurationUnit } => {
  if (!value) return { amount: null, unit: "Minutes" };
  const match = value
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|minute|minutes|min)?/i);
  if (!match) return { amount: null, unit: "Minutes" };
  const amount = parseFloat(match[1]);
  const unit: DurationUnit = (match[2] || "").toLowerCase().startsWith("h")
    ? "Hours"
    : "Minutes";
  return { amount: Number.isNaN(amount) ? null : amount, unit };
};

/**
 * Estimated-duration field (used for rollback time): a numeric amount paired
 * with a Minutes/Hours unit, joined into one Space.Compact control. Stored
 * and round-tripped as a single "{amount} {unit}" string so it stays
 * compatible with existing string-typed fields (e.g. RollbackPlan.estimatedTime)
 * without a data-model change.
 */
const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  className,
  placeholder,
  min = 1,
}) => {
  const { amount, unit } = parseDuration(value);
  // The unit Select must stay a fixed width, so strip the shared "w-full!"
  // utility the number input relies on to fill the rest of the row.
  const unitClassName = className?.replace(/\bw-full!?/g, "").trim();

  const emit = (nextAmount: number | null, nextUnit: DurationUnit) => {
    onChange?.(nextAmount === null ? "" : `${nextAmount} ${nextUnit}`);
  };

  return (
    <Space.Compact block className="gap-x-3">
      <InputNumber
        min={min}
        value={amount}
        onChange={(v) => emit(v === null ? null : Number(v), unit)}
        placeholder={placeholder}
        className={className}
        style={{ flex: 1 }}
      />
      <Select
        value={unit}
        onChange={(v) => emit(amount, v)}
        options={UNIT_OPTIONS}
        popupMatchSelectWidth={false}
        className={unitClassName}
        style={{ width: 116, flexShrink: 0 }}
      />
    </Space.Compact>
  );
};

export default DurationInput;
