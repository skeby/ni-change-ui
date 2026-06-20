import React from "react";
import { Upload, Button } from "antd";
import { FaFile, FaUpload, FaXmark } from "react-icons/fa6";
import type { EvidenceFile } from "../../state/slices/changes-slice";
import Label from "./label";

interface SupportingDocumentsUploaderProps {
  value: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
  uploadedBy: string;
  label?: string;
  description?: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Supporting-document picker used across the change-request wizard. There is
 * no real upload backend yet, so the selected file's metadata is captured as
 * an EvidenceFile entry (mirroring the evidence pattern in change-detail.tsx).
 */
const SupportingDocumentsUploader: React.FC<
  SupportingDocumentsUploaderProps
> = ({
  value,
  onChange,
  uploadedBy,
  label = "Supporting Documents",
  description = "Attach any supporting documents (specs, quotes, screenshots).",
}) => {
  const handleSelect = (file: File) => {
    const entry: EvidenceFile = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    };
    onChange([...value, entry]);
    // Returning false prevents antd from attempting a network upload.
    return false;
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((f) => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={handleSelect}
        >
          <Button
            type="text"
            size="small"
            className="text-primary! flex! items-center! gap-1! font-semibold!"
          >
            <FaUpload className="mr-1.5 h-3 w-3" />
            Add Document
          </Button>
        </Upload>
      </div>

      {value.length === 0 ? (
        <p className="text-fade-2 text-sm italic">{description}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {value.map((doc) => (
            <div
              key={doc.id}
              className="bg-bg-muted border-border-muted flex items-center gap-3 rounded-2xl border p-3 shadow-sm"
            >
              <div className="bg-primary-light dark:bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <FaFile className="text-primary h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary-alpha truncate text-sm font-bold">
                  {doc.name}
                </p>
                <p className="text-fade-2 mt-0.5 text-xs font-medium">
                  {formatBytes(doc.size)}
                </p>
              </div>
              <Button
                type="text"
                danger
                icon={<FaXmark className="h-4 w-4" />}
                onClick={() => handleRemove(doc.id)}
                className="flex shrink-0 items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportingDocumentsUploader;
