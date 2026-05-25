"use client";

import { useState, useCallback, useEffect } from "react";
import { useCurrentAccount, useSuiClient, ConnectModal } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { FieldRenderer } from "./field-renderer";
import { TweetEmbed } from "@/components/shared/tweet-embed";
import { getBlobUrl } from "@/lib/walrus";
import { sealEncrypt } from "@/lib/seal";
import { enclaveAction } from "@/lib/enclave";
import type { FormDefinition, FormSubmission, FontFamily } from "@/lib/types";

const FONT_MAP: Record<FontFamily, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
};

const GOOGLE_FONT_URL: Record<FontFamily, string> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  roboto: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  "space-grotesk":
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  "dm-sans":
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  "plus-jakarta":
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
};

function VerifyOnChain({ formBlobId, sealAllowlistId, accent }: { formBlobId: string; sealAllowlistId?: string; accent: string }) {
  const [open, setOpen] = useState(false);
  const walrusUrl = `https://aggregator.walrus-mainnet.walrus.space/v1/blobs/${formBlobId}`;
  const suiUrl = sealAllowlistId
    ? `https://suiscan.xyz/mainnet/object/${sealAllowlistId}`
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="mono-label text-[10px] inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        style={{ color: accent }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13.5 5.5l-5 5-3-3" /><circle cx="8" cy="8" r="7" />
        </svg>
        Verify on-chain
      </button>
      {open && (
        <div
          className="absolute top-7 left-0 z-50 rounded-lg p-4 shadow-lg min-w-[280px]"
          style={{
            background: "inherit",
            border: "1px solid color-mix(in oklab, currentColor 14%, transparent)",
          }}
        >
          <div className="mono-label text-[10px] mb-3" style={{ color: accent }}>&mdash;&mdash; On-chain proof</div>
          <div className="space-y-2.5">
            <a
              href={walrusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] font-medium hover:opacity-70 transition-opacity"
            >
              <span style={{ color: accent }}>&#8599;</span>
              Form data on Walrus
            </a>
            <div className="mono-label text-[9px] break-all" style={{ color: "color-mix(in oklab, currentColor 45%, transparent)" }}>
              blob: {formBlobId}
            </div>
            {suiUrl && (
              <>
                <a
                  href={suiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] font-medium hover:opacity-70 transition-opacity"
                >
                  <span style={{ color: accent }}>&#8599;</span>
                  Seal Allowlist on Sui
                </a>
                <div className="mono-label text-[9px] break-all" style={{ color: "color-mix(in oklab, currentColor 45%, transparent)" }}>
                  object: {sealAllowlistId}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FormRendererProps {
  form: FormDefinition;
  formBlobId: string;
}

export function FormRenderer({ form, formBlobId }: FormRendererProps) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [showReview, setShowReview] = useState(false);

  const totalSteps = form.fields.length;
  const currentField = form.fields[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = submitted ? 100 : totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const theme = form.settings.theme;
  const accent = theme?.primaryColor || "var(--coral)";
  const encrypted = form.settings.encryptSubmissions;

  const themedStyle: React.CSSProperties = {
    ...(theme?.backgroundColor && { backgroundColor: theme.backgroundColor }),
    ...(theme?.textColor && { color: theme.textColor }),
    ...(theme?.fontFamily && { fontFamily: FONT_MAP[theme.fontFamily] }),
  };

  const FontLink =
    theme?.fontFamily && theme.fontFamily !== "inter" ? (
      // eslint-disable-next-line @next/next/no-page-custom-font
      <link rel="stylesheet" href={GOOGLE_FONT_URL[theme.fontFamily]} />
    ) : null;

  const Logo = theme?.logoBlobId ? (
    <img src={getBlobUrl(theme.logoBlobId)} alt="" className="h-6 w-auto object-contain" />
  ) : null;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const URL_RE = /^https?:\/\/.+\..+/;

  const validateField = useCallback(
    (field: (typeof form.fields)[number], val: unknown): string | null => {
      const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0) || val === 0;
      if (field.required && isEmpty) return "This field is required";
      if (!isEmpty && typeof val === "string" && val.trim() !== "") {
        if (field.type === "email" && !EMAIL_RE.test(val)) return "Please enter a valid email address";
        if (field.type === "url" && !URL_RE.test(val)) return "Please enter a valid URL";
        if (field.type === "number" && isNaN(Number(val))) return "Please enter a valid number";
      }
      return null;
    },
    []
  );

  const validateCurrentField = useCallback((): boolean => {
    if (!currentField) return true;
    const val = responses[currentField.id];
    const error = validateField(currentField, val);
    if (error) { setErrors({ [currentField.id]: error }); return false; }
    setErrors({});
    return true;
  }, [currentField, responses, validateField]);

  const goNext = useCallback(() => {
    if (!validateCurrentField()) return;
    if (isLastStep) {
      setShowReview(true);
      setDirection("forward");
      setAnimKey((k) => k + 1);
    } else {
      setDirection("forward");
      setCurrentStep((s) => s + 1);
      setAnimKey((k) => k + 1);
      setErrors({});
    }
  }, [validateCurrentField, isLastStep]);

  const goBack = useCallback(() => {
    if (showReview) { setShowReview(false); setDirection("backward"); setAnimKey((k) => k + 1); return; }
    if (currentStep > 0) { setDirection("backward"); setCurrentStep((s) => s - 1); setAnimKey((k) => k + 1); setErrors({}); }
  }, [currentStep, showReview]);

  const goToStep = useCallback((step: number) => {
    setShowReview(false); setDirection("backward"); setCurrentStep(step); setAnimKey((k) => k + 1); setErrors({});
  }, []);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const error = validateField(field, responses[field.id]);
      if (error) newErrors[field.id] = error;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = form.fields.findIndex((f) => newErrors[f.id]);
      if (firstErrorField >= 0) { setShowReview(false); setCurrentStep(firstErrorField); setAnimKey((k) => k + 1); }
      return;
    }

    setSubmitting(true);
    try {
      const submission: FormSubmission = {
        formId: form.id, formBlobId,
        submittedAt: new Date().toISOString(),
        submitter: account?.address || "anonymous",
        responses,
      };

      let data: string;
      let enc = false;

      if (form.settings.encryptSubmissions && form.settings.sealAllowlistId) {
        toast.info("Encrypting with Seal...");
        const plaintext = new TextEncoder().encode(JSON.stringify(submission));
        const encryptedBytes = await sealEncrypt(suiClient, plaintext, form.settings.sealAllowlistId);
        // Base64-encode encrypted bytes for JSON transport
        let binary = "";
        for (let i = 0; i < encryptedBytes.length; i++) binary += String.fromCharCode(encryptedBytes[i]);
        data = btoa(binary);
        enc = true;
      } else {
        data = JSON.stringify(submission);
      }

      // Upload to Walrus + register in DB via enclave (single round-trip)
      await enclaveAction("submit_response", {
        formId: form.id,
        submittedAt: submission.submittedAt,
        encrypted: enc,
        submitterAddress: account?.address,
        data,
      });

      setSubmitted(true);
      toast.success("Submitted successfully!");
    } catch (error) {
      toast.error(`Submission failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted || submitting) return;
      if (e.key === "Enter" && !e.shiftKey) {
        if (currentField && (currentField.type === "textarea" || currentField.type === "richtext")) return;
        e.preventDefault();
        if (showReview) handleSubmit();
        else goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentField, goNext, showReview, submitted, submitting]);

  const rewardEnabled = form.settings.rewardEnabled;
  const rewardAmount = form.settings.rewardAmountSui ?? 0;

  // Wallet gate for reward-enabled forms
  if (rewardEnabled && !account) {
    return (
      <>
        {FontLink}
        <div className="fixed inset-0 z-[60] flex items-center justify-center"
             style={{ background: "var(--cream)", color: "var(--ink)", ...themedStyle }}>
          <div className="flex flex-col items-center text-center px-6 step-enter-right">
            {Logo && <div className="mb-6">{Logo}</div>}
            <div className="heading-display text-[clamp(28px,4vw,48px)] mb-3">
              Earn {rewardAmount} <em className="serif-italic font-normal">SUI</em>
            </div>
            <p className="serif-italic text-[17px] mb-6" style={{ color: "color-mix(in oklab, currentColor 60%, transparent)" }}>
              Connect your wallet to submit this form and receive your reward.
            </p>
            <ConnectModal
              trigger={
                <button className="btn-editorial">Connect Wallet</button>
              }
            />
          </div>
        </div>
      </>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <>
        {FontLink}
        <div className="fixed inset-0 z-[60] flex items-center justify-center"
             style={{ background: "var(--cream)", color: "var(--ink)", ...themedStyle }}>
          <div className="flex flex-col items-center text-center px-6 step-enter-right">
            {/* Big check circle */}
            <div className="relative mb-8">
              <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full flex items-center justify-center"
                   style={{
                     background: `color-mix(in oklab, ${accent} 22%, transparent)`,
                     animation: "check-pop 0.6s cubic-bezier(.2,1.5,.4,1) both",
                   }}>
                <span className="heading-display text-[64px] md:text-[80px]" style={{ color: accent, lineHeight: 1 }}>&#10003;</span>
              </div>
            </div>

            <h2 className="heading-display text-[clamp(48px,8vw,120px)] leading-[0.95]">
              Thanks,<br /><em className="serif-italic font-normal" style={{ color: accent }}>that landed.</em>
            </h2>
            <p className="serif-italic text-[20px] mt-4" style={{ color: "color-mix(in oklab, currentColor 65%, transparent)" }}>
              {form.settings.submitMessage || "Your response is on its way to Walrus."}
            </p>

            {/* Tags */}
            <div className="mt-8 flex justify-center gap-2.5 flex-wrap">
              {encrypted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                      style={{ background: "var(--ink)", color: "var(--cream)" }}>
                  &#9679; sealed with Seal
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                    style={{ background: "var(--sand)", color: "var(--ink)" }}>
                &#9679; pinned to Walrus
              </span>
              {rewardEnabled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold"
                      style={{ background: "var(--coral)", color: "var(--ink)" }}>
                  +{rewardAmount} SUI rewarded
                </span>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              <VerifyOnChain formBlobId={formBlobId} sealAllowlistId={form.settings.sealAllowlistId} accent={accent} />
            </div>

            <div className="mt-6 mono-label text-[10.5px]" style={{ color: "color-mix(in oklab, currentColor 50%, transparent)" }}>
              &mdash;&mdash; made with Puffy &middot; Stored on Walrus &middot; Encrypted with Seal &middot; Secured by Sui
            </div>
          </div>
        </div>
      </>
    );
  }

  // Review screen
  if (showReview) {
    return (
      <>
        {FontLink}
        <div className="fixed inset-0 z-[60] flex flex-col"
             style={{ background: "var(--cream)", color: "var(--ink)", ...themedStyle }}>
          {/* Progress bar */}
          <div className="sticky top-0 h-[2px] z-10" style={{ background: "color-mix(in oklab, currentColor 8%, transparent)" }}>
            <div className="h-full transition-all duration-500" style={{ width: "100%", background: accent }} />
          </div>

          {/* Masthead */}
          <div className="border-b px-4 md:px-8"
               style={{ borderColor: "color-mix(in oklab, currentColor 14%, transparent)" }}>
            <div className="max-w-[1500px] mx-auto flex items-center justify-between h-8 overflow-hidden">
              <button onClick={goBack} className="mono-label text-[10px]">&larr; Back</button>
              <span className="mono-label text-[10px]"><em className="serif-italic normal-case tracking-normal">{form.title}</em></span>
              <span className="mono-label text-[10px]">Review</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div key={animKey} className={`max-w-[1500px] mx-auto px-4 md:px-8 py-12 md:py-16 ${direction === "forward" ? "step-enter-right" : "step-enter-left"}`}
                 style={{ borderTop: "1px solid color-mix(in oklab, currentColor 14%, transparent)" }}>
              <div className="mono-label text-[11px] mb-4" style={{ color: accent }}>&mdash;&mdash; Review your answers</div>
              <h2 className="heading-display text-[clamp(32px,5vw,64px)] leading-[1]">
                Once you submit, these <em className="serif-italic font-normal">sail to Walrus</em>.
              </h2>
              {encrypted && (
                <p className="serif-italic text-[18px] mt-3.5 max-w-[600px]" style={{ color: "color-mix(in oklab, currentColor 60%, transparent)" }}>
                  Wrapped in Seal threshold encryption. No middleman, no copy on a server somewhere.
                </p>
              )}

              {/* Answer grid */}
              <div className="mt-9" style={{ borderTop: "1px solid color-mix(in oklab, currentColor 14%, transparent)" }}>
                {form.fields.map((field, i) => {
                  const v = responses[field.id];
                  let display: React.ReactNode;
                  if (field.type === "star-rating" && typeof v === "number") {
                    display = `${"★".repeat(v)}${"☆".repeat((field.maxRating || 5) - v)}`;
                  } else if (v === undefined || v === null || v === "") {
                    display = <em className="serif-italic" style={{ color: "color-mix(in oklab, currentColor 45%, transparent)" }}>no answer</em>;
                  } else if (Array.isArray(v)) {
                    display = v.join(", ");
                  } else {
                    display = String(v);
                  }

                  return (
                    <div key={field.id} className="grid gap-4 md:gap-6 py-5 items-baseline"
                         style={{
                           gridTemplateColumns: "60px 1fr 1.4fr 80px",
                           borderBottom: "1px solid color-mix(in oklab, currentColor 14%, transparent)",
                         }}>
                      <span className="mono-label text-[13px]">{String(i + 1).padStart(2, "0")}</span>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "color-mix(in oklab, currentColor 75%, transparent)" }}>
                        {field.label}
                        {errors[field.id] && <p className="text-[12px] mt-1" style={{ color: "var(--coral)" }}>{errors[field.id]}</p>}
                      </div>
                      <div className="serif-italic text-[clamp(16px,1.8vw,22px)] leading-[1.4]">
                        {display}
                      </div>
                      <button onClick={() => goToStep(i)} className="mono-label text-[11px] text-right font-semibold" style={{ color: accent }}>
                        edit &#8599;
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Submit */}
              <div className="mt-9 flex items-center gap-4 flex-wrap">
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-6 py-3.5 rounded-full text-[15px] font-bold inline-flex items-center gap-2 disabled:opacity-50"
                  style={{ background: accent, color: "var(--ink)", fontFamily: "var(--font-body)" }}>
                  {submitting ? (encrypted ? "Encrypting..." : "Submitting...") : "Submit to Walrus"}
                  <span>&#8599;</span>
                </button>
                <span className="mono-label text-[11px]">{encrypted ? "Encrypted with Seal · before upload" : "Stored on Walrus"}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Step view (main question view)
  return (
    <>
      {FontLink}
      <div className="fixed inset-0 z-[60] flex flex-col"
           style={{ background: "var(--cream)", color: "var(--ink)", ...themedStyle }}>
        {/* Progress bar */}
        <div className="sticky top-0 h-[2px] z-10" style={{ background: "color-mix(in oklab, currentColor 8%, transparent)" }}>
          <div className="h-full transition-all duration-[550ms]"
               style={{ width: `${progress}%`, background: accent, transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)" }} />
        </div>

        {/* Masthead */}
        <div className="border-b px-4 md:px-8"
             style={{ borderColor: "color-mix(in oklab, currentColor 14%, transparent)" }}>
          <div className="max-w-[1500px] mx-auto flex items-center justify-between h-8 overflow-hidden">
            {currentStep > 0 ? (
              <button onClick={goBack} className="mono-label text-[10px]">&larr; Back</button>
            ) : <span />}
            <span className="mono-label text-[10px]"><em className="serif-italic normal-case tracking-normal">{form.title}</em></span>
            <span className="inline-flex items-center gap-3">
              <VerifyOnChain formBlobId={formBlobId} sealAllowlistId={form.settings.sealAllowlistId} accent={accent} />
              <span className="mono-label text-[10px] inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: encrypted ? "var(--ocean)" : "var(--sand)" }} />
                {encrypted ? "Seal encrypted" : "Public"}
              </span>
            </span>
          </div>
        </div>

        {/* Center question */}
        <div className="flex-1 overflow-y-auto">
          <div key={animKey} className={`max-w-[1500px] mx-auto px-4 md:px-8 py-12 md:py-16 ${direction === "forward" ? "step-enter-right" : "step-enter-left"}`}
               style={{ borderTop: "1px solid color-mix(in oklab, currentColor 14%, transparent)" }}>
            {currentStep === 0 && form.tweetUrl && (
              <div className="mb-6">
                <TweetEmbed tweetUrl={form.tweetUrl} tweetAuthor={form.tweetAuthor} description={form.description} />
              </div>
            )}
            {currentField && (
              <div className="grid gap-8 md:gap-16 items-start" style={{ gridTemplateColumns: "min(160px, 20vw) 1fr" }}>
                {/* Big step number */}
                <div>
                  <div className="heading-display leading-none"
                       style={{ fontSize: "clamp(48px, 8vw, 88px)", color: "color-mix(in oklab, currentColor 18%, transparent)" }}>
                    {String(currentStep + 1).padStart(2, "0")}
                  </div>
                  <span className="mono-label text-[13px] mt-2 block">of {String(totalSteps).padStart(2, "0")}</span>
                </div>

                {/* Question content */}
                <div>
                  <div className="mono-label text-[11px] mb-4" style={{ color: accent }}>
                    &mdash;&mdash; Question {String(currentStep + 1).padStart(2, "0")}
                  </div>
                  <h2 className="heading-display leading-[1] text-balance"
                      style={{ fontSize: "clamp(28px, 4.5vw, 64px)" }}>
                    {currentField.label || "Untitled Field"}
                    {currentField.required && <span style={{ color: accent, marginLeft: "4px" }}>*</span>}
                  </h2>
                  {currentField.description && (
                    <p className="serif-italic text-[18px] mt-4" style={{ color: "color-mix(in oklab, currentColor 60%, transparent)" }}>
                      {currentField.description}
                    </p>
                  )}

                  {/* Field input */}
                  <div className="mt-8">
                    <FieldRenderer
                      field={currentField}
                      value={responses[currentField.id]}
                      onChange={(val) => setResponses((prev) => ({ ...prev, [currentField.id]: val }))}
                      error={errors[currentField.id]}
                      hideLabel
                    />
                  </div>

                  {/* OK / navigation */}
                  <div className="mt-10 flex items-center gap-4 flex-wrap">
                    <button onClick={goNext}
                      className="px-5 py-3 rounded-full text-[14px] font-bold inline-flex items-center gap-2"
                      style={{ background: accent, color: "var(--ink)", fontFamily: "var(--font-body)" }}>
                      {isLastStep ? "Review answers" : "OK"}
                      <span>&#10003;</span>
                    </button>
                    <span className="mono-label text-[11px]">&crarr; ENTER</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
