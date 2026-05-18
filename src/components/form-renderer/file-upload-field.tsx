"use client";

import { useState, useRef } from "react";
import { storeFile, getBlobUrl } from "@/lib/walrus";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileImage, FileVideo } from "lucide-react";
import { MAX_FILE_SIZE } from "@/lib/constants";

interface FileUploadFieldProps {
  value: string; // blobId
  onChange: (blobId: string) => void;
  acceptTypes?: string[];
  maxFileSize?: number;
}

export function FileUploadField({
  value,
  onChange,
  acceptTypes = ["image/*"],
  maxFileSize = MAX_FILE_SIZE,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxFileSize) {
      setError(`File too large. Max size: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setFileType(file.type);

    try {
      const blobId = await storeFile(file);
      onChange(blobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (value) {
    const isImage = fileType?.startsWith("image/");
    return (
      <div className="rounded-lg border p-3 flex items-center gap-3">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getBlobUrl(value)}
            alt="Uploaded"
            className="h-16 w-16 rounded object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
            <FileVideo className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName || "Uploaded file"}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {value.slice(0, 20)}...
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange("");
            setFileName(null);
            setFileType(null);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading to Walrus...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <FileImage className="h-6 w-6 text-muted-foreground" />
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Drop a file here or click to upload
            </p>
            <p className="text-xs text-muted-foreground/60">
              Max {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
