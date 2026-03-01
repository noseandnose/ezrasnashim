import { useState, useRef } from "react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InlineImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  maxFileSize?: number;
  accept?: string;
  placeholder?: string;
}

/**
 * Inline image uploader with auto-upload on file selection.
 * Prioritizes file upload with URL input as a secondary option.
 */
export function InlineImageUploader({
  label,
  value,
  onChange,
  onGetUploadParameters,
  onComplete,
  maxFileSize = 10485760,
  accept = "image/*",
  placeholder = "Or paste image URL here"
}: InlineImageUploaderProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uppy] = useState(() =>
    new Uppy({
      id: `uppy-${Math.random().toString(36).substr(2, 9)}`,
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize,
        allowedFileTypes: accept === "image/*" ? ['image/*'] : null,
      },
      autoProceed: true,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("upload", () => {
        setIsUploading(true);
      })
      .on("complete", (result) => {
        setIsUploading(false);
        onComplete?.(result);
        setShowUrlInput(false);
      })
      .on("error", () => {
        setIsUploading(false);
      })
  );

  const handleFile = (file: File) => {
    uppy.cancelAll();
    try {
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    } catch {
      // Restriction error (size, type) — ignore silently
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        {isUploading ? (
          <p className="text-sm text-blue-600 font-medium">Uploading...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">Drop your file here or <span className="text-blue-600 underline">browse files</span></p>
            <p className="text-xs text-gray-400 mt-1">Max {Math.round(maxFileSize / 1024 / 1024)}MB</p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* URL Input - Secondary */}
      <div className="space-y-2">
        {!showUrlInput ? (
          <button
            type="button"
            onPointerDown={() => setShowUrlInput(true)}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Or enter image URL instead
          </button>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-sm"
            />
            <button
              type="button"
              onPointerDown={() => setShowUrlInput(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide URL input
            </button>
          </div>
        )}
      </div>

      {/* Current Image Preview */}
      {value && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600">Current image:</div>
          <div className="flex items-start gap-3">
            {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={value}
                alt="Preview"
                className="w-20 h-20 object-cover rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="flex-1 text-xs text-gray-600 break-all">{value}</div>
          </div>
        </div>
      )}
    </div>
  );
}
