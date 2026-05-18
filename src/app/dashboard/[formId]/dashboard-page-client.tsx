"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignPersonalMessage,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SubmissionTable } from "@/components/dashboard/submission-table";
import { useUserForms } from "@/hooks/use-user-forms";
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
import {
  Loader2,
  ArrowLeft,
  Copy,
  RefreshCw,
  Shield,
  MessageSquare,
  Unlock,
  Calendar,
  Wallet,
  AlertCircle,
  Database,
  Coins,
} from "lucide-react";
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
  const params = useParams();
  const router = useRouter();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { forms, updateForm } = useUserForms();
  const formId = params.formId as string;

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [submissions, setSubmissions] = useState<LoadedSubmission[]>([]);
  const [notes, setNotes] = useState<Record<string, AdminNote>>({});
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [hasDecrypted, setHasDecrypted] = useState(false);

  const formEntry = forms.find((f) => f.formId === formId);

  const loadData = useCallback(async () => {
    if (!formEntry) return;
    setLoading(true);

    try {
      const formDef = await readJSON<FormDefinition>(formEntry.formBlobId);
      setForm(formDef);

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
            const data = await readJSON<FormSubmission>(
              entry.submissionBlobId
            );
            return {
              blobId: entry.submissionBlobId,
              data,
              submitterAddress: entry.submitterAddress,
              rewardStatus,
              rewardTxDigest,
            };
          } catch {
            return {
              blobId: entry.submissionBlobId,
              data: null,
              encrypted: entry.encrypted,
              submitterAddress: entry.submitterAddress,
              rewardStatus,
              rewardTxDigest,
            };
          }
        })
      );

      setSubmissions(loaded);
      updateForm(formId, { submissionCount: loaded.length });

      const notesData = await enclaveAction("get_notes", { formId });
      setNotes(notesData as Record<string, AdminNote>);
    } catch (error) {
      toast.error(
        `Failed to load: ${error instanceof Error ? error.message : "Error"}`
      );
    } finally {
      setLoading(false);
    }
  }, [formEntry, formId, updateForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSealDecrypt = async () => {
    if (!account || !form?.settings.sealAllowlistId) return;

    setDecrypting(true);
    toast.info("Sign the message in your wallet to decrypt...");

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
              account.address,
              async (message: Uint8Array) => {
                const result = await signPersonalMessage({
                  message,
                });
                return { signature: result.signature };
              }
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
      toast.error(
        `Decryption failed: ${error instanceof Error ? error.message : "Error"}`
      );
    } finally {
      setDecrypting(false);
    }
  };

  const handleSaveNote = async (
    submissionBlobId: string,
    note: string,
    priority: string
  ) => {
    await enclaveAction("save_note", { formId, submissionBlobId, note, priority });
    setNotes((prev) => ({
      ...prev,
      [submissionBlobId]: {
        note,
        priority: priority as AdminNote["priority"],
        createdAt:
          prev[submissionBlobId]?.createdAt || new Date().toISOString(),
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

      await enclaveAction("update_reward", {
        formId,
        submissionBlobId,
        rewardTxDigest: result.digest,
      });

      saveRewardRecord(formId, submissionBlobId, {
        rewardStatus: "sent",
        rewardTxDigest: result.digest,
        sentAt: new Date().toISOString(),
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.blobId === submissionBlobId
            ? { ...s, rewardStatus: "sent" as const, rewardTxDigest: result.digest }
            : s
        )
      );

      toast.success(`Sent ${amount} SUI reward`);
    } catch (error) {
      toast.error(
        `Reward failed: ${error instanceof Error ? error.message : "Error"}`
      );
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-[13px] text-muted-foreground">Connect to view form details</p>
      </div>
    );
  }

  if (!formEntry) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Form Not Found</h2>
        <p className="text-[13px] text-muted-foreground mb-6">
          This form is not in your local index
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Database className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-3" />
        <p className="text-[13px] text-muted-foreground">
          Loading from Walrus...
        </p>
      </div>
    );
  }

  const formLink = generateFormLink(formEntry.formBlobId);
  const hasEncrypted = submissions.some((s) => s.encrypted && !s.data);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 shrink-0"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {form?.title || formEntry.title}
          </h1>
          {form?.description && (
            <p className="text-[14px] text-muted-foreground mt-1 line-clamp-2">
              {form.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              navigator.clipboard.writeText(formLink);
              toast.success("Link copied!");
            }}
          >
            <Copy className="h-3 w-3 mr-1.5" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={loadData}>
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 text-[13px]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div>
            <span className="font-semibold">{submissions.length}</span>
            <span className="text-muted-foreground ml-1">
              submission{submissions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Created {formatDate(formEntry.createdAt)}
        </div>
        {form?.settings.encryptSubmissions && (
          <>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 text-[13px]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-3.5 w-3.5 text-foreground" />
              </div>
              <span className="font-medium">Seal Encrypted</span>
            </div>
          </>
        )}
        {form?.settings.rewardEnabled && (
          <>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 text-[13px]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-muted-foreground">
                {submissions.filter((s) => s.rewardStatus === "sent").length} / {submissions.length} rewarded ({form.settings.rewardAmountSui} SUI each)
              </span>
            </div>
          </>
        )}
      </div>

      {/* Decrypt banner */}
      {hasEncrypted && !hasDecrypted && (
        <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Shield className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold mb-1">
              Encrypted Submissions
            </h3>
            <p className="text-[13px] text-muted-foreground mb-3">
              Sign with your wallet to decrypt. Only the form owner&apos;s wallet can decrypt these responses.
            </p>
            <Button
              onClick={handleSealDecrypt}
              size="sm"
              disabled={decrypting}
              className="rounded-lg"
            >
              {decrypting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 mr-1.5" />
                  Decrypt with Wallet
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Submission table */}
      {form && (
        <SubmissionTable
          form={form}
          submissions={submissions}
          notes={notes}
          onSaveNote={handleSaveNote}
          onSendReward={form.settings.rewardEnabled ? handleSendReward : undefined}
          rewardAmountSui={form.settings.rewardAmountSui}
        />
      )}
    </div>
  );
}
