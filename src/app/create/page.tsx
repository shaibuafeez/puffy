"use client";

import { FormBuilder } from "@/components/form-builder/form-builder";
import { FormPreview } from "@/components/form-builder/form-preview";
import { AIFormGenerator } from "@/components/form-builder/ai-form-generator";
import { useFormBuilder } from "@/hooks/use-form-builder";

export default function CreatePage() {
  const formState = useFormBuilder();

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex gap-8">
        {/* Builder */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <AIFormGenerator onGenerated={formState.loadGenerated} />
          <FormBuilder formState={formState} />
        </div>

        {/* Live preview */}
        <div className="hidden lg:block w-[400px] shrink-0">
          <div className="sticky top-20">
            <FormPreview
              title={formState.title}
              description={formState.description}
              fields={formState.fields}
              settings={formState.settings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
