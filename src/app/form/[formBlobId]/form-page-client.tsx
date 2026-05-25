"use client";

import { useEffect, useState } from "react";
import { readJSON } from "@/lib/walrus";
import { FormRenderer } from "@/components/form-renderer/form-renderer";
import type { FormDefinition } from "@/lib/types";

export default function FormPageClient() {
  const [formBlobId, setFormBlobId] = useState<string | null>(null);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract blob ID from URL path instead of useParams(),
  // because the static export bakes "_" into the RSC payload.
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/form\/(.+?)\/?$/);
    if (match && match[1] && match[1] !== "_") {
      setFormBlobId(decodeURIComponent(match[1]));
    } else {
      setError("No form ID found in URL.");
      setLoading(false);
    }
  }, []);

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
      <div className="min-h-screen flex flex-col items-center justify-center"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="mono-label mb-3">Loading form from Walrus...</div>
        <div className="w-8 h-8 rounded-full border-2 border-[var(--coral)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="heading-display text-[clamp(32px,5vw,56px)]">
          Form <em className="serif-italic font-normal">not found.</em>
        </div>
        <p className="serif-italic text-[18px] mt-4 max-w-sm"
           style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          {error || "This form could not be loaded from Walrus. The blob ID may be invalid or expired."}
        </p>
      </div>
    );
  }

  return <FormRenderer form={form} formBlobId={formBlobId!} />;
}
