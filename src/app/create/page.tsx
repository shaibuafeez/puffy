"use client";

import { FormBuilder } from "@/components/form-builder/form-builder";
import { FormPreview } from "@/components/form-builder/form-preview";
import { AIFormGenerator } from "@/components/form-builder/ai-form-generator";
import { useFormBuilder } from "@/hooks/use-form-builder";

export default function CreatePage() {
  const formState = useFormBuilder();

  return (
    <div style={{ background: "var(--cream)", color: "var(--ink)", minHeight: "calc(100vh - 70px)" }}>
      {/* Masthead */}
      <div className="border-b" style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex items-center justify-between h-8 overflow-hidden">
          <span className="mono-label text-[10px]">Vol. I &middot; Issue 04 &middot; Draft</span>
          <span className="mono-label text-[10px]">
            <em className="serif-italic normal-case tracking-normal">untitled.</em> &middot; {formState.fields.length} fields &middot; 0 submissions
          </span>
          <span className="mono-label text-[10px] hidden md:block">Draft &middot; publish to pin on Walrus</span>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pb-20 grid gap-8 md:gap-12 items-start"
           style={{ gridTemplateColumns: "minmax(0, 1fr) min(380px, 30vw)" }}>
        {/* Editor column */}
        <div className="min-w-0">
          {/* AI generator */}
          <div className="mt-6">
            <AIFormGenerator onGenerated={formState.loadGenerated} />
          </div>

          {/* Form builder */}
          <FormBuilder formState={formState} />
        </div>

        {/* Preview sidebar (desktop only) */}
        <div className="hidden lg:block sticky top-[92px]">
          <FormPreview
            title={formState.title}
            description={formState.description}
            fields={formState.fields}
            settings={formState.settings}
          />
        </div>
      </div>
    </div>
  );
}
