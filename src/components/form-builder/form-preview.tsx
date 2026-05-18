"use client";

import { Star } from "lucide-react";
import { getBlobUrl } from "@/lib/walrus";
import { FIELD_TYPE_CONFIG } from "@/lib/constants";
import type { FormField, FormSettings, FontFamily } from "@/lib/types";

const FONT_MAP: Record<FontFamily, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
};

interface FormPreviewProps {
  title: string;
  description: string;
  fields: FormField[];
  settings: FormSettings;
}

export function FormPreview({
  title,
  description,
  fields,
  settings,
}: FormPreviewProps) {
  const theme = settings.theme;
  const firstField = fields[0];

  const bgColor = theme?.backgroundColor || "#0a0a0a";
  const textColor = theme?.textColor || "#f2f2f2";
  const accentColor = theme?.primaryColor || textColor;
  const fontFamily = theme?.fontFamily
    ? FONT_MAP[theme.fontFamily]
    : "'Inter', sans-serif";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          Live Preview
        </p>
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-dot" />
      </div>

      {/* Scaled preview container */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/30 bg-muted/30">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-border/60" />
            <div className="h-2 w-2 rounded-full bg-border/60" />
            <div className="h-2 w-2 rounded-full bg-border/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-3.5 rounded bg-muted/60 max-w-[120px] mx-auto" />
          </div>
        </div>

        {/* Preview content — mini Typeform mockup */}
        <div
          className="relative p-5 min-h-[320px] flex flex-col"
          style={{
            backgroundColor: bgColor,
            color: textColor,
            fontFamily,
          }}
        >
          {/* Progress bar */}
          <div
            className="h-0.5 rounded-full mb-4"
            style={{ backgroundColor: `${textColor}15` }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: fields.length > 0 ? `${(1 / fields.length) * 100}%` : "0%",
                backgroundColor: accentColor,
              }}
            />
          </div>

          {/* Logo */}
          {theme?.logoBlobId && (
            <div className="mb-3">
              <img
                src={getBlobUrl(theme.logoBlobId)}
                alt=""
                className="h-5 w-auto object-contain"
              />
            </div>
          )}

          {/* Title header */}
          <div className="mb-1">
            <p
              className="text-[10px] font-medium truncate"
              style={{ opacity: 0.4 }}
            >
              {title || "Untitled form"}
            </p>
          </div>

          {/* Field preview */}
          <div className="flex-1 flex flex-col justify-center">
            {!firstField ? (
              <div className="text-center py-8">
                <p className="text-[11px]" style={{ opacity: 0.3 }}>
                  Add a field to see preview
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span
                    className="text-[9px]"
                    style={{ opacity: 0.3 }}
                  >
                    1 &rarr;
                  </span>
                  <h3 className="text-[14px] font-semibold leading-tight mt-0.5">
                    {firstField.label || "Untitled Field"}
                    {firstField.required && (
                      <span className="text-red-400 ml-0.5">*</span>
                    )}
                  </h3>
                  {firstField.description && (
                    <p className="text-[10px] mt-0.5" style={{ opacity: 0.4 }}>
                      {firstField.description}
                    </p>
                  )}
                </div>

                {/* Fake input based on type */}
                <FieldPreview field={firstField} textColor={textColor} accentColor={accentColor} />

                {/* OK button */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 px-2.5 rounded text-[9px] font-medium flex items-center"
                    style={{
                      backgroundColor: accentColor,
                      color: bgColor,
                    }}
                  >
                    OK
                  </div>
                  <span className="text-[8px]" style={{ opacity: 0.25 }}>
                    Enter
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step counter */}
          {fields.length > 0 && (
            <div
              className="text-[9px] text-right mt-3 tabular-nums"
              style={{ opacity: 0.3 }}
            >
              1 of {fields.length}
            </div>
          )}
        </div>
      </div>

      {/* Field count badge */}
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fields.map((f, i) => (
            <div
              key={f.id}
              className={`h-5 px-1.5 rounded text-[9px] flex items-center gap-1 border ${
                i === 0
                  ? "border-foreground/20 bg-foreground/5 text-foreground"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              <span className="opacity-50">{i + 1}</span>
              {FIELD_TYPE_CONFIG[f.type]?.label || f.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldPreview({
  field,
  textColor,
  accentColor,
}: {
  field: FormField;
  textColor: string;
  accentColor: string;
}) {
  switch (field.type) {
    case "text":
    case "email":
    case "url":
    case "number":
    case "textarea":
    case "richtext":
      return (
        <div
          className="border-b pb-1.5"
          style={{ borderColor: `${textColor}20` }}
        >
          <span className="text-[11px]" style={{ opacity: 0.25 }}>
            {field.placeholder || "Type your answer here..."}
          </span>
        </div>
      );

    case "star-rating":
      return (
        <div className="flex gap-0.5">
          {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4"
              style={{ color: i < 3 ? accentColor : `${textColor}20` }}
              fill={i < 3 ? "currentColor" : "none"}
            />
          ))}
        </div>
      );

    case "dropdown":
      return (
        <div
          className="h-6 rounded border px-2 flex items-center"
          style={{ borderColor: `${textColor}20` }}
        >
          <span className="text-[10px]" style={{ opacity: 0.3 }}>
            Select...
          </span>
        </div>
      );

    case "checkbox":
    case "radio":
      return (
        <div className="space-y-1">
          {(field.options || []).slice(0, 3).map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`h-3 w-3 border ${field.type === "radio" ? "rounded-full" : "rounded-sm"}`}
                style={{ borderColor: `${textColor}30` }}
              />
              <span className="text-[10px]" style={{ opacity: 0.6 }}>
                {opt}
              </span>
            </div>
          ))}
        </div>
      );

    case "file-upload":
      return (
        <div
          className="h-10 rounded-lg border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: `${textColor}15` }}
        >
          <span className="text-[9px]" style={{ opacity: 0.25 }}>
            Click to upload
          </span>
        </div>
      );

    default:
      return null;
  }
}
