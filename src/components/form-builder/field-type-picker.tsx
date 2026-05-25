"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FIELD_TYPE_CONFIG } from "@/lib/constants";
import type { FieldType } from "@/lib/types";

const GLYPHS: Record<string, string> = {
  text: "Aa", textarea: "\u00B6", richtext: "\u00B6", email: "@", url: "\u2197",
  number: "#", dropdown: "\u2304", checkbox: "\u25A2", radio: "\u25EF",
  "star-rating": "\u2605", "file-upload": "\u2191", confirm: "\u2713",
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

  useEffect(() => {
    if (position) {
      setFilter("");
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [position]);

  useEffect(() => {
    setHighlighted(0);
  }, [filter]);

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

  // If position is (0,0) it means inline below the button
  const isInline = position.top === 0 && position.left === 0;

  return (
    <div
      ref={menuRef}
      className="z-50 rounded-[14px] p-3.5 animate-in fade-in slide-in-from-top-2 duration-150"
      style={{
        position: isInline ? "absolute" : "absolute",
        top: isInline ? "calc(100% + 6px)" : position.top,
        left: isInline ? 0 : position.left,
        right: isInline ? 0 : undefined,
        width: isInline ? undefined : "auto",
        minWidth: isInline ? undefined : "340px",
        background: "var(--cream)",
        border: "1px solid color-mix(in oklab, var(--ink) 16%, transparent)",
        boxShadow: "0 30px 60px -20px rgba(11,15,23,0.25)",
      }}>
      {/* Header with filter */}
      <div className="flex items-center gap-2.5 pb-2.5 mb-2.5"
           style={{ borderBottom: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}>
        <span className="mono-label text-[11px]">&mdash;&mdash; pick a field type</span>
        <input
          ref={inputRef}
          autoFocus
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="filter..."
          className="flex-1 bg-transparent outline-none text-[12px] p-0"
          style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", border: "none" }}
        />
      </div>

      {/* Grid of field types */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {filtered.length === 0 && (
          <p className="text-[12px] text-center py-4 col-span-3" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
            No matching fields
          </p>
        )}
        {filtered.map(([type, config], i) => (
          <button
            key={type}
            onClick={() => {
              onSelect(type);
              onClose();
            }}
            onMouseEnter={() => setHighlighted(i)}
            className="flex items-center gap-2.5 p-2.5 rounded-[10px] text-left transition-colors"
            style={{
              background: i === highlighted ? "var(--cream-deep)" : "transparent",
            }}>
            <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0 text-[14px] font-bold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "rgba(0,0,0,0.06)",
                  }}>
              {GLYPHS[type] || "?"}
            </span>
            <span className="flex flex-col items-start min-w-0">
              <span className="text-[13px] font-semibold">{config.label}</span>
              <span className="mono-label text-[10px]">{config.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
