"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRatingField } from "./star-rating-field";
import { FileUploadField } from "./file-upload-field";
import type { FormField } from "@/lib/types";

interface FieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  hideLabel?: boolean;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  hideLabel,
}: FieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "url":
        return (
          <Input
            type={field.type === "url" ? "url" : field.type === "email" ? "email" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            className="h-11"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            className="h-11"
          />
        );

      case "textarea":
      case "richtext":
        return (
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            rows={field.type === "richtext" ? 6 : 3}
          />
        );

      case "dropdown":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={onChange}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <div className="space-y-2.5">
            {(field.options || []).map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-all duration-200 ${
                  value === opt
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="h-4 w-4 accent-[oklch(0.55_0.2_260)]"
                />
                <span className="text-[13px]">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2.5">
            {(field.options || []).map((opt) => {
              const isChecked = Array.isArray(value) && value.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-all duration-200 ${
                    isChecked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 hover:border-border hover:bg-accent/30"
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (checked) arr.push(opt);
                      else arr.splice(arr.indexOf(opt), 1);
                      onChange(arr);
                    }}
                  />
                  <span className="text-[13px]">{opt}</span>
                </label>
              );
            })}
          </div>
        );

      case "star-rating":
        return (
          <StarRatingField
            value={(value as number) || 0}
            onChange={onChange}
            maxRating={field.maxRating || 5}
          />
        );

      case "file-upload":
        return (
          <FileUploadField
            value={(value as string) || ""}
            onChange={(blobId) => onChange(blobId)}
            acceptTypes={field.acceptTypes}
            maxFileSize={field.maxFileSize}
          />
        );

      default:
        return <Input value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} className="h-11" />;
    }
  };

  if (hideLabel) {
    return (
      <div className="space-y-2.5">
        {renderField()}
        {error && (
          <p className="text-[12px] text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <Label className="text-[14px] font-medium">
        {field.label || "Untitled Field"}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-[12px] text-muted-foreground -mt-1">{field.description}</p>
      )}
      {renderField()}
      {error && (
        <p className="text-[12px] text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}
