"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { FIELD_TYPE_CONFIG } from "@/lib/constants";
import type { FormField } from "@/lib/types";

const GLYPHS: Record<string, string> = {
  text: "Aa", textarea: "\u00B6", richtext: "\u00B6", email: "@", url: "\u2197",
  number: "#", dropdown: "\u2304", checkbox: "\u25A2", radio: "\u25EF",
  "star-rating": "\u2605", "file-upload": "\u2191", confirm: "\u2713",
};

interface FieldEditorProps {
  field: FormField;
  index: number;
  total: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  selected: boolean;
  onSelect: () => void;
}

export function FieldEditor({
  field,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
  selected,
  onSelect,
}: FieldEditorProps) {
  const config = FIELD_TYPE_CONFIG[field.type];
  const glyph = GLYPHS[field.type] || "?";

  const hasOptions = ["dropdown", "checkbox", "radio"].includes(field.type);
  const hasPlaceholder = [
    "text", "textarea", "richtext", "email", "url", "number",
  ].includes(field.type);

  const addOption = () => {
    const options = [
      ...(field.options || []),
      `Option ${(field.options?.length || 0) + 1}`,
    ];
    onUpdate({ options });
  };

  const updateOption = (i: number, value: string) => {
    const options = [...(field.options || [])];
    options[i] = value;
    onUpdate({ options });
  };

  const removeOption = (i: number) => {
    const options = (field.options || []).filter((_, idx) => idx !== i);
    onUpdate({ options });
  };

  return (
    <div
      draggable
      onClick={onSelect}
      className="relative cursor-pointer transition-all duration-150"
      style={{
        padding: "20px 20px 20px 80px",
        background: selected ? "var(--cream-deep)" : "transparent",
        border: selected
          ? "1px solid color-mix(in oklab, var(--ink) 18%, transparent)"
          : "1px solid transparent",
        borderBottom: selected
          ? "1px solid color-mix(in oklab, var(--ink) 18%, transparent)"
          : "1px solid color-mix(in oklab, var(--ink) 8%, transparent)",
        borderRadius: selected ? "14px" : 0,
        marginTop: selected ? "8px" : 0,
      }}
    >
      {/* Left gutter: number + glyph */}
      <div className="absolute left-4 top-5 flex flex-col items-center gap-1.5">
        <span className="mono-label text-[13px]" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="w-[30px] h-[30px] rounded-lg inline-flex items-center justify-center text-[14px] font-bold"
              style={{
                fontFamily: "var(--font-mono)",
                background: selected ? "var(--coral)" : "rgba(0,0,0,0.06)",
                color: selected ? "var(--ink)" : "color-mix(in oklab, var(--ink) 65%, transparent)",
              }}>
          {glyph}
        </span>
      </div>

      {/* Type label + required */}
      <div className="flex justify-between items-center mb-1">
        <span className="mono-label text-[10.5px]">
          {config?.label || field.type} &middot; {config?.description || ""}
        </span>
        {field.required && (
          <span className="mono-label text-[10.5px]" style={{ color: "var(--coral)" }}>required</span>
        )}
      </div>

      {/* Question label input */}
      <input
        value={field.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Type a question..."
        className="w-full bg-transparent outline-none p-0"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(18px, 2vw, 26px)",
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
          color: "var(--ink)",
          border: "none",
        }}
      />

      {/* Placeholder input */}
      {hasPlaceholder && (
        <input
          value={field.placeholder || ""}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Placeholder for the respondent..."
          className="w-full bg-transparent outline-none p-0 mt-2"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "15px",
            color: "color-mix(in oklab, var(--ink) 55%, transparent)",
            border: "none",
          }}
        />
      )}

      {/* Options list (for choice/dropdown types) */}
      {hasOptions && selected && (
        <div className="mt-3.5 pl-0">
          {(field.options || []).map((opt, j) => (
            <div key={j} className="flex items-center gap-2.5 py-1.5"
                 style={{
                   borderTop: j === 0 ? "1px dashed color-mix(in oklab, var(--ink) 18%, transparent)" : "none",
                   borderBottom: "1px dashed color-mix(in oklab, var(--ink) 18%, transparent)",
                 }}>
              <span className="mono-label text-[10.5px]">{String.fromCharCode(65 + j)}</span>
              <input value={opt}
                onChange={(e) => updateOption(j, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent outline-none text-[15px] p-0"
                style={{ color: "var(--ink)", border: "none" }} />
              <button onClick={(e) => { e.stopPropagation(); removeOption(j); }}
                className="mono-label text-[12px]" style={{ color: "color-mix(in oklab, var(--ink) 50%, transparent)" }}>
                &times;
              </button>
            </div>
          ))}
          <button onClick={(e) => { e.stopPropagation(); addOption(); }}
            className="mt-2 mono-label text-[11px]" style={{ color: "var(--coral)" }}>
            + add option
          </button>
        </div>
      )}

      {/* Star rating config */}
      {field.type === "star-rating" && selected && (
        <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="mono-label text-[11px]">Max stars</span>
          <input type="number" min={1} max={10}
            value={field.maxRating || 5}
            onChange={(e) => onUpdate({ maxRating: parseInt(e.target.value) || 5 })}
            className="w-16 h-7 text-[12px] rounded-lg px-2 bg-transparent outline-none"
            style={{
              border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
              fontFamily: "var(--font-mono)",
            }} />
        </div>
      )}

      {/* Action bar when selected */}
      {selected && (
        <div className="flex items-center gap-4 mt-4 pt-3.5"
             style={{ borderTop: "1px dashed color-mix(in oklab, var(--ink) 18%, transparent)" }}>
          <button onClick={(e) => { e.stopPropagation(); onUpdate({ required: !field.required }); }}
            className="inline-flex items-center gap-2"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: field.required ? "var(--coral)" : "color-mix(in oklab, var(--ink) 55%, transparent)",
            }}>
            <span className="w-[14px] h-[14px] rounded inline-flex items-center justify-center text-[10px] font-extrabold"
                  style={{
                    border: `1.5px solid ${field.required ? "var(--coral)" : "color-mix(in oklab, var(--ink) 35%, transparent)"}`,
                    background: field.required ? "var(--coral)" : "transparent",
                    color: "var(--ink)",
                  }}>
              {field.required && "\u2713"}
            </span>
            Required
          </button>
          <div className="flex-1" />
          <button onClick={(e) => { e.stopPropagation(); onMove("up"); }}
            disabled={index === 0}
            className="mono-label text-[11px] disabled:opacity-30" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
            &uarr; up
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove("down"); }}
            disabled={index === total - 1}
            className="mono-label text-[11px] disabled:opacity-30" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
            &darr; down
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="mono-label text-[11px]" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
            &times;&nbsp;&nbsp;delete
          </button>
        </div>
      )}
    </div>
  );
}
