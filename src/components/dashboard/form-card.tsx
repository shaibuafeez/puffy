"use client";

import Link from "next/link";
import { generateFormLink, formatDate } from "@/lib/utils";
import type { UserFormEntry } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

const ACCENTS = ["var(--coral)", "var(--ocean)", "var(--sand)", "var(--ink)"];

interface FormCardProps {
  form: UserFormEntry;
  index: number;
}

export function FormCard({ form, index }: FormCardProps) {
  const link = generateFormLink(form.formBlobId);
  const [copied, setCopied] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Form link copied!");
    setTimeout(() => setCopied(false), 1400);
  };

  const dateStr = formatDate(form.createdAt);

  return (
    <Link href={`/dashboard/${form.formBlobId}`}
      className="block relative rounded-[18px] overflow-hidden p-5 md:p-[22px] transition-all duration-200 group"
      style={{
        background: "var(--cream)",
        border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -20px rgba(11,15,23,0.25)";
        e.currentTarget.style.borderColor = "color-mix(in oklab, var(--ink) 24%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "color-mix(in oklab, var(--ink) 14%, transparent)";
      }}>
      {/* Corner tags */}
      <div className="absolute top-4 right-5 flex gap-1.5">
        {form.sealAllowlistId && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: "var(--ink)", color: "var(--cream)" }}>
            &#9679; Seal
          </span>
        )}
      </div>

      {/* Index + date */}
      <div className="mono-label text-[10px]">
        {String(index + 1).padStart(2, "0")} &middot; {dateStr}
      </div>

      {/* Title */}
      <h3 className="mt-3 leading-[1.1] pr-20"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(20px, 2.2vw, 28px)",
            letterSpacing: "-0.025em",
            color: "var(--ink)",
          }}>
        {form.title || "Untitled Form"}
      </h3>

      {/* Blob ID */}
      <div className="mt-4 px-3 py-2.5 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap"
           style={{
             background: "var(--cream-deep)",
             fontFamily: "var(--font-mono)",
             fontSize: "11px",
             color: "color-mix(in oklab, var(--ink) 70%, transparent)",
           }}>
        <span style={{ color: accent }}>walrus://</span>
        {form.formBlobId.slice(0, 16)}<span style={{ opacity: 0.4 }}>&hellip;</span>{form.formBlobId.slice(-6)}
      </div>

      {/* Response count + actions */}
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "32px",
            letterSpacing: "-0.03em",
            color: accent,
          }}>
            {form.submissionCount || 0}
          </span>
          <span className="mono-label text-[10px]">responses</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={copyLink}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
            style={{
              background: "transparent",
              border: "1px solid color-mix(in oklab, var(--ink) 20%, transparent)",
              fontFamily: "var(--font-body)",
            }}>
            {copied ? "&#10003; copied" : "copy link"}
          </button>
          <span className="px-3 py-1.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1.5"
            style={{
              background: "var(--ink)",
              color: "var(--cream)",
              fontFamily: "var(--font-body)",
            }}>
            open &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
