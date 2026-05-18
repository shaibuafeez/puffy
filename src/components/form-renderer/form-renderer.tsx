"use client";

import { useState, useCallback, useEffect } from "react";
import { useCurrentAccount, useSuiClient, ConnectModal } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldRenderer } from "./field-renderer";
import { TweetEmbed } from "@/components/shared/tweet-embed";
import { storeJSON, storeBlob, getBlobUrl } from "@/lib/walrus";
import { sealEncrypt } from "@/lib/seal";
import { enclaveAction } from "@/lib/enclave";
import type { FormDefinition, FormSubmission, FontFamily } from "@/lib/types";
import {
  Loader2,
  Send,
  CheckCircle2,
  Database,
  Shield,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  Pencil,
  Coins,
  Wallet,
} from "lucide-react";

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
  const progress =
    totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const theme = form.settings.theme;

  // Build inline style for themed containers
  const themedStyle: React.CSSProperties = {
    ...(theme?.backgroundColor && { backgroundColor: theme.backgroundColor }),
    ...(theme?.textColor && { color: theme.textColor }),
    ...(theme?.fontFamily && { fontFamily: FONT_MAP[theme.fontFamily] }),
  };

  const progressBarStyle: React.CSSProperties = {
    ...(theme?.primaryColor && { backgroundColor: theme.primaryColor }),
    boxShadow: `0 0 12px 1px ${theme?.primaryColor || "oklch(0.93 0 0)"}40`,
  };

  const accentButtonStyle: React.CSSProperties = {
    ...(theme?.primaryColor && {
      backgroundColor: theme.primaryColor,
      borderColor: theme.primaryColor,
    }),
  };

  const mutedStyle: React.CSSProperties = {
    ...(theme?.textColor && { color: theme.textColor, opacity: 0.5 }),
  };

  const borderStyle: React.CSSProperties = {
    ...(theme?.textColor && {
      borderColor: `${theme.textColor}20`,
    }),
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const URL_RE = /^https?:\/\/.+\..+/;

  const validateField = useCallback(
    (field: (typeof form.fields)[number], val: unknown): string | null => {
      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0) ||
        val === 0;

      if (field.required && isEmpty) {
        return "This field is required";
      }

      if (!isEmpty && typeof val === "string" && val.trim() !== "") {
        if (field.type === "email" && !EMAIL_RE.test(val)) {
          return "Please enter a valid email address";
        }
        if (field.type === "url" && !URL_RE.test(val)) {
          return "Please enter a valid URL (e.g. https://example.com)";
        }
        if (field.type === "number" && isNaN(Number(val))) {
          return "Please enter a valid number";
        }
      }

      return null;
    },
    []
  );

  const validateCurrentField = useCallback((): boolean => {
    if (!currentField) return true;
    const val = responses[currentField.id];
    const error = validateField(currentField, val);
    if (error) {
      setErrors({ [currentField.id]: error });
      return false;
    }
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
    if (showReview) {
      setShowReview(false);
      setDirection("backward");
      setAnimKey((k) => k + 1);
      return;
    }
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((s) => s - 1);
      setAnimKey((k) => k + 1);
      setErrors({});
    }
  }, [currentStep, showReview]);

  const goToStep = useCallback((step: number) => {
    setShowReview(false);
    setDirection("backward");
    setCurrentStep(step);
    setAnimKey((k) => k + 1);
    setErrors({});
  }, []);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const val = responses[field.id];
      const error = validateField(field, val);
      if (error) {
        newErrors[field.id] = error;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = form.fields.findIndex(
        (f) => newErrors[f.id]
      );
      if (firstErrorField >= 0) {
        setShowReview(false);
        setCurrentStep(firstErrorField);
        setAnimKey((k) => k + 1);
      }
      return;
    }

    setSubmitting(true);
    try {
      const submission: FormSubmission = {
        formId: form.id,
        formBlobId,
        submittedAt: new Date().toISOString(),
        submitter: account?.address || "anonymous",
        responses,
      };

      let submissionBlobId: string;
      let encrypted = false;

      if (
        form.settings.encryptSubmissions &&
        form.settings.sealAllowlistId
      ) {
        toast.info("Encrypting with Seal...");
        const plaintext = new TextEncoder().encode(
          JSON.stringify(submission)
        );
        const encryptedBytes = await sealEncrypt(
          suiClient,
          plaintext,
          form.settings.sealAllowlistId
        );
        submissionBlobId = await storeBlob(new Uint8Array(encryptedBytes));
        encrypted = true;
      } else {
        submissionBlobId = await storeJSON(submission);
      }

      await enclaveAction("register_submission", {
        formId: form.id,
        submissionBlobId,
        submittedAt: submission.submittedAt,
        encrypted,
        submitterAddress: account?.address,
      });

      setSubmitted(true);
      toast.success("Submitted successfully!");
    } catch (error) {
      toast.error(
        `Submission failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted || submitting) return;

      if (e.key === "Enter" && !e.shiftKey) {
        if (
          currentField &&
          (currentField.type === "textarea" ||
            currentField.type === "richtext")
        ) {
          return;
        }
        e.preventDefault();
        if (showReview) {
          handleSubmit();
        } else {
          goNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentField, goNext, showReview, submitted, submitting]);

  // Logo component
  const Logo = theme?.logoBlobId ? (
    <img
      src={getBlobUrl(theme.logoBlobId)}
      alt=""
      className="h-6 w-auto object-contain"
    />
  ) : null;

  // Google Font link
  const FontLink =
    theme?.fontFamily && theme.fontFamily !== "inter" ? (
      // eslint-disable-next-line @next/next/no-page-custom-font
      <link
        rel="stylesheet"
        href={GOOGLE_FONT_URL[theme.fontFamily]}
      />
    ) : null;

  const rewardEnabled = form.settings.rewardEnabled;
  const rewardAmount = form.settings.rewardAmountSui ?? 0;

  // Reward badge component
  const RewardBadge = rewardEnabled ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400">
      <Coins className="h-3 w-3" />
      {rewardAmount} SUI reward
    </span>
  ) : null;

  // Wallet gate for reward-enabled forms
  if (rewardEnabled && !account) {
    return (
      <>
        {FontLink}
        <div
          className="fixed inset-0 z-[60] bg-background flex items-center justify-center"
          style={themedStyle}
        >
          <div className="flex flex-col items-center text-center px-6 step-enter-right">
            {Logo && <div className="mb-6">{Logo}</div>}
            <div className="relative mb-6">
              <div
                className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center"
              >
                <Coins className="h-8 w-8 text-amber-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Earn {rewardAmount} SUI
            </h2>
            <p className="text-[14px] max-w-sm mb-6" style={mutedStyle}>
              Connect your wallet to submit this form and receive your reward.
            </p>
            <ConnectModal
              trigger={
                <button className="flex items-center gap-2 h-10 rounded-lg bg-foreground text-background px-6 text-[13px] font-medium transition-all duration-200 hover:opacity-90 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </button>
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
        <div
          className="fixed inset-0 z-[60] bg-background flex items-center justify-center"
          style={themedStyle}
        >
          <div className="flex flex-col items-center text-center px-6 step-enter-right">
            {Logo && <div className="mb-6">{Logo}</div>}
            <div className="relative mb-6">
              <div
                className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center"
                style={theme?.primaryColor ? { backgroundColor: `${theme.primaryColor}20` } : {}}
              >
                <CheckCircle2
                  className="h-8 w-8"
                  style={{
                    ...(theme?.primaryColor ? { color: theme.primaryColor } : {}),
                    animation: "check-pop 0.5s ease-out forwards",
                  }}
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {form.settings.submitMessage || "Thank you!"}
            </h2>
            <p className="text-[14px] max-w-sm mb-6" style={mutedStyle}>
              Your response has been securely stored on Walrus decentralized
              storage.
            </p>
            {rewardEnabled && (
              <div className="w-full max-w-sm rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-4">
                <div className="flex items-center gap-2 text-[13px] text-amber-400">
                  <Coins className="h-3.5 w-3.5 shrink-0" />
                  Reward of {rewardAmount} SUI pending — the form owner will
                  send it after review.
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 text-[12px]" style={mutedStyle}>
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3" />
                Walrus Storage
              </div>
              {form.settings.encryptSubmissions && (
                <>
                  <div className="h-3 w-px" style={borderStyle} />
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    Seal Encrypted
                  </div>
                </>
              )}
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
        <div
          className="fixed inset-0 z-[60] bg-background flex flex-col"
          style={themedStyle}
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-foreground transition-all duration-500 ease-out"
              style={{ width: "100%", ...progressBarStyle }}
            />
          </div>

          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-border/30"
            style={borderStyle}
          >
            <div className="flex items-center gap-3">
              {Logo}
              <span className="text-[13px] font-medium truncate">
                {form.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {RewardBadge}
              <span className="text-[12px]" style={mutedStyle}>
                Review your answers
              </span>
            </div>
          </div>

          {/* Review content */}
          <div className="flex-1 overflow-y-auto">
            <div
              key={animKey}
              className={`max-w-xl mx-auto px-6 py-10 space-y-6 ${
                direction === "forward"
                  ? "step-enter-right"
                  : "step-enter-left"
              }`}
            >
              <div className="space-y-1 mb-8">
                <h2 className="text-2xl font-semibold">
                  Review your answers
                </h2>
                <p className="text-[14px]" style={mutedStyle}>
                  Check your responses before submitting.
                </p>
              </div>

              {form.fields.map((field, i) => {
                const val = responses[field.id];
                let display: string;
                if (val === undefined || val === null || val === "") {
                  display = "—";
                } else if (Array.isArray(val)) {
                  display = val.join(", ");
                } else {
                  display = String(val);
                }

                return (
                  <div
                    key={field.id}
                    className="flex items-start justify-between gap-4 py-3 border-b border-border/30 group"
                    style={borderStyle}
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] mb-0.5" style={mutedStyle}>
                        {field.label || "Untitled Field"}
                      </p>
                      <p className="text-[14px] font-medium truncate">
                        {field.type === "star-rating"
                          ? `${val || 0} / ${field.maxRating || 5} stars`
                          : display}
                      </p>
                      {errors[field.id] && (
                        <p className="text-[12px] text-destructive mt-0.5">
                          {errors[field.id]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => goToStep(i)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent"
                    >
                      <Pencil className="h-3 w-3" style={mutedStyle} />
                    </button>
                  </div>
                );
              })}

              {form.settings.encryptSubmissions && (
                <div
                  className="flex items-center gap-2 text-[12px] mt-4"
                  style={mutedStyle}
                >
                  <Shield className="h-3 w-3" />
                  Your response will be encrypted with Seal before storing
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div
            className="border-t border-border/30 px-6 py-4"
            style={borderStyle}
          >
            <div className="max-w-xl mx-auto flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span
                  className="text-[11px] hidden sm:flex items-center gap-1"
                  style={mutedStyle}
                >
                  Press Enter
                  <CornerDownLeft className="h-3 w-3" />
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-lg"
                  style={accentButtonStyle}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      {form.settings.encryptSubmissions
                        ? "Encrypting..."
                        : "Submitting..."}
                    </>
                  ) : (
                    <>
                      Submit
                      <Send className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Step view
  return (
    <>
      {FontLink}
      <div
        className="fixed inset-0 z-[60] bg-background flex flex-col"
        style={themedStyle}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-foreground transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, ...progressBarStyle }}
          />
        </div>

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border/30"
          style={borderStyle}
        >
          <div className="flex items-center gap-3">
            {Logo}
            <span className="text-[13px] font-medium truncate">
              {form.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {RewardBadge}
            <span className="text-[12px] tabular-nums" style={mutedStyle}>
              {currentStep + 1} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div
            key={animKey}
            className={`w-full max-w-xl px-6 py-10 ${
              direction === "forward"
                ? "step-enter-right"
                : "step-enter-left"
            }`}
          >
            {currentStep === 0 && form.tweetUrl && (
              <div className="mb-6">
                <TweetEmbed
                  tweetUrl={form.tweetUrl}
                  tweetAuthor={form.tweetAuthor}
                  description={form.description}
                />
              </div>
            )}
            {currentField && (
              <div className="space-y-6">
                {/* Step number + label */}
                <div className="space-y-2">
                  <span className="text-[12px]" style={mutedStyle}>
                    {currentStep + 1} →
                  </span>
                  <h2 className="text-2xl font-semibold leading-tight">
                    {currentField.label || "Untitled Field"}
                    {currentField.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </h2>
                  {currentField.description && (
                    <p className="text-[14px]" style={mutedStyle}>
                      {currentField.description}
                    </p>
                  )}
                </div>

                {/* Field input */}
                <FieldRenderer
                  field={currentField}
                  value={responses[currentField.id]}
                  onChange={(val) =>
                    setResponses((prev) => ({
                      ...prev,
                      [currentField.id]: val,
                    }))
                  }
                  error={errors[currentField.id]}
                  hideLabel
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav */}
        <div
          className="border-t border-border/30 px-6 py-4"
          style={borderStyle}
        >
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={currentStep === 0}
              className={currentStep === 0 ? "invisible" : ""}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span
                className="text-[11px] hidden sm:flex items-center gap-1"
                style={mutedStyle}
              >
                Press Enter
                <CornerDownLeft className="h-3 w-3" />
              </span>
              <Button
                onClick={goNext}
                className="rounded-lg"
                style={accentButtonStyle}
              >
                {isLastStep ? "Review" : "OK"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
