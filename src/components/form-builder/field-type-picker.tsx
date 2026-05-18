"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FIELD_TYPE_CONFIG } from "@/lib/constants";
import type { FieldType } from "@/lib/types";
import {
  Type,
  AlignLeft,
  FileText,
  Mail,
  Link,
  Hash,
  ChevronDown,
  CheckSquare,
  Circle,
  Star,
  Upload,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  AlignLeft,
  FileText,
  Mail,
  Link,
  Hash,
  ChevronDown,
  CheckSquare,
  Circle,
  Star,
  Upload,
};

interface SlashCommandMenuProps {
  position: { top: number; left: number } | null;
  onSelect: (type: FieldType) => void;
  onClose: () => void;
}

const fieldEntries = Object.entries(FIELD_TYPE_CONFIG) as [
  FieldType,
  (typeof FIELD_TYPE_CONFIG)[FieldType],
][];

export function SlashCommandMenu({
  position,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const [filter, setFilter] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = fieldEntries.filter(
    ([, config]) =>
      !filter ||
      config.label.toLowerCase().includes(filter.toLowerCase()) ||
      config.description.toLowerCase().includes(filter.toLowerCase())
  );

  // Reset filter and highlight when menu opens
  useEffect(() => {
    if (position) {
      setFilter("");
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [position]);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlighted(0);
  }, [filter]);

  // Click outside to close
  useEffect(() => {
    if (!position) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [position, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[highlighted]) {
          onSelect(filtered[highlighted][0]);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, highlighted, onSelect, onClose]
  );

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 rounded-xl border border-border/60 bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 border-b border-border/30">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter fields..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50 px-2 py-1.5"
        />
      </div>
      <div className="p-1.5 max-h-[320px] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-[12px] text-muted-foreground text-center py-4">
            No matching fields
          </p>
        )}
        {filtered.map(([type, config], i) => {
          const Icon = iconMap[config.icon] || Type;
          return (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                i === highlighted ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{config.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {config.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
