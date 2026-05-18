"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FIELD_TYPE_CONFIG } from "@/lib/constants";
import type { FormField } from "@/lib/types";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  GripVertical,
  Settings,
} from "lucide-react";

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
  const [showConfig, setShowConfig] = useState(false);

  const hasOptions = ["dropdown", "checkbox", "radio"].includes(field.type);
  const hasPlaceholder = [
    "text",
    "textarea",
    "richtext",
    "email",
    "url",
    "number",
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
      className={`group relative rounded-lg transition-all duration-150 animate-in fade-in slide-in-from-top-2 ${
        selected
          ? "bg-accent/50 border-l-2 border-l-foreground"
          : "hover:bg-accent/30 border-l-2 border-l-transparent"
      }`}
      onClick={onSelect}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-2 py-2.5">
        {/* Drag handle */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        </div>

        {/* Type badge */}
        <span className="shrink-0 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {config.label}
        </span>

        {/* Inline label input */}
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Type a question..."
          className="flex-1 bg-transparent text-[14px] font-medium outline-none placeholder:text-muted-foreground/40"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Required indicator */}
        {field.required && (
          <span className="text-[10px] text-destructive font-medium shrink-0">
            REQ
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfig(!showConfig);
            }}
          >
            {showConfig ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <Settings className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onMove("up");
            }}
            disabled={index === 0}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onMove("down");
            }}
            disabled={index === total - 1}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expandable config panel */}
      {showConfig && (
        <div
          className="px-10 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-px bg-border/30" />

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              value={field.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Optional helper text..."
              className="w-full bg-transparent text-[13px] outline-none border-b border-border/30 pb-1.5 placeholder:text-muted-foreground/40 focus:border-border transition-colors"
            />
          </div>

          {/* Placeholder */}
          {hasPlaceholder && (
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Placeholder text..."
                className="w-full bg-transparent text-[13px] outline-none border-b border-border/30 pb-1.5 placeholder:text-muted-foreground/40 focus:border-border transition-colors"
              />
            </div>
          )}

          {/* Options */}
          {hasOptions && (
            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Options
              </label>
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/50 w-4 text-right shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 bg-transparent text-[13px] outline-none border-b border-border/30 pb-1 focus:border-border transition-colors"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeOption(i)}
                    disabled={(field.options?.length || 0) <= 1}
                    className="shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add option
              </button>
            </div>
          )}

          {/* Star rating max */}
          {field.type === "star-rating" && (
            <div className="flex items-center gap-3">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Max Stars
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={field.maxRating || 5}
                onChange={(e) =>
                  onUpdate({ maxRating: parseInt(e.target.value) || 5 })
                }
                className="h-7 w-16 text-[12px]"
              />
            </div>
          )}

          {/* File upload types */}
          {field.type === "file-upload" && (
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Accepted Types
              </label>
              <div className="flex flex-wrap gap-3">
                {["image/*", "video/*"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-[12px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(field.acceptTypes || []).includes(type)}
                      onChange={(e) => {
                        const types = new Set(field.acceptTypes || []);
                        if (e.target.checked) types.add(type);
                        else types.delete(type);
                        onUpdate({ acceptTypes: Array.from(types) });
                      }}
                      className="rounded"
                    />
                    {type === "image/*" ? "Images" : "Videos"}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Required
            </label>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
