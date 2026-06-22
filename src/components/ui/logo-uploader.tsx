import React from "react";
import { Upload, message } from "antd";
import type { UploadProps } from "antd";
import { Image as ImageIcon, Pencil, X } from "lucide-react";

interface LogoUploaderProps {
  value?: string;
  onChange?: (value: string) => void;
  size?: number;
}

// Keeps the in-memory store light, since logos are persisted as base64.
const MAX_SIZE_BYTES = 1024 * 1024;

/**
 * Square logo preview + upload control. There is no real file-storage
 * backend, so the selected image is read into a base64 data URL via
 * FileReader and that string is what gets stored as SystemOption.logo —
 * the same field also happily holds a plain external URL for seeded
 * defaults, since consumers just render it as an <img src>.
 */
const LogoUploader: React.FC<LogoUploaderProps> = ({
  value,
  onChange,
  size = 64,
}) => {
  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Please upload an image file.");
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      message.error("Logo image must be smaller than 1MB.");
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange?.(reader.result as string);
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="border-border bg-bg-muted flex shrink-0 items-center justify-center overflow-hidden rounded-xl border"
        style={{ width: size, height: size }}
      >
        {value ? (
          <img
            src={value}
            alt="Logo"
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <ImageIcon className="text-fade-2 h-6 w-6" />
        )}
      </div>
      <div className="flex items-center gap-3">
        <Upload
          accept="image/*"
          showUploadList={false}
          maxCount={1}
          beforeUpload={beforeUpload}
        >
          <button
            type="button"
            className="border-border text-fade hover:bg-bg-muted flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            {value ? "Change Logo" : "Upload Logo"}
          </button>
        </Upload>
        {value && (
          <button
            type="button"
            onClick={() => onChange?.("")}
            className="text-fade-2 flex items-center gap-1 text-xs font-semibold transition-colors hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default LogoUploader;
