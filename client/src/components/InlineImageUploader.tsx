import { useState, useEffect } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
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
  maxFileSize = 10485760, // 10MB default
  accept = "image/*",
  placeholder = "Or paste image URL here"
}: InlineImageUploaderProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uppy] = useState(() =>
    new Uppy({
      id: `uppy-${Math.random().toString(36).substr(2, 9)}`,
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize,
        allowedFileTypes: accept === "image/*" ? ['image/*'] : null,
      },
      autoProceed: true, // Auto-upload on file selection
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
        // Close URL input on successful upload
        setShowUrlInput(false);
      })
      .on("error", () => {
        setIsUploading(false);
      })
  );

  // Cleanup Uppy on unmount
  useEffect(() => {
    return () => {
      // Uppy cleanup handled by React
    };
  }, [uppy]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      
      {/* Inline Upload Area - Primary */}
      <div className="relative uppy-custom-text">
        <Dashboard
          uppy={uppy}
          hideUploadButton={false}
          proudlyDisplayPoweredByUppy={false}
          height={200}
          width="100%"
          locale={{
            strings: {
              dropHint: '',
              dropPasteFiles: 'Drop your file here or %{browseFiles}',
              browseFiles: 'Browse files',
            }
          }}
        />
      </div>

      {/* URL Input - Secondary */}
      <div className="space-y-2">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
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
              onClick={() => setShowUrlInput(false)}
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

      {isUploading && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <Upload className="w-4 h-4 animate-pulse" />
          Uploading...
        </div>
      )}
    </div>
  );
}
