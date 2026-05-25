"use client";

import { getBlobUrl } from "@/lib/walrus";
import { FIELD_TYPE_CONFIG } from "@/lib/constants";
import type { FormField, FormSettings } from "@/lib/types";

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
  const accent = theme?.primaryColor || "#f15b3b";
  const firstField = fields[0];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-baseline mb-3.5">
        <span className="mono-label text-[11px]">&mdash;&mdash; proof copy</span>
        <span className="mono-label text-[10px]">puffy.wal.app/f/8a4b&hellip;</span>
      </div>

      {/* Preview card */}
      <div className="rounded-[18px] overflow-hidden relative"
           style={{
             background: "var(--cream)",
             border: "1px solid color-mix(in oklab, var(--ink) 16%, transparent)",
             boxShadow: "0 30px 60px -28px rgba(11,15,23,0.18)",
           }}>
        {/* Corner stamp */}
        <div className="absolute top-4 right-4 serif-italic text-[11px] px-2 py-1 rounded"
             style={{
               letterSpacing: "0.16em",
               textTransform: "uppercase",
               color: "color-mix(in oklab, var(--ink) 35%, transparent)",
               border: "1.5px solid currentColor",
               transform: "rotate(8deg)",
             }}>
          Proof &middot; v.0
        </div>

        {/* Top bar with progress */}
        <div className="px-5 pt-5 pb-3.5"
             style={{ borderBottom: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}>
          {/* Progress bar */}
          <div className="h-[3px] rounded-full overflow-hidden mb-3.5"
               style={{ background: "color-mix(in oklab, var(--ink) 10%, transparent)" }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{
                   width: fields.length > 0 ? `${100 / fields.length}%` : "0%",
                   background: accent,
                 }} />
          </div>
          <div className="flex justify-between mono-label text-[10.5px]"
               style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
            <span>{title || "Untitled form"}</span>
            <span>01 / {String(fields.length).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Question content */}
        <div className="px-5 pt-8 pb-6" style={{ minHeight: "280px" }}>
          {!firstField ? (
            <div className="text-center py-8">
              <p className="serif-italic text-[15px]" style={{ color: "color-mix(in oklab, var(--ink) 40%, transparent)" }}>
                Add a field to see preview
              </p>
            </div>
          ) : (
            <>
              <span className="mono-label text-[10px]" style={{ color: accent }}>&mdash;&mdash; question 01</span>
              <div className="mt-2" style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}>
                {firstField.label || "Your first question"}
                {firstField.required && <span style={{ color: accent, marginLeft: "4px" }}>*</span>}
              </div>

              {/* Field preview */}
              <div className="mt-4">
                <FieldPreviewV2 field={firstField} accent={accent} />
              </div>

              {/* OK button */}
              <div className="mt-5 flex items-center gap-2.5">
                <span className="px-3.5 py-2 rounded-full text-[12.5px] font-bold inline-flex items-center gap-1.5"
                      style={{ background: accent, color: "white", fontFamily: "var(--font-body)" }}>
                  OK <span className="text-[11px]">&#10003;</span>
                </span>
                <span className="mono-label text-[10.5px] opacity-50">&crarr; ENTER</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 flex justify-between"
             style={{ borderTop: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}>
          <span className="mono-label text-[10px]">Puffy &middot; Walrus</span>
          {settings.encryptSubmissions && (
            <span className="mono-label text-[10px]" style={{ color: accent }}>&#9679; seal encrypted</span>
          )}
        </div>
      </div>

      {/* Field count badges */}
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {fields.map((f, i) => (
            <div key={f.id}
              className="h-5 px-1.5 rounded text-[9px] flex items-center gap-1"
              style={{
                border: i === 0
                  ? "1px solid color-mix(in oklab, var(--ink) 20%, transparent)"
                  : "1px solid color-mix(in oklab, var(--ink) 10%, transparent)",
                color: i === 0 ? "var(--ink)" : "color-mix(in oklab, var(--ink) 55%, transparent)",
                background: i === 0 ? "color-mix(in oklab, var(--ink) 5%, transparent)" : "transparent",
                fontFamily: "var(--font-mono)",
              }}>
              <span className="opacity-50">{i + 1}</span>
              {FIELD_TYPE_CONFIG[f.type]?.label || f.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldPreviewV2({ field, accent }: { field: FormField; accent: string }) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1.5px solid color-mix(in oklab, var(--ink) 18%, transparent)",
    background: "rgba(255,255,255,0.5)",
    fontFamily: "var(--font-serif)",
    fontStyle: "italic",
    fontSize: "13px",
    color: "color-mix(in oklab, var(--ink) 50%, transparent)",
  };

  switch (field.type) {
    case "textarea":
    case "richtext":
      return <div style={{ ...inputStyle, minHeight: "60px" }}>{field.placeholder || "type your answer..."}</div>;
    case "star-rating":
      return (
        <div className="flex gap-2">
          {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
            <span key={i} style={{ fontSize: "24px", color: "color-mix(in oklab, var(--ink) 18%, transparent)" }}>&#9733;</span>
          ))}
        </div>
      );
    case "radio":
    case "checkbox":
      return (
        <div className="flex flex-col gap-1.5">
          {(field.options || []).slice(0, 3).map((opt, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2 rounded-[10px]"
                 style={{ border: "1.5px solid color-mix(in oklab, var(--ink) 16%, transparent)", background: "rgba(255,255,255,0.5)" }}>
              <span className="mono-label text-[10px]">{String.fromCharCode(65 + i)}</span>
              <span className="text-[13px]">{opt}</span>
            </div>
          ))}
        </div>
      );
    case "dropdown":
      return (
        <div style={{ ...inputStyle, display: "flex", justifyContent: "space-between" }}>
          {(field.options && field.options[0]) || "choose one..."} <span>&#8964;</span>
        </div>
      );
    case "file-upload":
      return (
        <div className="py-5 rounded-[10px] text-center"
             style={{
               border: "1.5px dashed color-mix(in oklab, var(--ink) 25%, transparent)",
               fontFamily: "var(--font-mono)",
               fontSize: "11px",
               letterSpacing: "0.12em",
               textTransform: "uppercase",
               color: "color-mix(in oklab, var(--ink) 55%, transparent)",
             }}>
          &uarr; drop a file &middot; uploads to Walrus
        </div>
      );
    case "confirm":
      return (
        <div className="flex items-center gap-2.5 p-2 rounded-[10px]"
             style={{ border: "1.5px solid color-mix(in oklab, var(--ink) 16%, transparent)", background: "rgba(255,255,255,0.5)" }}>
          <span style={{ fontSize: "14px", color: "color-mix(in oklab, var(--ink) 30%, transparent)" }}>&#9744;</span>
          <span className="text-[13px]">{field.label || "I confirm"}</span>
        </div>
      );
    default:
      return <div style={inputStyle}>{field.placeholder || "type here..."}</div>;
  }
}
