"use client";

import { useState, useRef } from "react";
import { enclaveAction } from "@/lib/enclave";
import type { FormField, FormSettings } from "@/lib/types";

interface GeneratedForm {
  title: string;
  description: string;
  fields: FormField[];
  settings: FormSettings;
}

interface AIFormGeneratorProps {
  onGenerated: (data: GeneratedForm) => void;
}

const EXAMPLES = [
  "Hackathon registration with team name, project idea, and experience level",
  "NFT whitelist signup with Twitter handle and why they deserve a spot",
  "Community feedback survey about our DeFi protocol",
  "Event RSVP form with dietary preferences and plus-one",
];

export function AIFormGenerator({ onGenerated }: AIFormGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) return;

    setGenerating(true);
    setError(null);

    try {
      const result = await enclaveAction<GeneratedForm>("generate_form", {
        prompt: text,
      });
      onGenerated(result);
      setPrompt("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate form"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 p-1.5 pl-4 md:pl-5 rounded-[16px]"
           style={{
             background: "var(--ink)",
             border: "1px solid color-mix(in oklab, var(--ink) 90%, transparent)",
           }}>
        <span className="shrink-0 flex items-center gap-2">
          <span style={{ color: "var(--coral)", fontSize: 16 }}>&#10038;</span>
          <span className="text-[12px] font-semibold tracking-wide uppercase hidden md:block"
                style={{ fontFamily: "var(--font-mono)", color: "var(--cream)", letterSpacing: "0.1em" }}>
            Generate with AI
          </span>
        </span>
        <input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your form — e.g. 'NPS for SDK users' or 'bug report with severity'"
          disabled={generating}
          className="flex-1 bg-transparent outline-none py-3 text-[14px] min-w-0 placeholder:text-[color-mix(in_oklab,var(--cream)_40%,transparent)]"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--cream)",
            border: "none",
          }}
        />
        <button onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="shrink-0 px-5 py-2.5 rounded-[12px] text-[13px] font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-30"
          style={{
            background: "var(--coral)",
            color: "var(--ink)",
            fontFamily: "var(--font-body)",
          }}>
          {generating ? "Generating" : "Generate"}
          <span>{generating ? "\u2026" : "\u2192"}</span>
        </button>
      </div>

      {!prompt && !generating && (
        <div className="flex gap-2 mt-2.5 flex-wrap">
          {EXAMPLES.slice(0, 3).map((ex, i) => (
            <button key={i} onClick={() => { setPrompt(ex); inputRef.current?.focus(); }}
              className="px-3 py-1.5 rounded-full text-[11.5px] transition-colors cursor-pointer"
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--cream-deep)",
                color: "color-mix(in oklab, var(--ink) 60%, transparent)",
                border: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)",
              }}>
              {ex.length > 50 ? ex.slice(0, 50) + "…" : ex}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--coral)" }}>{error}</p>
      )}
    </div>
  );
}
