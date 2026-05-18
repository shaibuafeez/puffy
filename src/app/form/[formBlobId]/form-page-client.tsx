"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { readJSON } from "@/lib/walrus";
import { FormRenderer } from "@/components/form-renderer/form-renderer";
import type { FormDefinition } from "@/lib/types";
import { Loader2, AlertCircle, Database } from "lucide-react";

export default function FormPageClient() {
  const params = useParams();
  const formBlobId = params.formBlobId as string;
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formBlobId) return;

    readJSON<FormDefinition>(formBlobId)
      .then(setForm)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load form")
      )
      .finally(() => setLoading(false));
  }, [formBlobId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="relative mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-3" />
        <p className="text-[13px] text-muted-foreground">
          Loading form from Walrus...
        </p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          {error ||
            "This form could not be loaded from Walrus. The blob ID may be invalid or expired."}
        </p>
      </div>
    );
  }

  return <FormRenderer form={form} formBlobId={formBlobId} />;
}
