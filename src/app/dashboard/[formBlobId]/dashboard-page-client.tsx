"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useCurrentAccount,
  useSignPersonalMessage,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";
import { SubmissionTable } from "@/components/dashboard/submission-table";
import { readJSON, readBlob } from "@/lib/walrus";
import { enclaveAction } from "@/lib/enclave";
import { sealDecrypt } from "@/lib/seal";
import { buildRewardTransferTx } from "@/lib/sui-transfer";
import { getRewardRecords, saveRewardRecord } from "@/lib/reward-storage";
import { generateFormLink, formatDate } from "@/lib/utils";
import type {
  FormDefinition,
  FormSubmission,
  AdminNote,
  SubmissionEntry,
} from "@/lib/types";
import { useXAuth } from "@/hooks/use-x-auth";
import Link from "next/link";

interface LoadedSubmission {
  blobId: string;
  data: FormSubmission | null;
  encrypted?: boolean;
  submitterAddress?: string;
  rewardStatus?: "pending" | "sent";
  rewardTxDigest?: string;
}

export default function DashboardPageClient() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { isAuthenticated: xAuthed, xToken, isVerifying: xVerifying } = useXAuth();
  const hasAuth = !!account || xAuthed;

  const [formBlobId, setFormBlobId] = useState<string | null>(null);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [submissions, setSubmissions] = useState<LoadedSubmission[]>([]);
  const [notes, setNotes] = useState<Record<string, AdminNote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [hasDecrypted, setHasDecrypted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract formBlobId from URL path (same pattern as form-page-client.tsx)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/dashboard\/(.+?)\/?$/);
    if (match && match[1] && match[1] !== "_") {
      setFormBlobId(decodeURIComponent(match[1]));
    } else {
      setError("No form ID found in URL.");
      setLoading(false);
    }
  }, []);

  // Load form from Walrus + submissions from enclave
  const loadData = useCallback(async () => {
    if (!formBlobId) return;
    setLoading(true);
    setError(null);

    try {
      const formDef = await readJSON<FormDefinition>(formBlobId);
      setForm(formDef);

      const formId = formDef.id;

      const entries: SubmissionEntry[] = await enclaveAction("get_submissions", { formId });
      const rewardRecords = getRewardRecords(formId);

      const loaded: LoadedSubmission[] = await Promise.all(
        entries.map(async (entry) => {
          const localReward = rewardRecords[entry.submissionBlobId];
          const rewardStatus = entry.rewardStatus || localReward?.rewardStatus;
          const rewardTxDigest = entry.rewardTxDigest || localReward?.rewardTxDigest;

          try {
            if (entry.encrypted) {
              return {
                blobId: entry.submissionBlobId,
                data: null,
                encrypted: true,
                submitterAddress: entry.submitterAddress,
                rewardStatus,
                rewardTxDigest,
              };
            }
            const data = await readJSON<FormSubmission>(entry.submissionBlobId);
            return { blobId: entry.submissionBlobId, data, submitterAddress: entry.submitterAddress, rewardStatus, rewardTxDigest };
          } catch {
            return { blobId: entry.submissionBlobId, data: null, encrypted: entry.encrypted, submitterAddress: entry.submitterAddress, rewardStatus, rewardTxDigest };
          }
        })
      );

      setSubmissions(loaded);

      const notesData = await enclaveAction("get_notes", { formId });
      setNotes(notesData as Record<string, AdminNote>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load form from Walrus");
    } finally {
      setLoading(false);
    }
  }, [formBlobId]);

  useEffect(() => {
    if (formBlobId) loadData();
  }, [formBlobId, loadData]);

  const handleSealDecrypt = async () => {
    if (!form?.settings.sealAllowlistId) return;
    if (!account && !xToken) return;

    setDecrypting(true);

    let signerAddress: string;
    let signFn: (message: Uint8Array) => Promise<{ signature: string }>;

    if (xToken) {
      toast.info("Decrypting via enclave...");
      const addrRes = await enclaveAction<{ address: string }>("get_derived_address", { token: xToken });
      signerAddress = addrRes.address;
      signFn = async (message: Uint8Array) => {
        let binary = "";
        for (let i = 0; i < message.length; i++) binary += String.fromCharCode(message[i]);
        const messageB64 = btoa(binary);
        const res = await enclaveAction<{ signature: string }>("seal_sign", {
          token: xToken,
          message: messageB64,
        });
        return { signature: res.signature };
      };
    } else if (account) {
      toast.info("Sign the message in your wallet to decrypt...");
      signerAddress = account.address;
      signFn = async (message: Uint8Array) => {
        const result = await signPersonalMessage({ message });
        return { signature: result.signature };
      };
    } else {
      return;
    }

    try {
      const decrypted = await Promise.all(
        submissions.map(async (sub) => {
          if (sub.data || !sub.encrypted) return sub;
          try {
            const encryptedBytes = await readBlob(sub.blobId);
            const plainBytes = await sealDecrypt(
              suiClient,
              encryptedBytes,
              form.settings.sealAllowlistId!,
              signerAddress,
              signFn,
            );
            const text = new TextDecoder().decode(plainBytes);
            const data = JSON.parse(text) as FormSubmission;
            return { ...sub, data, encrypted: false };
          } catch (err) {
            console.error("Decrypt failed for", sub.blobId, err);
            return sub;
          }
        })
      );

      const decryptedCount = decrypted.filter(
        (s) => s.data && !submissions.find((o) => o.blobId === s.blobId)?.data
      ).length;
      setSubmissions(decrypted);
      setHasDecrypted(true);

      if (decryptedCount > 0) {
        toast.success(`Decrypted ${decryptedCount} submission(s)`);
      } else {
        toast.error("Could not decrypt. Are you the form owner?");
      }
    } catch (error) {
      toast.error(`Decryption failed: ${error instanceof Error ? error.message : "Error"}`);
    } finally {
      setDecrypting(false);
    }
  };

  const handleSaveNote = async (submissionBlobId: string, note: string, priority: string) => {
    if (!form) return;
    await enclaveAction("save_note", { formId: form.id, submissionBlobId, note, priority });
    setNotes((prev) => ({
      ...prev,
      [submissionBlobId]: {
        note,
        priority: priority as AdminNote["priority"],
        createdAt: prev[submissionBlobId]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleSendReward = async (submissionBlobId: string, recipientAddress: string) => {
    if (!form?.settings.rewardAmountSui) return;
    const amount = form.settings.rewardAmountSui;

    try {
      const tx = buildRewardTransferTx(recipientAddress, amount);
      const result = await signAndExecute({ transaction: tx });
      await suiClient.waitForTransaction({ digest: result.digest });

      await enclaveAction("update_reward", { formId: form.id, submissionBlobId, rewardTxDigest: result.digest });
      saveRewardRecord(form.id, submissionBlobId, { rewardStatus: "sent", rewardTxDigest: result.digest, sentAt: new Date().toISOString() });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.blobId === submissionBlobId
            ? { ...s, rewardStatus: "sent" as const, rewardTxDigest: result.digest }
            : s
        )
      );
      toast.success(`Sent ${amount} SUI reward`);
    } catch (error) {
      toast.error(`Reward failed: ${error instanceof Error ? error.message : "Error"}`);
    }
  };

  const copyLink = () => {
    if (!formBlobId) return;
    navigator.clipboard.writeText(generateFormLink(formBlobId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (!hasAuth) {
    if (xVerifying) {
      return (
        <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center"
             style={{ background: "var(--cream)", color: "var(--ink)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-[var(--coral)] border-t-transparent animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-6"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="heading-display text-[clamp(28px,4vw,48px)]">
          Sign in to <em className="serif-italic font-normal">view</em>
        </div>
        <p className="serif-italic text-[17px] mt-4" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          Connect a wallet or sign in with X to view form details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="mono-label mb-3">Loading from Walrus...</div>
        <div className="w-8 h-8 rounded-full border-2 border-[var(--coral)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-6"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="heading-display text-[clamp(28px,4vw,48px)]">
          Form <em className="serif-italic font-normal">not found.</em>
        </div>
        <p className="serif-italic text-[17px] mt-4 mb-6" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          {error || "This form could not be loaded from Walrus. The blob ID may be invalid or expired."}
        </p>
        <Link href="/dashboard" className="btn-editorial">Back to Dashboard</Link>
      </div>
    );
  }

  const hasEncrypted = submissions.some((s) => s.encrypted && !s.data);
  const encryptedCount = submissions.filter((s) => s.encrypted || (!s.data && !s.encrypted)).length;
  const rewardedCount = submissions.filter((s) => s.rewardStatus === "sent").length;

  return (
    <div style={{ background: "var(--cream)", color: "var(--ink)", minHeight: "calc(100vh - 70px)" }}>
      {/* Masthead */}
      <div className="border-b" style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex items-center justify-between h-8 overflow-hidden">
          <Link href="/dashboard" className="mono-label text-[10px] hover:text-[var(--coral)] transition-colors"
                style={{ fontFamily: "inherit", color: "inherit", letterSpacing: "inherit" }}>
            &larr; All forms
          </Link>
          <span className="mono-label text-[10px]"><em className="serif-italic normal-case tracking-normal">submissions ledger</em></span>
          <span className="mono-label text-[10px] hidden md:block">{submissions.length} entries</span>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pb-20">
        {/* Header card */}
        <div className="pt-8 border-t" style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
          {/* Tags */}
          <div className="flex gap-2.5 mb-4 flex-wrap">
            {form.settings.encryptSubmissions && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold"
                    style={{ background: "var(--ink)", color: "var(--cream)" }}>
                &#9679; Seal encrypted
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold"
                  style={{ background: "var(--cream-deep)", color: "var(--ink)", border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}>
              {formatDate(form.createdAt)}
            </span>
            {form.settings.rewardEnabled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold"
                    style={{ background: "var(--coral)", color: "var(--ink)" }}>
                +{form.settings.rewardAmountSui} SUI/response
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="heading-display text-[clamp(36px,6vw,80px)] leading-[0.95]">
            {form.title}
          </h1>

          {/* Blob ID */}
          <div className="mt-4 text-[13px] break-all"
               style={{ fontFamily: "var(--font-mono)", color: "color-mix(in oklab, var(--ink) 65%, transparent)" }}>
            <span style={{ color: "var(--coral)" }}>walrus://</span>{formBlobId}
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2 flex-wrap">
            <button onClick={copyLink} className="btn-editorial-outline text-[13px] !py-2.5 !px-4">
              {copied ? "\u2713 copied" : "Copy public link"}
            </button>
            <Link href={`/form/${formBlobId}`} className="btn-editorial-outline text-[13px] !py-2.5 !px-4">
              Open form &#8599;
            </Link>
            <button onClick={loadData} className="btn-editorial-outline text-[13px] !py-2.5 !px-4">Refresh</button>
          </div>
        </div>

        {/* Stat tape */}
        <div className="mt-9 border-t border-b py-6 grid grid-cols-2 md:grid-cols-4 gap-y-6"
             style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
          {[
            { k: "Submissions", v: String(submissions.length), s: "total entries", big: true },
            { k: "Encrypted", v: String(encryptedCount), s: form.settings.encryptSubmissions ? "sealed" : "none" },
            { k: "Rewarded", v: String(rewardedCount), s: form.settings.rewardEnabled ? `${form.settings.rewardAmountSui} SUI each` : "disabled" },
            { k: "Fields", v: String(form.fields.length), s: "in this form" },
          ].map((s, i) => (
            <div key={i} className="px-3 md:px-7"
                 style={{ borderLeft: i > 0 ? "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" : undefined }}>
              <div className="mono-label text-[10.5px]">{s.k}</div>
              <div className="mt-2 heading-display leading-none"
                   style={{ fontSize: "clamp(32px, 3.5vw, 56px)", color: s.big ? "var(--coral)" : "var(--ink)" }}>
                {s.v}
              </div>
              <div className="mt-1.5 serif-italic text-[13px]" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
                {s.s}
              </div>
            </div>
          ))}
        </div>

        {/* Insights panel */}
        {submissions.filter((s) => s.data).length > 0 && (
          <InsightsPanel form={form} submissions={submissions.filter((s) => s.data).map((s) => s.data!)} />
        )}

        {/* Decrypt banner */}
        {hasEncrypted && !hasDecrypted && (account || xAuthed) && (
          <div className="mt-8 p-6 md:p-7 rounded-[14px] text-center"
               style={{
                 border: "1.5px dashed color-mix(in oklab, var(--ink) 25%, transparent)",
                 background: "var(--cream-deep)",
               }}>
            <div className="heading-display text-[clamp(24px,3vw,36px)]">
              Encrypted submission{submissions.filter((s) => s.encrypted && !s.data).length > 1 ? "s" : ""}
            </div>
            <p className="serif-italic text-[17px] mt-2" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
              {xAuthed ? "Decrypt with your X identity." : "Decrypt with Seal \u2014 requires your wallet signature."}
            </p>
            <button onClick={handleSealDecrypt} disabled={decrypting}
              className="mt-5 px-6 py-3 rounded-full text-[14px] font-semibold disabled:opacity-50"
              style={{ background: "var(--coral)", color: "var(--ink)", fontFamily: "var(--font-body)" }}>
              {decrypting ? "Decrypting..." : "Decrypt"}
            </button>
          </div>
        )}

        {/* Submissions table */}
        <div className="mt-8">
          <SubmissionTable
            form={form}
            submissions={submissions}
            notes={notes}
            onSaveNote={handleSaveNote}
            onSendReward={form.settings.rewardEnabled && account ? handleSendReward : undefined}
            rewardAmountSui={form.settings.rewardAmountSui}
          />
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ form, submissions }: { form: FormDefinition; submissions: FormSubmission[] }) {
  const total = submissions.length;
  if (total === 0) return null;

  const fieldInsights = form.fields.map((field) => {
    const values = submissions.map((s) => s.responses[field.id]).filter((v) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0));
    const completionRate = Math.round((values.length / total) * 100);

    let detail: React.ReactNode = null;

    if (field.type === "star-rating") {
      const nums = values.filter((v) => typeof v === "number") as number[];
      if (nums.length > 0) {
        const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
        detail = (
          <span>
            avg <strong>{avg}</strong> / {field.maxRating || 5}
          </span>
        );
      }
    } else if (["dropdown", "radio"].includes(field.type)) {
      const counts: Record<string, number> = {};
      values.forEach((v) => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        detail = (
          <span>
            top: <strong>{top[0]}</strong> ({Math.round((top[1] / values.length) * 100)}%)
          </span>
        );
      }
    } else if (field.type === "checkbox") {
      const counts: Record<string, number> = {};
      values.forEach((v) => {
        if (Array.isArray(v)) v.forEach((item) => { counts[String(item)] = (counts[String(item)] || 0) + 1; });
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        detail = (
          <span>
            top: <strong>{top[0]}</strong> ({top[1]}x)
          </span>
        );
      }
    } else if (field.type === "number") {
      const nums = values.map(Number).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
        detail = (
          <span>
            avg <strong>{avg}</strong>
          </span>
        );
      }
    }

    return { field, completionRate, detail, answered: values.length };
  });

  return (
    <div className="mt-8 p-5 md:p-7 rounded-[14px]"
         style={{
           background: "var(--cream-deep)",
           border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
         }}>
      <div className="flex items-baseline justify-between mb-4">
        <span className="mono-label text-[11px]">&mdash;&mdash; insights</span>
        <span className="mono-label text-[10px]">{total} response{total !== 1 ? "s" : ""} analyzed</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {fieldInsights.map(({ field, completionRate, detail, answered }) => (
          <div key={field.id} className="p-3.5 rounded-[10px]"
               style={{ background: "var(--cream)", border: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold truncate" style={{ maxWidth: "70%" }}>
                {field.label || "Untitled"}
              </span>
              <span className="mono-label text-[10px]">{completionRate}%</span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden mb-2"
                 style={{ background: "color-mix(in oklab, var(--ink) 10%, transparent)" }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${completionRate}%`, background: completionRate === 100 ? "var(--coral)" : "var(--ink)" }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="serif-italic text-[12px]" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
                {answered}/{total} answered
              </span>
              {detail && (
                <span className="mono-label text-[10px]" style={{ color: "var(--ink)" }}>
                  {detail}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
