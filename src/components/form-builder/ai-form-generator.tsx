"use client";

import { useState, useRef } from "react";
import { enclaveAction } from "@/lib/enclave";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-border/50 bg-accent/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[13px] font-medium">AI Form Generator</span>
        </div>

        <div className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the form you want to create..."
            disabled={generating}
            rows={2}
            className="w-full bg-background rounded-lg border border-border/60 px-3 py-2.5 pr-10 text-[14px] outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="absolute right-2 bottom-2.5 h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {error && (
          <p className="text-[12px] text-destructive mt-2">{error}</p>
        )}

        {!prompt && !generating && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setPrompt(example);
                  inputRef.current?.focus();
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-background border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors truncate max-w-[280px]"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {generating && (
          <p className="text-[12px] text-muted-foreground mt-2 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating your form with AI...
          </p>
        )}
      </div>
    </div>
  );
}
