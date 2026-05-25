"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, downloadAsCSV, downloadAsJSON } from "@/lib/utils";
import { getBlobUrl } from "@/lib/walrus";
import type { FormDefinition, FormSubmission, AdminNote } from "@/lib/types";
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  low: "color-mix(in oklab, var(--ink) 60%, transparent)",
  medium: "var(--sand)",
  high: "var(--coral)",
  critical: "var(--destructive)",
};

interface SubmissionTableProps {
  form: FormDefinition;
  submissions: { blobId: string; data: FormSubmission | null; encrypted?: boolean; submitterAddress?: string; rewardStatus?: "pending" | "sent"; rewardTxDigest?: string }[];
  notes: Record<string, AdminNote>;
  onSaveNote: (submissionBlobId: string, note: string, priority: string) => void;
  onSendReward?: (submissionBlobId: string, recipientAddress: string) => Promise<void>;
  rewardAmountSui?: number;
}

export function SubmissionTable({
  form,
  submissions,
  notes,
  onSaveNote,
  onSendReward,
  rewardAmountSui,
}: SubmissionTableProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteSheet, setNoteSheet] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notePriority, setNotePriority] = useState("medium");
  const [sendingReward, setSendingReward] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  const filtered = submissions.filter((sub) => {
    if (tab === "enc" && !sub.encrypted) return false;
    if (!search) return true;
    if (!sub.data) return false;
    const text = JSON.stringify(sub.data.responses).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const openNoteSheet = (blobId: string) => {
    const existing = notes[blobId];
    setNoteText(existing?.note || "");
    setNotePriority(existing?.priority || "medium");
    setNoteSheet(blobId);
  };

  const saveNote = () => {
    if (noteSheet) {
      onSaveNote(noteSheet, noteText, notePriority);
      setNoteSheet(null);
      toast.success("Note saved");
    }
  };

  const handleExportCSV = () => {
    const rows = filtered
      .filter((s) => s.data)
      .map((s) => {
        const row: Record<string, unknown> = {
          submittedAt: s.data!.submittedAt,
          submitter: s.data!.submitter,
          blobId: s.blobId,
        };
        form.fields.forEach((field) => {
          const val = s.data!.responses[field.id];
          row[field.label || field.id] = Array.isArray(val) ? val.join("; ") : String(val ?? "");
        });
        return row;
      });
    downloadAsCSV(rows, `${form.title}-submissions`);
  };

  const handleExportJSON = () => {
    const data = filtered.filter((s) => s.data).map((s) => s.data);
    downloadAsJSON(data, `${form.title}-submissions`);
  };

  const renderStars = (count: number, max: number = 5) => (
    <span style={{ color: "var(--coral)" }}>
      {"★".repeat(count)}<span style={{ color: "rgba(0,0,0,0.18)" }}>{"★".repeat(max - count)}</span>
    </span>
  );

  return (
    <div>
      {/* Filters + search */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="mono-label text-[11px]">&mdash;&mdash; view</span>
        <div className="flex rounded-full p-1"
             style={{ background: "var(--cream-deep)", border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}>
          {[
            { id: "all", label: "All", count: submissions.length },
            { id: "enc", label: "Encrypted only", count: submissions.filter((s) => s.encrypted).length },
          ].map((o) => (
            <button key={o.id} onClick={() => setTab(o.id)}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors"
              style={{
                color: tab === o.id ? "var(--cream)" : "color-mix(in oklab, var(--ink) 70%, transparent)",
                background: tab === o.id ? "var(--ink)" : "transparent",
              }}>
              {o.label} <span className="mono-label text-[10px]" style={{ color: tab === o.id ? "color-mix(in oklab, var(--cream) 55%, transparent)" : "inherit" }}>{o.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-editorial-outline text-[12px] !py-2 !px-3">
            &darr; Export CSV
          </button>
          <button onClick={handleExportJSON} className="btn-editorial-outline text-[12px] !py-2 !px-3">
            Export JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderTop: "1px solid color-mix(in oklab, var(--ink) 18%, transparent)" }}>
        {/* Header */}
        <div className="hidden md:grid gap-4 py-3.5"
             style={{
               gridTemplateColumns: "60px 160px 1fr 140px 140px 48px",
               borderBottom: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
             }}>
          <span className="mono-label text-[10px]">No</span>
          <span className="mono-label text-[10px]">Date</span>
          <span className="mono-label text-[10px]">Submitter</span>
          <span className="mono-label text-[10px]">State</span>
          <span className="mono-label text-[10px]">Priority</span>
          <span className="mono-label text-[10px]" />
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <span className="mono-label text-[11px]">&mdash;&mdash; inbox</span>
            <div className="heading-display text-[clamp(24px,3vw,36px)] mt-3">
              No submissions <em className="serif-italic font-normal">yet.</em>
            </div>
          </div>
        )}

        {/* Rows */}
        {filtered.map((sub, i) => {
          const isOpen = expanded === sub.blobId;
          const note = notes[sub.blobId];
          const isDec = sub.data && !sub.encrypted;
          const firstTextFieldId = form.fields.find((f) => f.type === "text" || f.type === "textarea" || f.type === "richtext")?.id;
          const preview = sub.data && firstTextFieldId ? String(sub.data.responses[firstTextFieldId] || "") : null;

          return (
            <div key={sub.blobId}>
              {/* Row */}
              <div onClick={() => setExpanded(isOpen ? null : sub.blobId)}
                className="grid gap-4 py-4 cursor-pointer items-center"
                style={{
                  gridTemplateColumns: "60px 160px 1fr 140px 140px 48px",
                  borderBottom: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)",
                }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "color-mix(in oklab, var(--ink) 70%, transparent)" }}>
                  {sub.data ? formatDate(sub.data.submittedAt) : "-"}
                </span>
                <span className="flex items-center gap-3 min-w-0">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13.5px", color: "var(--ink)" }}>
                    {sub.submitterAddress ? `${sub.submitterAddress.slice(0, 6)}...${sub.submitterAddress.slice(-4)}` : sub.data?.submitter === "anonymous" ? "anonymous" : "-"}
                  </span>
                  {isDec && preview && (
                    <span className="serif-italic text-[14px] truncate" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
                      &middot; &ldquo;{preview.slice(0, 56)}{preview.length > 56 ? "..." : ""}&rdquo;
                    </span>
                  )}
                </span>
                <span>
                  {!isDec ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: "var(--ink)", color: "var(--cream)" }}>
                      &#9679; sealed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: "var(--cream-deep)", color: "var(--ink)", border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}>
                      &#10003; decrypted
                    </span>
                  )}
                </span>
                <span>
                  {note && (
                    <span className="mono-label text-[11.5px] font-semibold"
                          style={{ color: PRIORITY_COLORS[note.priority] || "var(--ink)" }}>
                      &#9679; {note.priority}
                    </span>
                  )}
                </span>
                <span className="text-right transition-transform duration-200"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        color: "color-mix(in oklab, var(--ink) 55%, transparent)",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}>
                  &#8964;
                </span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="py-5 pl-5 md:pl-20 pr-5 md:pr-7"
                     style={{
                       background: "var(--cream-deep)",
                       borderBottom: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
                       animation: "slideDown .25s ease both",
                     }}>
                  {!isDec ? (
                    <div className="p-7 rounded-[14px] text-center"
                         style={{ background: "var(--cream)", border: "1.5px dashed color-mix(in oklab, var(--ink) 25%, transparent)" }}>
                      <div className="heading-display text-[28px]">Encrypted submission</div>
                      <p className="serif-italic text-[16px] mt-2" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
                        Decrypt with Seal &mdash; requires your wallet signature.
                      </p>
                    </div>
                  ) : sub.data ? (
                    <div>
                      {/* Response data */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {form.fields.map((field) => {
                          const val = sub.data!.responses[field.id];
                          let display: React.ReactNode;
                          if (field.type === "star-rating" && typeof val === "number") {
                            display = renderStars(val, field.maxRating || 5);
                          } else if (field.type === "file-upload" && val) {
                            display = (
                              <a href={getBlobUrl(val as string)} target="_blank" rel="noopener noreferrer"
                                 className="mono-label text-[11px]" style={{ color: "var(--coral)" }}>
                                View file &#8599;
                              </a>
                            );
                          } else if (Array.isArray(val)) {
                            display = val.join(", ");
                          } else {
                            display = String(val ?? "-");
                          }
                          return (
                            <div key={field.id}>
                              <div className="mono-label text-[10px]">{field.label || field.id}</div>
                              <div className="mt-1.5" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px", letterSpacing: "-0.015em", color: "var(--ink)" }}>
                                {display}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="mt-6 pt-4 flex items-center gap-3 flex-wrap"
                           style={{ borderTop: "1px dashed color-mix(in oklab, var(--ink) 18%, transparent)" }}>
                        {note && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                style={{ background: "var(--sand)", color: "var(--ink)" }}>
                            &#9679; note: {note.note}
                          </span>
                        )}
                        <div className="flex-1" />
                        {onSendReward && sub.rewardStatus !== "sent" && sub.submitterAddress && (
                          <button
                            disabled={sendingReward === sub.blobId}
                            onClick={async () => {
                              setSendingReward(sub.blobId);
                              try { await onSendReward(sub.blobId, sub.submitterAddress!); }
                              finally { setSendingReward(null); }
                            }}
                            className="btn-editorial-outline text-[12px] !py-1.5 !px-3 disabled:opacity-50">
                            {sendingReward === sub.blobId ? "Sending..." : `Send ${rewardAmountSui} SUI ↗`}
                          </button>
                        )}
                        {sub.rewardStatus === "sent" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                style={{ background: "var(--coral)", color: "var(--ink)" }}>
                            +{rewardAmountSui} SUI rewarded
                          </span>
                        )}
                        <button onClick={() => openNoteSheet(sub.blobId)}
                          className="btn-editorial-outline text-[12px] !py-1.5 !px-3">
                          Add note
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }`}</style>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes sheet */}
      <Sheet open={!!noteSheet} onOpenChange={() => setNoteSheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>Admin Notes</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <label className="mono-label text-[11px]">Priority</label>
              <div className="flex gap-2">
                {["low", "medium", "high", "critical"].map((p) => (
                  <button key={p} onClick={() => setNotePriority(p)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
                    style={{
                      background: notePriority === p ? "var(--ink)" : "var(--cream-deep)",
                      color: notePriority === p ? "var(--cream)" : "var(--ink)",
                      border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="mono-label text-[11px]">Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes about this submission..."
                rows={6}
                className="rounded-lg"
              />
            </div>
            <button onClick={saveNote} className="btn-editorial w-full justify-center">
              Save Note
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
